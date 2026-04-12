import * as authJobServices from './jobServices.auth.mjs';

export const signup = async body => {
  const otp = authJobServices.getOTP();
  body.otp = otp;
  await authJobServices.addOTP(body);
  await authJobServices.sendOTP(body);
};
