import CalculationCard from "./CalculationCard";

function CalculationList({ calculations }) {
  return (
    <div>
      <h2>Calculation History</h2>
      {calculations.map((calc) => (
        <CalculationCard key={calc.id} calculation={calc} />
      ))}
    </div>
  );
}

export default CalculationList;
