// App.jsx — The top-level orchestrator component.
// Following the Single Responsibility Principle (SRP), this component only
// handles high-level orchestration: it connects the custom hook (logic)
// to the presentational components (UI) and wraps everything in a Layout.

import { useEffect } from "react";
import Layout from "./components/Layout";
import CalculationForm from "./components/Calculation Form/CalculationForm";
import CalculationList from "./components/CalculationList";
import { useCalculations } from "./hooks/useCalculations";

function App() {
  // Destructure exactly what we need from the custom hook.
  // All calculation logic lives inside useCalculations — not here.
  const { calculations, isLoading, error, addCalculation, totalSum, retry } = useCalculations();

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

      {/* The form component handles user input for new calculations */}
      <CalculationForm onAdd={addCalculation} />

      {/* Conditional rendering: show a loading message while data is being fetched,
          otherwise display the calculation history list */}
       {isLoading ? ( 
        <p className="loading">Fetching history...</p> ) 
        : error ? ( 
        <div className="error-container"> 
          <p className="error-message">Error: {error}</p> 
          <button className="retry-button" onClick={retry}> 
            Retry 
          </button> 
        </div> 
      ) : ( 
        <CalculationList calculations={calculations} /> 
      )}
    </Layout>
  );
}

export default App;
