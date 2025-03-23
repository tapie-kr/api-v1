import { LogSnag } from '@logsnag/node';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FormResponse } from '@tapie-kr/api-database';
import { AssetService } from '@/asset/asset.service';
import { FileType } from '@/asset/types/fileType';
import { MemberGuestPayload } from '@/auth/dto/member-payload.dto';
import { PrismaForeignKeyConstraintError, PrismaOperationFailedError, toTypedPrismaError } from '@/common/prisma/prisma.exception';
import { KSTDate } from '@/common/utils/date';
import { decodeFileNameKorean } from '@/common/utils/string';
import { EmailService } from '@/email/email.service';
import { EventService } from '@/event/event.services';
import { CreateFormDto, FormPreviewDto, UpdateFormDto } from '@/form/dto/form.dto';
import { CreateFormResponseDto, UpdateFormResponseDto } from '@/form/dto/response.dto';
import { FormRepository } from '@/form/repository/form.repository';

@Injectable()
export class FormService {
  private readonly eventLogger: LogSnag;

  constructor(private readonly formRepository: FormRepository,
    private readonly assetService: AssetService,
    private readonly emailService: EmailService,
    private readonly eventService: EventService) {
    this.eventLogger = this.eventService.getLogger();
  }
  async create(createFormDto: CreateFormDto) {
    return this.formRepository.create(createFormDto);
  }
  async update(id: number, updateFormDto: UpdateFormDto) {
    return this.formRepository.update(id, updateFormDto);
  }
  async remove(id: number) {
    try {
      await this.formRepository.remove(id);
    } catch (error) {
      const prismaException = toTypedPrismaError(error);

      if (prismaException instanceof PrismaForeignKeyConstraintError) {
        throw new BadRequestException('지원 폼을 삭제할 수 없습니다. 응답이 존재합니다');
      } else if (prismaException instanceof PrismaOperationFailedError) {
        throw new BadRequestException('지원 폼을 찾을 수 없습니다.');
      }

      throw error;
    }
  }
  async findAll() {
    return this.formRepository.findAll();
  }
  async findOne(id: number) {
    const form = await this.formRepository.findOne(id);

    if (!form) throw new NotFoundException('지원 폼을 찾을 수 없습니다');

    return form;
  }
  async findAllResponses(id: number) {
    return this.formRepository.findAllResponses(id);
  }
  async findOneResponse(responseId: string) {
    return this.formRepository.findOneResponse(responseId);
  }
  async getActiveForm() {
    const data = await this.formRepository.getActiveForm();

    if (!data) {
      return null;
    }

    return data.map(form => ({
      ...form,
      available: form.active && form.startsAt <= new KSTDate && form.endsAt >= new KSTDate,
    })) satisfies FormPreviewDto[];
  }
  async activateForm(id: number) {
    return this.formRepository.activateForm(id);
  }
  async deactivateForm(id: number) {
    return this.formRepository.deactivateForm(id);
  }
  async createResponse(formId: number, user: MemberGuestPayload, data: CreateFormResponseDto) {
    const isAvailable = await this.formRepository.isAvailableToAccessForm(formId);

    if (!isAvailable) {
      throw new BadRequestException('지원 가능한 상태가 아닙니다.');
    }

    const response =  await this.findResponse(formId, user);

    if (response) {
      throw new BadRequestException('이미 응답을 제출했습니다.');
    }

    return this.formRepository.createResponse(formId, user, data);
  }
  async findResponse(formId: number, user: MemberGuestPayload) {
    return this.formRepository.findResponse(formId, user.email);
  }
  async deleteResponse(responseId: string) {
    try {
      await this.formRepository.deleteResponseByID(responseId);
    } catch (error) {
      const prismaException = toTypedPrismaError(error);

      if (prismaException instanceof PrismaOperationFailedError) {
        throw new BadRequestException('응답을 찾을 수 없습니다');
      }

      throw error;
    }
  }
  async updateResponse(formId: number, user: MemberGuestPayload, data: UpdateFormResponseDto) {
    const isAvailable = await this.formRepository.isAvailableToAccessForm(formId);

    if (!isAvailable) {
      throw new BadRequestException('지원 가능한 상태가 아닙니다');
    }

    const response = await this.formRepository.findResponse(formId, user.email);

    if (!response) {
      const createResponseDto = {
        phoneNumber:        data.phoneNumber || '',
        introduction:       data.introduction || '',
        motivation:         data.motivation || '',
        expectedActivities: data.expectedActivities || '',
        reasonToChoose:     data.reasonToChoose || '',
      } satisfies CreateFormResponseDto;

      await this.eventLogger.identify({
        user_id:    user.email,
        properties: { name: user.name },
      });

      return this.createResponse(formId, user, createResponseDto);
    }

    const isSubmitted = await this.formRepository.isResponseSubmitted(formId, user);

    if (isSubmitted) {
      throw new BadRequestException('이미 제출한 응답은 수정할 수 없습니다');
    }

    await this.eventLogger.identify({
      user_id:    user.email,
      properties: { name: user.name },
    });

    return this.formRepository.updateResponse(formId, user, data);
  }
  async attachFileToResponse(formId: number, user: MemberGuestPayload, file: Express.Multer.File) {
    const isAvailable = await this.formRepository.isAvailableToAccessForm(formId);

    if (!isAvailable) {
      throw new BadRequestException('지원 가능한 상태가 아닙니다');
    }

    const isSubmitted = await this.formRepository.isResponseSubmitted(formId, user);

    if (isSubmitted) {
      throw new BadRequestException('이미 제출한 응답은 수정할 수 없습니다');
    }

    const originalFileName = decodeFileNameKorean(file.originalname);
    const filename = this.assetService.generateFilename(originalFileName);

    const asset = await this.assetService.uploadFile(new File([file.buffer], originalFileName),
      filename,
      FileType.FORM_PORTFOLIO,
      originalFileName);

    await this.eventLogger.track({
      channel:     'form',
      event:       '포트폴리오 파일 업로드',
      description: `${originalFileName} 파일 업로드됨.`,
      user_id:     user.email,
      icon:        '📁',
      notify:      true,
      tags:        {
        filename: originalFileName, path: asset.path, size: file.size,
      },
    });

    await this.formRepository.attachFileToResponse(formId, user, asset.uuid);
  }
  async getFileFromResponse(formId: number, user: MemberGuestPayload) {
    const { portfolio } = await this.formRepository.findResponse(formId, user.email);

    if (!portfolio) {
      throw new NotFoundException('포트폴리오 파일을 찾을 수 없습니다');
    }

    const { presignedUrl } = await this.assetService.getPresignedUrl(portfolio.uuid);

    return { presignedUrl };
  }
  async removeFileFromResponse(formId: number, user: MemberGuestPayload) {
    const isAvailable = await this.formRepository.isAvailableToAccessForm(formId);

    if (!isAvailable) {
      throw new BadRequestException('지원 가능한 상태가 아닙니다');
    }

    const isSubmitted = await this.formRepository.isResponseSubmitted(formId, user);

    if (isSubmitted) {
      throw new BadRequestException('이미 제출한 응답은 수정할 수 없습니다');
    }

    const { portfolio } = await this.formRepository.findResponse(formId, user.email);

    if (!portfolio) {
      throw new NotFoundException('포트폴리오 파일을 찾을 수 없습니다');
    }

    await this.eventLogger.track({
      channel: 'form',
      event:   '포트폴리오 파일 삭제',
      user_id: user.email,
      icon:    '📁',
      notify:  true,
    });

    return this.formRepository.removeFileFromResponse(formId, user);
  }
  async removeResponse(formId: number, user: MemberGuestPayload) {
    const isAvailable = await this.formRepository.isAvailableToAccessForm(formId);

    if (!isAvailable) {
      throw new BadRequestException('지원 가능한 상태가 아닙니다');
    }

    const isSubmitted = await this.formRepository.isResponseSubmitted(formId, user);

    if (isSubmitted) {
      throw new BadRequestException('이미 제출한 응답은 수정할 수 없습니다');
    }

    return this.formRepository.deleteResponse(formId, user);
  }
  async sendEmailSubmitted(user: MemberGuestPayload, response: FormResponse, formId: number) {
    try {
      const form = await this.formRepository.findOne(formId);

      await this.emailService.sendEmailHTMLWithArguments(
        'TAPIE <apply@email.tapie.kr>',
        user.email,
        'admin@tapie.kr',
        '테이피 지원서 제출이 완료되었습니다',
        'form-apply.html',
        {
          applicant_name:   user.name,
          email:            user.email,
          application_unit: {
            DEVELOPER: '개발자', DESIGNER: '디자이너',
          }[form.unit],
          student_id:          response.studentId,
          name:                user.name,
          self_introduction:   response.introduction,
          expected_activities: response.expectedActivities,
          reason_to_select:    response.reasonToChoose,
          instagram_handle:    '@sunrin_tapie',
          contact_phone:       '010-2310-4403',
          year:                '2025',
        },
      );
    } catch (error) {
      console.error(error);
    }
  }
  async submitResponse(formId: number, user: MemberGuestPayload) {
    const isAvailable = await this.formRepository.isAvailableToAccessForm(formId);

    if (!isAvailable) {
      throw new BadRequestException('지원 가능한 상태가 아닙니다');
    }

    const isSubmitted = await this.formRepository.isResponseSubmitted(formId, user);

    if (isSubmitted) {
      throw new BadRequestException('이미 응답을 제출했습니다.');
    }

    const response = await this.formRepository.findResponse(formId, user.email);

    if (!response) {
      throw new BadRequestException('응답이 존재하지 않습니다');
    }

    const {
      introduction,
      motivation,
      expectedActivities,
      reasonToChoose,
    } = response;

    if ([
      introduction,
      motivation,
      expectedActivities,
      reasonToChoose,
    ].some(value => value === '')) {
      throw new BadRequestException('응답 데이터가 비어있으면 제출할 수 없습니다.');
    }

    const returnResponse = await this.formRepository.submitResponse(formId, user);
    const form = await this.formRepository.findOne(formId);

    await this.eventLogger.track({
      channel:     'form',
      event:       '폼 응답 제출완료',
      description: '폼 응답이 제출되었습니다',
      user_id:     user.email,
      icon:        '📁',
      notify:      true,
      tags:        {
        unit: form.unit, name: form.name,
      },
    });

    await this.sendEmailSubmitted(user, response, formId);

    return returnResponse;
  }
  async isAvailableToAccessForm(formId: number) {
    return this.formRepository.isAvailableToAccessForm(formId);
  }
  async getPresignedUrl(responseId: string) {
    const response = await this.formRepository.findResponseById(responseId);

    if (!response) {
      throw new BadRequestException('응답을 찾을 수 없습니다');
    }

    if (!response.portfolio) {
      throw new BadRequestException('첨부된 파일이 없습니다.');
    }

    const asset = await this.assetService.getPresignedUrl(response.portfolio.uuid);

    return asset.presignedUrl;
  }
}
