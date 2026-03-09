import { useState, useEffect, useCallback } from "react";
import { fetchCalculations, createCalculation, deactivateCalculation } from "../services/api";
import { useSignalR } from "./useSignalR";

export function useCalculations() {
  const [calculations, setCalculations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetches calculation history from the API
  const fetchHistory = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCalculations(signal);
      // The paginated endpoint returns { totalCount, page, pageSize, data }
      setCalculations(response.data || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.message || "Failed to fetch data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount with AbortController for cleanup
  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
    return () => controller.abort();
  }, []);

  // When the server broadcasts "CalculationCreated", refetch to get the full updated list
  const handleCalculationCreated = useCallback(() => {
    console.log("SignalR: Refetching after CalculationCreated...");
    const controller = new AbortController();
    fetchHistory(controller.signal);
  }, []);

  // When the server broadcasts "CalculationDeactivated", remove it from local state
  const handleCalculationDeactivated = useCallback((data) => {
    console.log("SignalR: Removing deactivated calculation", data.id);
    setCalculations((prev) => prev.filter((c) => c.id !== data.id));
  }, []);

  // Connect to SignalR — events will trigger the handlers above
  useSignalR(handleCalculationCreated, handleCalculationDeactivated);

  // PESSIMISTIC ADD — The "Safe" Pattern
  // 1. Send to API first
  // 2. Wait for server confirmation
  // 3. THEN update local state with server's response
  // With SignalR: No manual refetch needed — the SignalR broadcast
  // will trigger handleCalculationCreated automatically
  const addCalculation = async (left, right, operation) => {
    setError(null);
    try {
      const result = await createCalculation(left, right, operation);
      // No manual refetch needed — SignalR broadcast will trigger handleCalculationCreated
      return result;
    } catch (err) {
      // Re-throw so the form can handle validation errors
      throw err;
    }
  };

  // OPTIMISTIC ADD — The "Fast" Pattern (commented out for comparison)
  // To try: uncomment this function and swap it into the return object below.
  // Then use Chrome DevTools → Network → Throttle → "Slow 3G" to show the difference.
  //
  // const addCalculationOptimistic = async (left, right, operation) => {
  //   setError(null);
  //
  //   // Step 1: Snapshot current state for rollback
  //   const previousCalculations = [...calculations];
  //
  //   // Step 2: Predict the result locally (same math the server would do)
  //   const ops = { Add: "+", Subtract: "-", Multiply: "*", Divide: "/" };
  //   let predictedResult = 0;
  //   if (operation === "Add") predictedResult = left + right;
  //   if (operation === "Subtract") predictedResult = left - right;
  //   if (operation === "Multiply") predictedResult = left * right;
  //   if (operation === "Divide") predictedResult = left / right;
  //
  //   const optimisticCalc = {
  //     id: `temp-${Date.now()}`, // Temporary ID — will be replaced by DB ID
  //     left,
  //     right,
  //     operation: ops[operation],
  //     result: predictedResult,
  //   };
  //
  //   // Step 3: Update UI immediately — user sees it INSTANTLY
  //   setCalculations((prev) => [...prev, optimisticCalc]);
  //
  //   try {
  //     // Step 4: Send to server in background
  //     await createCalculation(left, right, operation);
  //     // Step 5: Refetch to replace temp ID with real DB ID
  //     const controller = new AbortController();
  //     await fetchHistory(controller.signal);
  //   } catch (err) {
  //     // Step 6: ROLLBACK — restore the previous state
  //     console.warn("Optimistic update rolled back:", err.message);
  //     setCalculations(previousCalculations);
  //     throw err;
  //   }
  // };

  // Soft-delete a calculation
  // No manual state update — SignalR broadcast will trigger handleCalculationDeactivated
  const removeCalculation = async (id) => {
    try {
      await deactivateCalculation(id);
      // SignalR handles the state update via handleCalculationDeactivated
    } catch (err) {
      setError(err.message || "Failed to deactivate calculation");
    }
  };

  const totalSum = calculations.reduce(
    (acc, curr) => acc + (curr.result || 0),
    0
  );

  const retry = () => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
  };

  return { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry };
}

export default useCalculations;
