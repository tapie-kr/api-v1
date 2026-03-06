import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { PrivatePreviewAssetDTO } from '@/asset/dto/asset.dto';

export class FormResponseDto {
  @IsUUID()
  @ApiProperty({ description: '응답 UUID' })
  uuid: string;

  @IsNumber()
  @ApiProperty({ description: '폼 ID' })
  formId: number;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: '멤버 UUID' })
  memberUUID?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: '포트폴리오 UUID' })
  portfolioAssetUUID?: string;

  @IsString()
  @ApiProperty({ description: '이름' })
  name: string;

  @IsString()
  @ApiProperty({ description: '학번' })
  studentId: string;

  @IsEmail()
  @ApiProperty({ description: '구글 이메일' })
  googleEmail: string;

  @IsPhoneNumber()
  @ApiProperty({ description: '전화번호' })
  phoneNumber: string;

  @IsString()
  @ApiProperty({ description: '소개' })
  introduction: string;

  @IsString()
  @ApiProperty({ description: '동기' })
  motivation: string;

  @IsString()
  @ApiProperty({ description: '기대 활동' })
  expectedActivities: string;

  @IsString()
  @ApiProperty({ description: '선택 이유' })
  reasonToChoose: string;

  @IsString()
  @ApiProperty({
    description: '지금까지 사용해 본 서비스 중 한 가지를 떠올리고, 해당 서비스를 만든 개발자, 기획자, 디자이너 등에게 직접 질문할 수 있다면 누구에게 무엇을 묻고 싶은지',
  })
  creatorQuestion: string;

  @IsDate()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @IsDate()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @IsDate()
  @ApiProperty({ description: '제출일' })
  submittedAt: Date;

  @IsBoolean()
  @ApiProperty({ description: '제출 여부' })
  submitted: boolean;
}

export type CreateFormResponseDtoType = Omit<FormResponseDto, 'id'>;
export type UpdateFormResponseDtoType = Partial<CreateFormResponseDtoType>;

export class CreateFormResponseDto extends OmitType(FormResponseDto, [
  'uuid',
  'formId',
  'memberUUID',
  'portfolioAssetUUID',
  'name',
  'studentId',
  'googleEmail',
  'createdAt',
  'updatedAt',
  'submitted',
  'submittedAt',
] as const) {
}

export class UpdateFormResponseDto extends PartialType(CreateFormResponseDto) {
}

export class PreviewPrivateResponseDto extends OmitType(FormResponseDto, ['portfolioAssetUUID'] as const) {
  @ApiProperty({ description: '포트폴리오' })
  portfolio: PrivatePreviewAssetDTO;
}
