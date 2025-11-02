/* eslint-disable @typescript-eslint/no-explicit-any */
import { Body, Controller, Post, Headers, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthControllerInterface } from 'src/interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import { loginUserRequestValidator, registerUserRequestValidator } from 'src/modules/validators';

@Controller('auth')
export class AuthController implements AuthControllerInterface {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() body: registerUserRequestValidator, @Res({ passthrough: true }) res: Response): Promise<any> {
    return await this.authService.registerUser(body, res);
  }

  @Post('login')
  async login(@Body() body: loginUserRequestValidator, @Headers('user-agent') ua: string, @Res({ passthrough: true }) res: Response, @Req() req: Request): Promise<any> {
    return await this.authService.login(body, ua, res, req);
  }
}
