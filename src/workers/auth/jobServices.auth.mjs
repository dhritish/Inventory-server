import * as authModels from '../../auth/authModels.mjs';
import { getTransporter } from '../../config/mailer.mjs';

export const getOTP = () => {
  const otp = Math.floor(Math.random() * 900000) + 100000;
  return otp.toString();
};

export const addOTP = body => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5);
  body.expiresAt = date;
  console.log(body);
  return authModels.UserOTP.create(body);
};

export const sendOTP = body => {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: body.role === 'customer' ? body.email : process.env.SMTP_USER,
    subject: 'OTP for sign up',
    text: `Your OTP is ${body.otp}`,
  };
  return transporter.sendMail(mailOptions);
};
