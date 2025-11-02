import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class registerUserRequestValidator {
  @IsNotEmpty({ message: 'Email ID is required' })
  @IsString()
  emailId: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  lastName: string;
}

export class loginUserRequestValidator {
  @IsNotEmpty({ message: 'Email ID is required' })
  @IsString()
  emailId: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  otp: string;
}
