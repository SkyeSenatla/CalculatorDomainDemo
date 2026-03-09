// ================================================================
// STEP 3: File-Based Routing — The Home Page (src/app/page.tsx)
// ================================================================
//
// TALKING POINT: "In our Vite app, we had to install react-router-dom,
// create a BrowserRouter, define <Route> components, and manually wire
// up every path. In Next.js, routing is AUTOMATIC based on the file system:
//
//   src/app/page.tsx         → maps to '/'       (this file!)
//   src/app/history/page.tsx → maps to '/history' (Step 3 continued)
//
// No router config. No <Route path='...'> elements. Just create a folder
// with a page.tsx inside it, and Next.js creates the route for you.
//
// Compare this to our Vite App.jsx where we had:
//   <Route path='/login' element={<LoginPage />} />
//   <Route path='/my-calculations' element={...} />
//
// Here, we just create folders. That's the file-based routing mental model."
// ================================================================
//
// IMPORTANT: This file has NO "use client" directive at the top.
// That means it is a SERVER Component by default.
// It renders on the server and sends plain HTML to the browser.
// The <Calculator /> child IS a Client Component (it has "use client"),
// so Next.js will hydrate just that part with JavaScript.
// ================================================================

import Link from "next/link";
import Calculator from "@/components/Calculator";

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-6">
      {/* ================================================================
          This <h1> renders on the SERVER — no JavaScript sent for it.
          Open DevTools → Network → JS tab to prove it: this text is in
          the initial HTML response, not in a JS bundle.
          ================================================================ */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Calculator Home
      </h1>

      {/* ================================================================
          <Calculator /> is a Client Component ("use client" in its file).
          Next.js knows to hydrate this part — sending the JS needed for
          useState, onClick, etc. The rest of this page stays server-only.
          This is the "Islands of Interactivity" pattern.
          ================================================================ */}
      <Calculator />

      {/* ================================================================
          STEP 3 (continued): The <Link> Component — Client-Side Navigation
          ================================================================
          TALKING POINT: "Instead of <a href='/history'>, we use Next.js's
          <Link> component. Why? Three reasons:
            1. It does CLIENT-SIDE navigation (no full page reload)
            2. It PREFETCHES the /history page in the background when this
               link scrolls into view — so the transition is near-instant
            3. Only the NEW page content loads; the Layout (nav bar) stays put

          Compare to our Vite app where we used React Router's <Link>.
          Same concept, but Next.js adds automatic prefetching for free."
          ================================================================ */}
      <div className="mt-6">
        <Link
          href="/history"
          className="text-indigo-600 underline hover:text-indigo-800 transition-colors"
        >
          View Calculation History →
        </Link>
      </div>
    </main>
  );
}
