/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';

@Injectable()
export class KeycloakService {
  private serviceToken: { token: string; exp: number } | null = null;
  private BASE_URL = process.env.KEYCLOAK_URL!;

  constructor(private http: HttpService) {}

  private adminRealm = process.env.ADMIN_REALM!;
  private adminClientId = process.env.ADMIN_CLIENT_ID!;
  private adminClientSecret = process.env.ADMIN_CLIENT_SECRET!;

  private async getServiceAccountToken(): Promise<string> {
    if (this.serviceToken && this.serviceToken.exp > Date.now()) {
      return this.serviceToken.token;
    }

    const params = new URLSearchParams();
    params.append('client_id', this.adminClientId);
    params.append('client_secret', this.adminClientSecret);
    params.append('grant_type', 'client_credentials');

    const { data } = await firstValueFrom(this.http.post(`${this.BASE_URL}/realms/${this.adminRealm}/protocol/openid-connect/token`, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));

    this.serviceToken = {
      token: data.access_token,
      exp: Date.now() + data.expires_in * 1000 - 60000,
    };
    return this.serviceToken.token;
  }

  async registerUser(firstName: string, lastName: string | undefined, emailId: string, password: string, username: string): Promise<void> {
    const serviceToken = await this.getServiceAccountToken();
    await firstValueFrom(
      this.http.post(
        `${this.BASE_URL}/admin/realms/${this.adminRealm}/users`,
        {
          username,
          email: emailId,
          firstName: firstName,
          lastName: lastName,
          attributes: {
            mobile: '9876543210',
            department: 'IT',
            designation: 'Engineer',
          },
          enabled: true,
          emailVerified: true,
          credentials: [{ type: 'password', value: password, temporary: false }],
        },
        { headers: { Authorization: `Bearer ${serviceToken}` } },
      ),
    );
  }

  async getUserTokens(userName: string, password: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('client_id', this.adminClientId);
    params.append('client_secret', this.adminClientSecret);
    params.append('grant_type', 'password');
    params.append('username', userName);
    params.append('password', password);

    const { data } = await firstValueFrom(this.http.post(`${this.BASE_URL}/realms/${this.adminRealm}/protocol/openid-connect/token`, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));
    return data;
  }

  async refreshTokens(refreshToken: any, res: Response): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const params = new URLSearchParams();
    params.append('client_id', this.adminClientId);
    params.append('client_secret', this.adminClientSecret);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken as never);

    const { data } = await firstValueFrom(this.http.post(`${this.BASE_URL}/realms/${this.adminRealm}/protocol/openid-connect/token`, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));

    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60 * 1000,
    });

    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
