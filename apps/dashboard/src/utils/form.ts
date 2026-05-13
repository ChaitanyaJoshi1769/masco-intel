/**
 * Form validation utilities
 */

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  value?: any;
  validate?: (val: any) => boolean;
}

export interface FieldError {
  [key: string]: string;
}

/**
 * Validate a single field against rules
 */
export function validateField(
  value: any,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.toString().trim() === '') {
          return rule.message;
        }
        break;

      case 'email':
        if (
          value &&
          !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ) {
          return rule.message;
        }
        break;

      case 'min':
        if (value && value.length < rule.value) {
          return rule.message;
        }
        break;

      case 'max':
        if (value && value.length > rule.value) {
          return rule.message;
        }
        break;

      case 'pattern':
        if (value && !rule.value.test(value)) {
          return rule.message;
        }
        break;

      case 'custom':
        if (rule.validate && !rule.validate(value)) {
          return rule.message;
        }
        break;
    }
  }

  return null;
}

/**
 * Validate all fields in a form
 */
export function validateForm(
  formData: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): FieldError {
  const errors: FieldError = {};

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(formData[field], rules);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Format form data for submission
 */
export function formatFormData(
  data: Record<string, any>,
  formatter?: (key: string, value: any) => [string, any]
): Record<string, any> {
  const formatted: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (formatter) {
      const [formattedKey, formattedValue] = formatter(key, value);
      formatted[formattedKey] = formattedValue;
    } else {
      formatted[key] = value;
    }
  }

  return formatted;
}

/**
 * Merge form errors
 */
export function mergeErrors(
  ...errorObjects: FieldError[]
): FieldError {
  return Object.assign({}, ...errorObjects);
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: FieldError): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get error for specific field
 */
export function getFieldError(
  errors: FieldError,
  field: string
): string | null {
  return errors[field] || null;
}

/**
 * Clear specific field error
 */
export function clearFieldError(
  errors: FieldError,
  field: string
): FieldError {
  const { [field]: _, ...rest } = errors;
  return rest;
}

/**
 * Clear all errors
 */
export function clearErrors(): FieldError {
  return {};
}

/**
 * Common validation schemas
 */
export const CommonValidation = {
  email: (message = 'Invalid email address'): ValidationRule => ({
    type: 'email',
    message,
  }),

  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
  }),

  minLength: (
    length: number,
    message = `Minimum ${length} characters required`
  ): ValidationRule => ({
    type: 'min',
    value: length,
    message,
  }),

  maxLength: (
    length: number,
    message = `Maximum ${length} characters allowed`
  ): ValidationRule => ({
    type: 'max',
    value: length,
    message,
  }),

  password: (message = 'Password must be at least 8 characters'): ValidationRule => ({
    type: 'min',
    value: 8,
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule => ({
    type: 'pattern',
    value: /^https?:\/\/.+/,
    message,
  }),

  phone: (message = 'Invalid phone number'): ValidationRule => ({
    type: 'pattern',
    value: /^\+?[1-9]\d{1,14}$/,
    message,
  }),

  custom: (
    validate: (val: any) => boolean,
    message = 'Invalid value'
  ): ValidationRule => ({
    type: 'custom',
    validate,
    message,
  }),
};
