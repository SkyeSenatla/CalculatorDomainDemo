function CalculationCard({ calculation, onDeactivate }) {
  return (
    <div className="calc-card">
      <p>
        {calculation.left} {calculation.operation} {calculation.right} ={" "}
        {calculation.result}
      </p>
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
