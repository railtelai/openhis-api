/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpStatus, Injectable } from '@nestjs/common';
import type { Response, Request } from 'express';
import { KeycloakService } from 'src/modules/shared/keycloak/keycloak.service';
import { decryptKeycloakToken, decryptString, encryptString } from 'src/common/utils/security.handler';
import { AuthServiceInterface } from 'src/interfaces';
import { EmailService } from 'src/modules/shared/email/email.service';
import { PinoLoggerService } from 'src/common/logger/pino.logger.service';
import { loginUserRequestValidator, registerUserRequestValidator } from 'src/modules/validators';
import { generateOTP } from 'src/common/utils/app.utils';
import { RedisService } from 'src/modules/shared/database/redis.service';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    private keyClock: KeycloakService,
    private emailService: EmailService,
    private logger: PinoLoggerService,
    private redisService: RedisService,
  ) {}

  async registerUser(body: registerUserRequestValidator, res: Response): Promise<any> {
    await this.keyClock.registerUser(body.firstName, body.lastName, body.emailId, body.password, body.emailId);
    res.status(HttpStatus.OK);
    return {
      data: 'SUCCESS',
    };
  }

  async login(body: loginUserRequestValidator, userAgent: string, res: Response, req: Request): Promise<any> {
    try {
      const keyClockData = await this.keyClock.getUserTokens(body.emailId, body.password);
      if (!keyClockData) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'INVALID_CREDENTIALS',
        };
      }

      const accessToken = keyClockData.access_token;
      const tempUserData = await decryptKeycloakToken(accessToken);
      const tempUserEmailId: string = tempUserData.email;
      const tempUserName: string = tempUserData.name;
      if (!tempUserEmailId || !tempUserName) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'INVALID_CREDENTIALS',
        };
      }

      if (!body.otp) {
        const otp: string = generateOTP();
        const tempEmailResponse = await this.emailService.sendLoginOtp({
          email: tempUserEmailId,
          userName: tempUserName,
          otp,
          type: 'login',
        });
        if (tempEmailResponse === 'SUCCESS') {
          const expiresAt = Date.now() + 5 * 60 * 1000;
          await this.redisService.setData(1, `${tempUserEmailId}-login`, JSON.stringify({ otp, expiresAt }), 5 * 60);
          const otpToken = await encryptString({
            expiresAt,
            userAgent,
            emailId: tempUserEmailId,
          });
          res.cookie('otp_token', otpToken, {
            httpOnly: true,
            maxAge: 30 * 60 * 1000,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
          });
          res.status(HttpStatus.OK);

          return {
            data: 'OTP_SENT',
          };
        } else {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR);
          return {
            data: 'SERVER_ERROR',
          };
        }
      }
      const cookies = req.cookies;
      const encOtpToken = cookies['otp_token'];
      if (!encOtpToken) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'UNAUTHORIZED',
        };
      }
      const otpTokenData: any = await decryptString(encOtpToken as never);
      if (otpTokenData.emailId !== tempUserEmailId || otpTokenData.userAgent !== userAgent) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'UNAUTHORIZED',
        };
      }
      if (Date.now() > otpTokenData.expiresAt) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'OTP_EXPIRED',
        };
      }
      const storedOtp = await this.redisService.getData(1, `${tempUserEmailId}-login`);
      const tempStoredOtpData = JSON.parse(storedOtp as never);

      if (!tempStoredOtpData || Date.now() > tempStoredOtpData.expiresAt) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'OTP_EXPIRED',
        };
      }
      if (tempStoredOtpData.otp !== body.otp) {
        res.status(HttpStatus.UNAUTHORIZED);
        return {
          data: 'INVALID_OTP',
        };
      }
      await this.redisService.delKey(1, `${tempUserEmailId}-login`);
      res.clearCookie('otp_token');

      const refreshToken = keyClockData.refresh_token;
      const browserToken = await encryptString(userAgent as any);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 30 * 60 * 1000,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      res.cookie('browser_token', browserToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      res.status(HttpStatus.OK);
      return {
        data: 'SUCCESS',
      };
    } catch (err) {
      this.logger.error('Keycloak login service error', err.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return {
        data: 'SERVER_ERROR',
      };
    }
  }
}
