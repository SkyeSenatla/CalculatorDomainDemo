// ================================================================
// DEMO 2 (Step 2B): THE VALIDATION ERROR PARSER
// ================================================================
// The "Validation Handshake" — translating .NET ProblemDetails
// into React-friendly per-field error messages.
//
// .NET ProblemDetails (RFC 7807) returns:
// {
//   "title": "One or more validation errors occurred.",
//   "status": 400,
//   "errors": {
//     "left":    ["The first number (left) is required."],
//     "operand": ["Invalid operation. Must be 0-3."]
//   }
// }
//
// We transform this into:
// {
//   left:    "The first number (left) is required.",
//   operand: "Invalid operation. Must be 0-3."
// }
// ================================================================

export function parseValidationErrors(axiosError) {
  // Step 1: Check if the server returned response data
  const data = axiosError?.response?.data;
  if (!data) {
    return { _generic: axiosError.message || "An unknown error occurred." };
  }

  // Step 2: Check for ProblemDetails "errors" object (RFC 7807)
  if (data.errors && typeof data.errors === "object") {
    const fieldErrors = {};
    for (const [field, messages] of Object.entries(data.errors)) {
      // .NET sends arrays of messages per field — we take the first one
      fieldErrors[field.toLowerCase()] = Array.isArray(messages)
        ? messages[0]
        : messages;
    }
    return fieldErrors;
  }

  // Step 3: Check for our custom middleware error shape
  if (data.detail) {
    return { _generic: data.detail };
  }

  // Step 4: Fallback
  return { _generic: data.title || "Validation failed. Please check your inputs." };
}
