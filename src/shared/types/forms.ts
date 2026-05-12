/**
 * Shared Form Types
 *
 * Common types used across form components
 */

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "file"
    | "date"
    | "datetime-local";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: unknown) => string | null;
  };
}

export interface FormConfig<TData = Record<string, unknown>> {
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (data: TData) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: Partial<TData>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormSubmissionResult {
  success: boolean;
  errors?: ValidationError[];
  data?: unknown;
}

export interface AddressFormData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}
