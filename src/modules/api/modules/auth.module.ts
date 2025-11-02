import { Module } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { HttpModule } from '@nestjs/axios';
import { KeycloakService } from 'src/modules/shared/keycloak/keycloak.service';
import { AuthController } from '../controllers/auth.controller';
import { EmailService } from 'src/modules/shared/email/email.service';
import { PinoLoggerService } from 'src/common/logger/pino.logger.service';
import { RedisService } from 'src/modules/shared/database/redis.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [AuthService, KeycloakService, EmailService, PinoLoggerService, RedisService],
})
export class AuthModule {}
