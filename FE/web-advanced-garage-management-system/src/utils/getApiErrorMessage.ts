/**
 * Extract error message from API error response.
 * Handles various response formats: message, Message, errors[], errors{}, title, etc.
 */
type ApiErrorData = {
  message?: string;
  Message?: string;
  error?: string;
  Error?: string;
  title?: string;
  errors?:
    | Array<{ message?: string; Message?: string }>
    | Record<string, string[]>;
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

  // errors{} object — ASP.NET Core validation format: { "Field": ["msg1"] }
  if (data.errors && !Array.isArray(data.errors) && typeof data.errors === "object") {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey) {
      const msgs = (data.errors as Record<string, string[]>)[firstKey];
      if (Array.isArray(msgs) && msgs.length > 0 && typeof msgs[0] === "string") {
        return msgs[0];
      }
    }
  }

  // title — ASP.NET Core default problem details
  if (data.title && typeof data.title === "string") {
    return data.title;
  }

  return fallback;
}
