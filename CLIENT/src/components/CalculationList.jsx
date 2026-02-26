// ================================================================
// DEMO 4 (Step 4E): CALCULATION LIST — Passes onDeactivate to each card
// ================================================================

import CalculationCard from "./CalculationCard";

function CalculationList({ calculations, onDeactivate }) {
  return (
    <div className="calc-list">
      <h2>Calculation History</h2>
      {calculations.map((calc) => (
        <CalculationCard
          key={calc.id}
          calculation={calc}
          onDeactivate={onDeactivate}
        />
      ))}
    </div>
  );
}

export default CalculationList;
