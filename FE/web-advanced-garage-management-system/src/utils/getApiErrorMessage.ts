/**
 * Extract error message from API error response.
 * Handles various response formats: message, Message, errors[], etc.
 */
type ApiErrorData = {
  message?: string;
  Message?: string;
  error?: string;
  Error?: string;
  errors?: Array<{ message?: string; Message?: string }>;
};

type ApiError = {
  response?: { data?: ApiErrorData };
  message?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  const err = error as ApiError;
  const data = err?.response?.data;

  if (!data) {
    return err?.message && typeof err.message === "string"
      ? err.message
      : fallback;
  }

  // message (lowercase) - most common from .NET/JSON APIs
  if (data.message && typeof data.message === "string") {
    return data.message;
  }

  // Message (PascalCase) - some .NET APIs
  if (data.Message && typeof data.Message === "string") {
    return data.Message;
  }

  // error / Error
  if (data.error && typeof data.error === "string") {
    return data.error;
  }
  if (data.Error && typeof data.Error === "string") {
    return data.Error;
  }

  // errors[] array (validation errors)
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    const msg = first?.message ?? first?.Message;
    if (typeof msg === "string") return msg;
  }

  return fallback;
}
