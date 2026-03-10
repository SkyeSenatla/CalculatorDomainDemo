import { useState, useEffect, useCallback } from "react";
import { fetchCalculations, createCalculation, deactivateCalculation } from "@/services/api";
import { useSignalR } from "./useSignalR";

interface Calculation {
  id: string;
  left: number;
  right: number;
  operation: string;
  result: number;
}

export function useCalculations() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCalculations(signal);
      // The paginated endpoint returns { totalCount, page, pageSize, data }
      setCalculations((response as { data: Calculation[] }).data || []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "CanceledError") {
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

  // SignalR: refetch after a new calculation is created
  const handleCalculationCreated = useCallback(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
  }, []);

  // SignalR: remove deactivated calculation from local state
  const handleCalculationDeactivated = useCallback((data: { id: string }) => {
    setCalculations((prev) => prev.filter((c) => c.id !== data.id));
  }, []);

  useSignalR(handleCalculationCreated, handleCalculationDeactivated);

  // Pessimistic add — wait for server confirmation, SignalR handles the refetch
  const addCalculation = async (left: number, right: number, operation: string) => {
    setError(null);
    const result = await createCalculation(left, right, operation);
    return result;
  };

  // Soft-delete — SignalR handles the state update
  const removeCalculation = async (id: string) => {
    try {
      await deactivateCalculation(id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to deactivate calculation");
      }
    }
  };

  const totalSum = calculations.reduce((acc, curr) => acc + (curr.result || 0), 0);

  const retry = () => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
  };

  return { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry };
}

export default useCalculations;
