export type ValidationRule = {
  validate: (value: unknown) => boolean;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export const validators = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: message || `Must be at most ${max} characters`
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    validate: (value) =>
      typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  url: (message = 'Invalid URL'): ValidationRule => ({
    validate: (value) => {
      try {
        new URL(value as string);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'number' && value >= min,
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === 'number' && value <= max,
    message: message || `Must be at most ${max}`
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    validate: (value) => typeof value === 'string' && regex.test(value),
    message
  }),

  nostrPubkey: (message = 'Invalid Nostr public key'): ValidationRule => ({
    validate: (value) =>
      typeof value === 'string' && /^[0-9a-f]{64}$/.test(value),
    message
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule => ({
    validate: (value) => typeof value === 'number' && value > 0,
    message
  }),

  percentage: (message = 'Must be between 0 and 100'): ValidationRule => ({
    validate: (value) => typeof value === 'number' && value >= 0 && value <= 100,
    message
  })
};

export function validate(value: unknown, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: { [K in keyof T]?: ValidationRule[] }
): { valid: boolean; errors: { [K in keyof T]?: string[] } } {
  const errors: { [K in keyof T]?: string[] } = {};
  let valid = true;

  for (const [field, rules] of Object.entries(schema)) {
    if (rules) {
      const result = validate(values[field as keyof T], rules as ValidationRule[]);
      if (!result.valid) {
        valid = false;
        errors[field as keyof T] = result.errors;
      }
    }
  }

  return { valid, errors };
}

// Form state management
export type FormState<T> = {
  values: T;
  errors: { [K in keyof T]?: string[] };
  touched: { [K in keyof T]?: boolean };
  isValid: boolean;
  isSubmitting: boolean;
};

export function createFormState<T extends Record<string, unknown>>(
  initialValues: T
): FormState<T> {
  return {
    values: { ...initialValues },
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false
  };
}
