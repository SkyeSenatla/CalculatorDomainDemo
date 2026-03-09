// ================================================================
// STEP 4: Global Layouts — Persistent UI Across Pages
// ================================================================
//
// TALKING POINT: "In our Vite app, we had a Layout.jsx component that
// we manually wrapped around our page content:
//   <Layout title='Advanced Calculator'>
//     <Routes>...</Routes>
//   </Layout>
//
// In Next.js, layout.tsx is a SPECIAL file. Next.js automatically wraps
// every page inside its nearest layout. We don't have to import it or
// wrap anything manually — it just works.
//
// The KEY benefit: When you navigate between pages, the Layout does NOT
// re-render. Only the {children} part swaps out. This means:
//   1. The nav bar stays mounted (no flicker, no re-render)
//   2. Any state in the layout is preserved across navigations
//   3. Only the new page content is fetched and rendered
//
// This is different from our Vite app where React Router would re-render
// the entire component tree on navigation, and we relied on React's
// reconciliation to avoid unmounting the Layout."
// ================================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ================================================================
// Metadata: This is a Server Component feature — you can export
// metadata that Next.js uses for the <head> tag. No need for
// react-helmet or useEffect(() => { document.title = ... }).
// ================================================================
export const metadata: Metadata = {
  title: "Sentinel Calculator",
  description: "Calculator Migration Demo — Vite to Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* ================================================================
            STEP 4: The Persistent Navigation Bar
            ================================================================
            TALKING POINT: "This <nav> is defined ONCE in the root layout.
            It stays on screen when you navigate between / and /history.

            VERIFICATION (Step 5):
              1. Click 'History' — the nav bar doesn't flicker or re-mount
              2. Open DevTools → Elements tab → right-click the <nav> and
                 select 'Break on subtree modifications'. Navigate between
                 pages — the <nav> element is NEVER touched by the DOM.
              3. Open DevTools → Network tab → navigate to /history.
                 Notice only the page content is fetched, not the layout."
            ================================================================ */}
        <nav className="p-4 bg-gray-800 text-white flex items-center justify-between">
          <Link href="/" className="font-bold text-lg hover:text-gray-300 transition-colors">
            Sentinel Calculator
          </Link>
          <div className="flex gap-4">
            <Link
              href="/"
              className="hover:text-gray-300 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/history"
              className="hover:text-gray-300 transition-colors"
            >
              History
            </Link>
          </div>
        </nav>

        {/* ================================================================
            {children} — This is where the SPECIFIC PAGE content renders.
            When the user navigates:
              /         → children = <HomePage />
              /history  → children = <HistoryPage />

            The layout stays mounted. Only {children} swaps.
            This is the same concept as our Vite Layout.jsx's {children},
            but Next.js manages the swap automatically via the App Router.
            ================================================================ */}
        {children}
      </body>
    </html>
  );
}
