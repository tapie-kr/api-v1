import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { map } from 'rxjs/operators';
import { GoogleAuthDto } from '@/auth/dto/google-auth.dto';
import { MemberPayloadDto, TokenType } from '@/auth/dto/member-payload.dto';
import { JWT_CONSTANTS } from '@/common/constants/auth/jwt.constants';
import { isAllowedEmailDomain } from '@/common/constants/email';
import { omit } from '@/common/utils/object';
import { GetMemberMethod } from '@/members/enums/member.enum';
import { MembersService } from '@/members/service/members.service';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly membersService: MembersService,
    private readonly httpService: HttpService) {
  }
  async googleLogin(googleUser: GoogleAuthDto, service: string) {
    if (!googleUser) {
      throw new UnauthorizedException('잘못된 구글 인증 정보입니다.');
    }

    if (!isAllowedEmailDomain(googleUser.email)) {
      throw new UnauthorizedException('선린 계정(@sunrint.hs.kr)으로만 로그인할 수 있습니다.');
    }

    const existsMember = await this.membersService.getMember(GetMemberMethod.GOOGLE_EMAIL,
      googleUser.email);

    if (!existsMember && service === 'website') {
      throw new UnauthorizedException('계정이 없습니다.');
    }

    let payload: MemberPayloadDto;
    let refreshPayload: MemberPayloadDto;

    if (!existsMember && service == 'form') {
      const googleProfileData = await new Promise<GoogleProfile>(async (resolve, reject) => {
        this.httpService.get('/userinfo/v2/me', { headers: { Authorization: `Bearer ${googleUser.accessToken}` } })
          .pipe(map(response => response.data))
          .subscribe({
            next:  data => resolve(data),
            error: _error => {
              reject(new InternalServerErrorException('구글 계정 정보를 가져오던 중 오류가 발생했습니다.'));
            },
          });
      });

      payload = {
        type:  TokenType.ACCESS_TOKEN,
        email: googleProfileData.email,
        name:  googleProfileData.name,
      } satisfies MemberPayloadDto;
    } else {
      payload = {
        type:  TokenType.ACCESS_TOKEN,
        email: existsMember.googleEmail,
        name:  existsMember.name,
        id:    existsMember.uuid,
      } satisfies MemberPayloadDto;
    }

    refreshPayload = {
      ...payload,
      type: TokenType.REFRESH_TOKEN,
    } satisfies MemberPayloadDto;

    const jwtSecret = this.configService.get('JWT_SECRET');
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');

    const accessToken = this.jwtService.sign(payload, {
      secret:    jwtSecret,
      expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret:    refreshSecret,
      expiresIn: JWT_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
    });

    return {
      tokens: {
        accessToken, refreshToken,
      },
      user: payload,
    };
  }
  async validateToken(token: string) {
    try {
      const jwtSecret = this.configService.get('JWT_SECRET');

      return this.jwtService.verifyAsync<MemberPayloadDto>(token, { secret: jwtSecret });
    } catch (_error) {
      throw new UnauthorizedException('잘못된 리프레시 토큰입니다');
    }
  }
  async refreshAccessToken(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');

      const verifiedPayload =
        await this.jwtService.verifyAsync<MemberPayloadDto>(refreshToken, { secret: refreshSecret });

      if (verifiedPayload.type !== TokenType.REFRESH_TOKEN) {
        throw new UnauthorizedException('Invalid token type');
      }

      const payload = omit<MemberPayloadDto>(verifiedPayload, ['iat', 'exp']);

      payload.type = TokenType.ACCESS_TOKEN;

      const jwtSecret = this.configService.get('JWT_SECRET');

      const accessToken = this.jwtService.sign(payload, {
        secret:    jwtSecret,
        expiresIn: '2h',
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('잘못된 토큰입니다', error);
    }
  }
}

interface GoogleProfile {
  family_name:    string;
  name:           string;
  picture:        string;
  email:          string;
  given_name:     string;
  id:             string;
  verified_email: boolean;
}
