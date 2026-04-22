"use client"; // Error boundaries MUST be client components in Next.js

// This file acts as a React Error Boundary for the /history route.
// If the .NET API is offline or the fetch throws, Next.js catches the error here
// instead of crashing the entire app. The user sees a friendly message and a reset button.
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto py-10 px-6 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        Backend Offline or Data Error
      </h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      {/* reset() re-renders the route segment, retrying the data fetch */}
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
