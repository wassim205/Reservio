import {
  validateEmail,
  validatePassword,
  validateFullname,
  validateLoginForm,
  validateRegisterForm,
  hasErrors,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('returns error for empty email', () => {
      expect(validateEmail('')).toBe('Email requis');
      expect(validateEmail('   ')).toBe('Email requis');
    });

    it('returns error for invalid email format', () => {
      expect(validateEmail('invalid')).toBe('Email invalide');
      expect(validateEmail('invalid@')).toBe('Email invalide');
      expect(validateEmail('@example.com')).toBe('Email invalide');
      expect(validateEmail('test@.com')).toBe('Email invalide');
    });

    it('returns undefined for valid email', () => {
      expect(validateEmail('test@example.com')).toBeUndefined();
      expect(validateEmail('user.name@domain.org')).toBeUndefined();
      expect(validateEmail('test+tag@example.co.uk')).toBeUndefined();
    });
  });

  describe('validatePassword', () => {
    it('returns error for empty password', () => {
      expect(validatePassword('')).toBe('Mot de passe requis');
    });

    it('returns error for short password', () => {
      expect(validatePassword('12345')).toBe('Le mot de passe doit contenir au moins 6 caractères');
      expect(validatePassword('abc')).toBe('Le mot de passe doit contenir au moins 6 caractères');
    });

    it('returns undefined for valid password', () => {
      expect(validatePassword('123456')).toBeUndefined();
      expect(validatePassword('mySecurePassword')).toBeUndefined();
    });
  });

  describe('validateFullname', () => {
    it('returns error for empty fullname', () => {
      expect(validateFullname('')).toBe('Nom requis');
      expect(validateFullname('   ')).toBe('Nom requis');
    });

    it('returns error for short fullname', () => {
      expect(validateFullname('A')).toBe('Le nom doit contenir au moins 2 caractères');
    });

    it('returns undefined for valid fullname', () => {
      expect(validateFullname('Jean')).toBeUndefined();
      expect(validateFullname('Jean Dupont')).toBeUndefined();
    });
  });

  describe('validateLoginForm', () => {
    it('returns errors for empty form', () => {
      const errors = validateLoginForm('', '');
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it('returns empty object for valid form', () => {
      const errors = validateLoginForm('test@example.com', 'password123');
      expect(errors).toEqual({});
    });

    it('returns only email error if password is valid', () => {
      const errors = validateLoginForm('invalid', 'password123');
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeUndefined();
    });
  });

  describe('validateRegisterForm', () => {
    it('returns errors for empty form', () => {
      const errors = validateRegisterForm('', '', '', false);
      expect(errors.fullname).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(errors.terms).toBeDefined();
    });

    it('returns terms error if not accepted', () => {
      const errors = validateRegisterForm('Jean Dupont', 'test@example.com', 'password123', false);
      expect(errors.terms).toBe('Vous devez accepter les conditions');
    });

    it('returns empty object for valid form with terms accepted', () => {
      const errors = validateRegisterForm('Jean Dupont', 'test@example.com', 'password123', true);
      expect(errors).toEqual({});
    });
  });

  describe('hasErrors', () => {
    it('returns false for empty object', () => {
      expect(hasErrors({})).toBe(false);
    });

    it('returns true for object with errors', () => {
      expect(hasErrors({ email: 'Error' })).toBe(true);
      expect(hasErrors({ email: 'Error', password: 'Error' })).toBe(true);
    });
  });
});
