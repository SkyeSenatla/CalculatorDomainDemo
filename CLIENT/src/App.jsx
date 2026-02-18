// CHANGED: Added useEffect to the import (Day 3 — Side Effects & Async)
import { useState, useEffect } from "react";
import Header from "./components/Header";
import CalculationList from "./components/CalculationList";
import CalculationForm from "./components/CalculationForm";

function App() {
  // CHANGED: Initial state is now an empty array instead of hardcoded data.
  // The data will be "fetched" by useEffect on mount (Step 3).
  const [calculations, setCalculations] = useState([]);

  // ADDED: Loading state — tracks whether the simulated API call is in progress (Step 3)
  const [isLoading, setIsLoading] = useState(false);

  // ADDED: Error state — stores any error message from the simulated fetch (Step 3)
  const [error, setError] = useState(null);

  // ADDED (Step 1): useEffect to sync React state with the browser tab title.
  // This is a "side effect" — we're reaching outside React to update an external browser system.
  // The dependency array [calculations] means this only re-runs when calculations changes.
  useEffect(() => {
    document.title = `Calculations (${calculations.length})`;
    console.log("Effect ran: Title updated");
  }, [calculations]);

  // ADDED (Step 3): useEffect to simulate fetching data from an API on component mount.
  // The empty dependency array [] means this runs ONCE when the component first renders.
  useEffect(() => {
    const fetchCalculations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulating a 1.5 second API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockApiResponse = [
          { id: 1, left: 10, right: 5, operation: "Add", result: 15 },
          { id: 2, left: 20, right: 4, operation: "Divide", result: 5 },
        ];

        setCalculations(mockApiResponse);
      } catch (err) {
        setError("Failed to load calculations.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculations();
  }, []);

  const addCalculation = (newCalculation) => {
    setCalculations([...calculations, newCalculation]);
  };

  // CHANGED (Step 6): Replaced simple count with a derived totalSum.
  // No useEffect needed — just calculate it during the render.
  // This recalculates automatically whenever calculations changes.
  const totalSum = calculations.reduce((acc, curr) => acc + curr.result, 0);

  return (
    <div>
      <Header />

      {/* CHANGED: Now displays the derived total sum instead of just a count */}
      <p>Total Calculations: {calculations.length} | Sum of Results: {totalSum}</p>

      <CalculationForm onAdd={addCalculation} />

      {/* ADDED (Step 4): Conditional rendering for loading, error, and data states.
          This handles "API latency" in the UI so users never see a blank screen. */}
      {isLoading && <p className="spinner">Loading calculation history...</p>}
      {error && <p className="error-text">{error}</p>}
      {!isLoading && <CalculationList calculations={calculations} />}
    </div>
  );
}

export default App;
