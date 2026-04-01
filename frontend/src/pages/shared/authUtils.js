export const AUTH_METHODS = {
  EMAIL_OTP: 'email_otp',
  SMS_OTP: 'sms_otp',
};

export function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export function getErrorMessage(err, fallback) {
  return err?.response?.data?.erro || err?.message || fallback;
}
