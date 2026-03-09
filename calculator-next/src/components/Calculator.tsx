// ================================================================
// STEP 2: Server vs. Client Components — The "use client" Boundary
// ================================================================
//
// TALKING POINT: "In our Vite app (CLIENT/), everything was a Client Component.
// React ran entirely in the browser. In Next.js, components are SERVER Components
// by default — they render on the server, send plain HTML, and never ship JS
// to the browser. This keeps the bundle small.
//
// But a calculator needs interactivity — useState for inputs, onClick for buttons.
// Those hooks only work in the browser. So we MUST add the 'use client' directive
// at the very top to tell Next.js: 'This component needs JavaScript in the browser.'
//
// Think of it like this:
//   Server Component = a static poster on a wall (no interaction)
//   Client Component = a touchscreen kiosk (needs JS to respond to taps)
//
// Rule of thumb: Start with Server Components. Only add 'use client' when you
// need useState, useEffect, onClick, or other browser-only APIs."
// ================================================================

"use client"; // ← THIS IS THE BOUNDARY! Without this line, useState would throw an error.

import { useState } from "react";

export default function Calculator() {
  // ================================================================
  // useState is a React Hook — it only works in Client Components.
  // If we removed "use client" above, Next.js would throw:
  //   "You're importing a component that needs useState. It only works
  //    in a Client Component but none of its parents are marked with 'use client'."
  // ================================================================
  const [left, setLeft] = useState<number>(0);
  const [right, setRight] = useState<number>(0);
  const [result, setResult] = useState<number>(0);
  const [operation, setOperation] = useState<string>("Add");

  // ================================================================
  // Event handler: runs in the browser when the user clicks "Calculate"
  // This is client-side logic — another reason we need "use client".
  // ================================================================
  const handleCalculate = () => {
    let calcResult = 0;
    switch (operation) {
      case "Add":
        calcResult = left + right;
        break;
      case "Subtract":
        calcResult = left - right;
        break;
      case "Multiply":
        calcResult = left * right;
        break;
      case "Divide":
        calcResult = right !== 0 ? left / right : 0;
        break;
    }
    setResult(calcResult);
  };

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Result display */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Result: <span className="text-indigo-600">{result}</span>
      </h2>

      {/* Input fields — onChange uses setState, so this MUST be a Client Component */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="number"
          value={left}
          onChange={(e) => setLeft(Number(e.target.value))}
          className="border-2 border-gray-200 rounded-md px-3 py-2 w-24 focus:border-indigo-500 focus:outline-none"
          placeholder="Left"
        />

        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          className="border-2 border-gray-200 rounded-md px-3 py-2 focus:border-indigo-500 focus:outline-none"
        >
          <option value="Add">+</option>
          <option value="Subtract">-</option>
          <option value="Multiply">×</option>
          <option value="Divide">÷</option>
        </select>

        <input
          type="number"
          value={right}
          onChange={(e) => setRight(Number(e.target.value))}
          className="border-2 border-gray-200 rounded-md px-3 py-2 w-24 focus:border-indigo-500 focus:outline-none"
          placeholder="Right"
        />

        {/* onClick is a browser event — only works in Client Components */}
        <button
          onClick={handleCalculate}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
        >
          Calculate
        </button>
      </div>
    </div>
  );
}
