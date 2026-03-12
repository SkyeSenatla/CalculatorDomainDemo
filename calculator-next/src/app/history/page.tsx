"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CalculationList from "@/components/CalculationList";
import { fetchHistory } from "@/services/api";

interface Calculation {
  id: string;
  left: number;
  right: number;
  operation: string;
  result: number;
}

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load all history on first render
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    fetchHistory(undefined, controller.signal)
      .then((res) => {
        setCalculations((res as { data: Calculation[] }).data || []);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") {
          throw err; // Let the error boundary (error.tsx) catch this
        }
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  // Debounced search: waits 400ms after the user stops typing before calling the API.
  // This prevents flooding the backend with a request for every single keystroke.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        // Only hits the API after 400ms of silence
        console.log("Searching API for:", searchTerm);
        setIsLoading(true);
        fetchHistory(searchTerm)
          .then((res) => {
            setCalculations((res as { data: Calculation[] }).data || []);
          })
          .catch((err) => {
            if (err.name !== "CanceledError") {
              throw err;
            }
          })
          .finally(() => setIsLoading(false));
      }
    }, 400);

    // Cleanup: clears the previous timer if the user types again before 400ms
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto py-10 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculation History</h2>

        {/* Search input — debounced so the API is only called once the user pauses */}
        <input
          type="text"
          placeholder="Search by operation (e.g. Add, Subtract, Multiply, Divide)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {isLoading ? (
          // Inline loading fallback while debounce search is in progress
          <p className="text-gray-500">Searching...</p>
        ) : calculations.length === 0 ? (
          <p className="text-gray-400">No calculations found.</p>
        ) : (
          <CalculationList calculations={calculations} onDeactivate={() => {}} />
        )}
      </main>
    </ProtectedRoute>
  );
}
