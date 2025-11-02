/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/interceptors/response.interceptor.ts */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { encryptResponseBody } from 'src/common/utils/security.handler';

const logger = new Logger('EncryptResponseInterceptor');

@Injectable()
export class EncryptResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const response = http.getResponse();

    response.setHeader('Content-Type', 'text/plain');

    return next.handle().pipe(
      map((data) => {
        try {
          const encrypted = encryptResponseBody(data);
          return encrypted;
        } catch (err) {
          logger.error('Encryption failed', err);
          return encryptResponseBody({ error: 'ENCRYPTION_FAILED' });
        }
      }),
      tap({
        error: (err) => {
          try {
            const encryptedError = encryptResponseBody({
              error: err.message || 'SERVER_ERROR',
            });
            response.status(err.status || 500);
            response.send(encryptedError);
          } catch (e: any) {
            logger.error('Encryption failed in error handler', e);
            response.status(500).send('ENCRYPTION_FAILED');
          }
        },
      }),
    );
  }
}
