/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { PinoLoggerService } from 'src/common/logger/pino.logger.service';
import type { sendOtpDataType } from 'src/types/emaildatatypes/email.types.';

@Injectable()
export class EmailService {
  constructor(private readonly logger: PinoLoggerService) {}

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  private async sendOtpEmail(data: sendOtpDataType): Promise<'SUCCESS' | 'ERROR'> {
    const subject = `Your OTP for ${data.type === 'login' ? 'Login' : 'Signup'} – OpenHIS`;
    const htmlBody = `
    <div style="max-width:600px;margin:auto;padding:30px;border:1px solid #e0e0e0;border-radius:8px;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e0e0e0;padding-bottom:20px;">
        <h1 style="color:#0055A4;font-size:24px;margin:0;">OpenHIS</h1>
        <p style="margin:4px 0;font-size:14px;color:#777;">Secure OTP Notification</p>
      </div>
      <div style="padding-top:20px;">
        <p style="font-size:16px;color:#333;">Dear <strong>${data.userName}</strong>,</p>
        <p style="font-size:15px;color:#444;">
          Please use the following One-Time Password (OTP) to ${data.type === 'login' ? 'log in to your account' : 'complete your signup'}.
        </p>
        <div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;font-size:28px;letter-spacing:6px;color:#D32F2F;font-weight:bold;background:#f8f8f8;padding:12px 20px;border-radius:6px;border:1px solid #dcdcdc;">
            ${data.otp}
          </span>
        </div>
        <p style="font-size:14px;color:#555;">This OTP is valid for a limited time. Do not share it with anyone.</p>
        <p style="font-size:14px;color:#555;">If you did not request this OTP, please ignore this email.</p>
        <p style="margin-top:30px;font-size:14px;color:#333;">
          Regards,<br/><strong>OpenHIS Team</strong>
        </p>
      </div>
      <div style="border-top:1px solid #e0e0e0;padding-top:15px;margin-top:30px;font-size:12px;color:#888;text-align:center;">
        © ${String(new Date().getFullYear())} OpenHIS. All rights reserved.
      </div>
    </div>
    `;
    return this.send(data.email, subject, htmlBody);
  }

  async sendLoginOtp(data: sendOtpDataType): Promise<'SUCCESS' | 'ERROR'> {
    return this.sendOtpEmail(data);
  }

  async sendSignupOtp(data: sendOtpDataType): Promise<'SUCCESS' | 'ERROR'> {
    return this.sendOtpEmail(data);
  }

  async send(to: string, subject: string, html: string): Promise<'SUCCESS' | 'ERROR'> {
    try {
      await this.transporter.sendMail({
        from: `OpenHIS Helpdesk <noreply.emailserviceapi@gmail.com>`,
        to,
        subject,
        html,
      });
      return 'SUCCESS';
    } catch (error: any) {
      this.logger.error('Email send failed:', error.message);
      return 'ERROR';
    }
  }
}
