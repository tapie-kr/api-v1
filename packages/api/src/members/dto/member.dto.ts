import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { MemberRole, MemberUnit } from '@tapie-kr/api-database';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';
import { SUNRIN_EMAIL_REGEX } from '@/common/constants/email';
import { MemberHistoryDto } from '@/members/dto/member-history.dto';
import { MemberLinkDto } from '@/members/dto/member-link.dto';
import { MemberSkillDto } from '@/members/dto/member-skill.dto';
import { PreviewAwardDto } from '@/portfolio/dto/award.dto';

export class MemberDto {
  @IsNumber()
  @ApiProperty({
    description: '회원 ID', format: 'uuid',
  })
  uuid: string;

  @IsString()
  @ApiProperty({
    description: '회원 이름', example: 'Jeewon Kwon',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: '학번', example: '10912',
  })
  studentID: number;

  @IsString()
  @ApiProperty({
    description: '회원 아이디', example: 'jeewonkwon',
  })
  username: string;

  @IsString()
  @Matches(SUNRIN_EMAIL_REGEX, {
    message: '선린 계정(@sunrint.hs.kr) 이메일만 사용할 수 있습니다.',
  })
  @ApiProperty({
    description: '회원 이메일 (선린 계정만 허용)', example: 'user@sunrint.hs.kr',
  })
  googleEmail: string;

  @IsEnum(MemberRole)
  @ApiProperty({
    description: '회원 역할', example: MemberRole.MEMBER, enum: MemberRole,
  })
  role: MemberRole;

  @IsEnum(MemberUnit)
  @ApiProperty({
    description: '회원 유닛', example: MemberUnit.DEVELOPER, enum: MemberUnit,
  })
  unit: MemberUnit;

  @IsNumber()
  @ApiProperty({
    description: '기수', example: 119,
  })
  generation: number;

  @IsString()
  @ApiProperty({
    description: '프로필 URI', example: 'https://tapie.kr/profile.png',
  })
  profileUri: string;
}

export class MemberPreviewDto extends OmitType(MemberDto, [
  'googleEmail',
  'role',
  'unit',
  'generation',
  'profileUri',
] as const) {
}

export class CreateMemberDto extends OmitType(MemberDto, ['uuid', 'profileUri'] as const) {
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {

}

export class PublicOnlyMemberDto extends OmitType(MemberDto, ['googleEmail'] as const) {
}

export class SpecificDetailMemberDto extends MemberDto {
  @IsBoolean()
  @ApiProperty({
    description: '특정 멤버의 졸업 여부', example: false,
  })
  isGraduated: boolean;

  @IsNumber()
  @ApiProperty({
    description: '특정 멤버의 권한', example: 0,
  })
  permissions: number;

  @ApiProperty({
    type:        () => MemberLinkDto,
    isArray:     true,
    description: '멤버의 링크 목록',
  })
  links: MemberLinkDto[];

  @ApiProperty({
    type:        () => PreviewAwardDto,
    isArray:     true,
    description: '멤버의 수상 목록',
  })
  awards: PreviewAwardDto[];

  @ApiProperty({
    type:        () => MemberSkillDto,
    isArray:     true,
    description: '멤버의 기술 목록',
  })
  skills: MemberSkillDto[];

  @ApiProperty({
    type:        () => MemberHistoryDto,
    isArray:     true,
    description: '멤버의 기록 목록',
  })
  history: MemberHistoryDto[];
}
