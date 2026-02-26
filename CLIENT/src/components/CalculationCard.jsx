// ================================================================
// DEMO 4 (Step 4C): CALCULATION CARD WITH REMOVE BUTTON
// ================================================================

function CalculationCard({ calculation, onDeactivate }) {
  return (
    <div className="calc-card">
      <p>
        {calculation.left} {calculation.operation} {calculation.right} ={" "}
        {calculation.result}
      </p>
      {/* DEMO 4: Remove button triggers PATCH soft-delete */}
      {onDeactivate && (
        <button
          className="deactivate-btn"
          onClick={() => onDeactivate(calculation.id)}
        >
          Remove
        </button>
      )}
    </div>
  );
}

export default CalculationCard;
