// MyCalculations.jsx — Protected page that displays the user's calculation history.
// Only accessible to authenticated users; ProtectedRoute guard ensures
// unauthenticated users are redirected.

import { useEffect } from "react";
import CalculationForm from "../components/Calculation Form/CalculationForm";
import CalculationList from "../components/CalculationList";
import { useCalculations } from "../hooks/useCalculations";
import { useAuth } from "../context/AuthContext";

function MyCalculations() {
  const { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry } =
    useCalculations();
  const { user } = useAuth();

  // Update browser tab title with calculation count
  useEffect(() => {
    document.title = `My Calculations (${calculations.length})`;
  }, [calculations]);

  return (
    <>
      <h2 className="page-title">Welcome back, {user?.username}!</h2>

      {/* Summary stats */}
      <p className="stats">
        Total Calculations: {calculations.length} | Sum of Results: {totalSum}
      </p>

      {/* The form POSTs to the API — requires a valid JWT */}
      <CalculationForm onAdd={addCalculation} />

      {/* Conditional rendering: loading → error → data */}
      {isLoading ? (
        <p className="loading">Fetching your calculations...</p>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <button className="retry-button" onClick={retry}>
            Retry
          </button>
        </div>
      ) : (
        <CalculationList calculations={calculations} onDeactivate={removeCalculation} />
      )}
    </>
  );
}

export default MyCalculations;
