import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KeycloakService } from './modules/shared/keycloak/keycloak.service';
import { AuthMiddleware } from './middleware/middleware.service';
import { AuthModule } from './modules/api/modules/auth.module';
import { PinoLoggerService } from './common/logger/pino.logger.service';

@Module({
  imports: [AuthModule, HttpModule],
  providers: [KeycloakService, PinoLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).exclude('auth/register', 'auth/login', 'auth/refresh', 'auth/google').forRoutes('*');
  }
}
