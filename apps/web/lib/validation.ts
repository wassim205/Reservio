import { VALIDATION } from './types';

export interface ValidationErrors {
  fullname?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email requis';
  }
  if (!VALIDATION.email.pattern.test(email)) {
    return VALIDATION.email.message;
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Mot de passe requis';
  }
  if (password.length < VALIDATION.password.minLength) {
    return VALIDATION.password.message;
  }
  return undefined;
}

export function validateFullname(fullname: string): string | undefined {
  if (!fullname.trim()) {
    return 'Nom requis';
  }
  if (fullname.trim().length < VALIDATION.fullname.minLength) {
    return VALIDATION.fullname.message;
  }
  return undefined;
}

export function validateLoginForm(email: string, password: string): ValidationErrors {
  const errors: ValidationErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return errors;
}

export function validateRegisterForm(
  fullname: string,
  email: string,
  password: string,
  acceptTerms: boolean
): ValidationErrors {
  const errors: ValidationErrors = {};

  const fullnameError = validateFullname(fullname);
  if (fullnameError) errors.fullname = fullnameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!acceptTerms) {
    errors.terms = 'Vous devez accepter les conditions';
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
