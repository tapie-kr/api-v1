/** 선린인터넷고등학교 허용 이메일 도메인 */
export const ALLOWED_EMAIL_DOMAIN = '@sunrint.hs.kr' as const;

/** 기본 어드민 권한이 부여된 계정 (하드코딩) */
export const ADMIN_EMAIL = 'tapie@sunrint.hs.kr' as const;

/** @sunrint.hs.kr 도메인 정규식 (대소문자 무시) */
export const SUNRIN_EMAIL_REGEX = /^[^@]+@sunrint\.hs\.kr$/i;

export function isAllowedEmailDomain(email: string): boolean {
  return SUNRIN_EMAIL_REGEX.test(email);
}
