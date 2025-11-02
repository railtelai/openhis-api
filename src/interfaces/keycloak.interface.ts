/* eslint-disable @typescript-eslint/no-explicit-any */

export interface KeycloakServiceInterface {
  registerUser(emailId: string, password: string, username: string): Promise<void>;

  getUserTokens(userName: string, password: string): Promise<any>;

  refreshTokens(refreshToken: string, res: Response): Promise<void>;
}
