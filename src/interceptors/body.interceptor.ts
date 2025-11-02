/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Logger } from '@nestjs/common';
import { decryptRequestBody } from 'src/common/utils/security.handler';

const logger = new Logger('DecryptBodyInterceptor');

@Injectable()
export class DecryptBodyInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (typeof req.body === 'string' && !req.body.trim().startsWith('{')) {
      try {
        const decryptedBody = await decryptRequestBody(req.body as never);
        req.body = decryptedBody;
      } catch (err) {
        logger.error('Decryption failed:', err.message);
      }
    }

    return next.handle();
  }
}
