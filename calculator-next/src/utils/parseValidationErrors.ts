import { AxiosError } from "axios";

interface ValidationErrors {
  [key: string]: string;
}

export function parseValidationErrors(axiosError: AxiosError<Record<string, unknown>>): ValidationErrors {
  const data = axiosError?.response?.data;
  if (!data) {
    return { _generic: axiosError.message || "An unknown error occurred." };
  }

  // ProblemDetails "errors" object (RFC 7807)
  if (data.errors && typeof data.errors === "object") {
    const fieldErrors: ValidationErrors = {};
    for (const [field, messages] of Object.entries(data.errors as Record<string, string[]>)) {
      fieldErrors[field.toLowerCase()] = Array.isArray(messages)
        ? messages[0]
        : (messages as unknown as string);
    }
    return fieldErrors;
  }

  // Custom middleware error shape
  if (data.detail) {
    return { _generic: data.detail as string };
  }

  return { _generic: (data.title as string) || "Validation failed. Please check your inputs." };
}
