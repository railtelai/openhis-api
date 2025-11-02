export type sendOtpDataType = {
  otp: string;
  email: string;
  userName: string;
  type: 'login' | 'signup';
};
