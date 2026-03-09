// ================================================================
// STEP 3 (continued): File-Based Routing — The History Page
// ================================================================
//
// TALKING POINT: "To create this route, we didn't install anything or
// edit a config file. We just created:
//   src/app/history/page.tsx
//
// Next.js sees the folder name 'history' and automatically maps it
// to the URL path '/history'. The file MUST be named 'page.tsx' —
// that's the convention Next.js uses to identify route pages.
//
// Other special file names in the App Router:
//   layout.tsx  → wraps the page (persistent UI like nav bars)
//   loading.tsx → shown while the page is loading (Suspense boundary)
//   error.tsx   → shown when the page throws an error
//   not-found.tsx → custom 404 page
//
// Compare to Vite + React Router:
//   Vite:    <Route path='/history' element={<HistoryPage />} />
//   Next.js: Just create src/app/history/page.tsx — done!"
// ================================================================
//
// NOTE: This is also a Server Component (no "use client").
// In a real app, we could fetch calculation history directly from the
// database HERE on the server — no useEffect, no loading spinner,
// no CORS issues. The data would be in the HTML before it reaches the browser.
// That's the power of Server Components.
// ================================================================

import Link from "next/link";

export default function HistoryPage() {
  // ================================================================
  // TALKING POINT: "Notice there's no useEffect or useState here.
  // In our Vite app, we had useCalculations() that called fetchCalculations()
  // in a useEffect on mount, with loading states and error handling.
  //
  // In Next.js, because this is a Server Component, we COULD do:
  //   const history = await db.calculations.findMany();
  // Right here. No API call. No loading state. The data is ready
  // before the HTML is sent to the browser. We'll explore this in
  // a future demo when we connect to our .NET API."
  // ================================================================

  // Placeholder data to demonstrate the page structure
  const mockHistory = [
    { id: 1, left: 10, operation: "+", right: 5, result: 15 },
    { id: 2, left: 20, operation: "-", right: 8, result: 12 },
    { id: 3, left: 6, operation: "×", right: 7, result: 42 },
    { id: 4, left: 100, operation: "÷", right: 4, result: 25 },
  ];

  return (
    <main className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Calculation History
      </h1>

      {/* ================================================================
          This list renders on the SERVER. In a real app, the data would
          come from a database query — not from a client-side API call.
          The browser receives ready-made HTML, not a blank page that
          fills in after JavaScript runs.
          ================================================================ */}
      <div className="space-y-3">
        {mockHistory.map((calc) => (
          <div
            key={calc.id}
            className="p-4 bg-white border-l-4 border-indigo-500 rounded-r-lg shadow-sm"
          >
            <p className="text-gray-700 font-medium">
              {calc.left} {calc.operation} {calc.right} = {" "}
              <span className="text-indigo-600 font-bold">{calc.result}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Navigation back to home — uses <Link> for client-side nav */}
      <div className="mt-6">
        <Link
          href="/"
          className="text-indigo-600 underline hover:text-indigo-800 transition-colors"
        >
          ← Back to Calculator
        </Link>
      </div>
    </main>
  );
}
