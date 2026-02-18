// useCalculations.js — A Custom Hook that separates the "Brain" (logic) from the "Face" (UI).
// Custom hooks must start with "use" so React knows to apply hook rules.
// This hook can be reused in any component (Dashboard, Sidebar, Mobile view)
// without rewriting the calculation logic.

import { useState, useEffect } from "react";
import storageService from "../services/storageService";

export function useCalculations() {
  // State: the list of all calculations, initialized from localStorage
  const [calculations, setCalculations] = useState(() =>
    storageService.getCalculations()
  );

  // State: tracks whether data is currently being loaded
  const [isLoading, setIsLoading] = useState(false);

  // Effect: simulates an initial data fetch with a loading delay.
  // This demonstrates how real API calls would work with loading states.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate network delay (1 second)
      await new Promise((r) => setTimeout(r, 1000));
      // Load saved calculations from localStorage
      setCalculations(storageService.getCalculations());
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Effect: persist calculations to localStorage whenever they change
  useEffect(() => {
    storageService.saveCalculations(calculations);
  }, [calculations]);

  // Adds a new calculation to the list using functional state update
  // to safely reference the previous state
  const addCalculation = (newCalculation) => {
    setCalculations((prev) => [...prev, newCalculation]);
  };

  // Derived value: computes the running total of all results
  const totalSum = calculations.reduce((acc, curr) => acc + curr.result, 0);

  // Return exactly what the UI needs — nothing more, nothing less
  return { calculations, isLoading, addCalculation, totalSum };
}

export default useCalculations;
