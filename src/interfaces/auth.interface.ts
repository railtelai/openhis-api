/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response, Request } from 'express';
import type { loginUserRequestValidator, registerUserRequestValidator } from '../modules/validators';

export interface AuthControllerInterface {
  registerUser(body: registerUserRequestValidator, res: Response): Promise<any>;

  login(body: loginUserRequestValidator, ua: string, res: Response, req: Request): Promise<any>;
}

export interface AuthServiceInterface {
  registerUser(body: registerUserRequestValidator, res: Response): Promise<any>;

  login(body: loginUserRequestValidator, userAgent: string, res: Response, req: Request): Promise<any>;
}
