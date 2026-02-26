// ================================================================
// App.jsx — The top-level orchestrator component.
// ================================================================
// Following the Single Responsibility Principle (SRP), this component only
// handles high-level orchestration: it connects the custom hook (logic)
// to the presentational components (UI) and wraps everything in a Layout.
//
// DEMO 1 (Step 1D): Fixed destructuring to include 'error' and 'retry'
// DEMO 4 (Step 4E): Added 'removeCalculation' and passes it to CalculationList
// ================================================================

import { useEffect } from "react";
import Layout from "./components/Layout";
import CalculationForm from "./components/Calculation Form/CalculationForm";
import CalculationList from "./components/CalculationList";
import { useCalculations } from "./hooks/useCalculations";

function App() {
  // ================================================================
  // DEMO 1 (Step 1D): Complete destructuring — includes error & retry
  // DEMO 4 (Step 4E): Added removeCalculation for soft-delete
  // ================================================================
  const { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry } =
    useCalculations();

  // Side effect: updates the browser tab title whenever calculations change
  useEffect(() => {
    document.title = `Calculations (${calculations.length})`;
  }, [calculations]);

  return (
    // Layout provides the page frame (header, footer) via composition
    <Layout title="Advanced Calculator">
      {/* Summary stats shown above the form */}
      <p className="stats">
        Total Calculations: {calculations.length} | Sum of Results: {totalSum}
      </p>

      {/* DEMO 1: The form component now POSTs to the API instead of client-side calc */}
      <CalculationForm onAdd={addCalculation} />

      {/* Conditional rendering: loading → error → data */}
      {isLoading ? (
        <p className="loading">Fetching history...</p>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <button className="retry-button" onClick={retry}>
            Retry
          </button>
        </div>
      ) : (
        // DEMO 4 (Step 4E): Pass removeCalculation as onDeactivate prop
        <CalculationList calculations={calculations} onDeactivate={removeCalculation} />
      )}
    </Layout>
  );
}

export default App;
