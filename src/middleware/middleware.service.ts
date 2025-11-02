/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, NextFunction } from 'express';
import type { Response } from 'express';
import { PinoLoggerService } from 'src/common/logger/pino.logger.service';
import { KeycloakService } from 'src/modules/shared/keycloak/keycloak.service';
import { decryptKeycloakToken, decryptString } from 'src/common/utils/security.handler';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private keycloakService: KeycloakService,
    private readonly logger: PinoLoggerService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const cookies = req.cookies;
    const ua = req.headers['user-agent'] as string;

    const encAccessToken = cookies['access_token'];
    const encBrowserToken = cookies['browser_token'];
    const encRefreshToken = cookies['refresh_token'];

    if (!encAccessToken || !encBrowserToken || !encRefreshToken) {
      throw new UnauthorizedException();
    }
    const browserToken = await decryptString(encBrowserToken as never);
    if (browserToken !== ua) {
      throw new UnauthorizedException();
    }

    try {
      const accessToken: any = await decryptKeycloakToken(encAccessToken);
      if (!accessToken) {
        throw new UnauthorizedException();
      }

      if (Date.now() / 1000 > accessToken.exp) {
        throw new UnauthorizedException();
      }

      req['user'] = {
        sub: accessToken.sub,
        username: accessToken.preferred_username,
        email: accessToken.email,
        roles: accessToken.realm_access?.roles || [],
        exp: accessToken.exp,
      };
      const originalSend = res.send.bind(res);
      (res as any).send = async (body?: any): Promise<Response> => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            await this.keycloakService.refreshTokens(encRefreshToken, res);
          } catch (err) {
            this.logger.error('Refresh failed:', err.message);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalSend(body);
      };

      next();
    } catch (e) {
      this.logger.error('Authentication failed:', e.message);
      throw new UnauthorizedException();
    }
  }
}
