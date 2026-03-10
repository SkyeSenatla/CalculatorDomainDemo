"use client";

import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CalculationForm from "@/components/CalculationForm";
import CalculationList from "@/components/CalculationList";
import { useCalculations } from "@/hooks/useCalculations";
import { useAuth } from "@/context/AuthContext";

export default function MyCalculationsPage() {
  const { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry } =
    useCalculations();
  const { user } = useAuth();

  useEffect(() => {
    document.title = `My Calculations (${calculations.length})`;
  }, [calculations]);

  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto py-10 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.username}!
        </h2>

        <p className="text-gray-500 mb-6">
          Total Calculations: {calculations.length} | Sum of Results: {totalSum.toFixed(2)}
        </p>

        <CalculationForm onAdd={addCalculation} />

        {isLoading ? (
          <p className="text-gray-500">Fetching your calculations...</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-red-500">Error: {error}</p>
            <button
              onClick={retry}
              className="text-indigo-600 underline hover:text-indigo-800 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <CalculationList calculations={calculations} onDeactivate={removeCalculation} />
        )}
      </main>
    </ProtectedRoute>
  );
}
