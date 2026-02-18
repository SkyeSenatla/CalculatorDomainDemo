// CalculationList.jsx — Renders an array of calculations as a list of cards.
// Uses .map() to iterate over the calculations array and render a CalculationCard
// for each item. The "key" prop (calc.id) helps React efficiently update the DOM
// by tracking which items have changed, been added, or removed.

import CalculationCard from "./CalculationCard";

function CalculationList({ calculations }) {
  return (
    <div className="calc-list">
      <h2>Calculation History</h2>
      {/* Map over each calculation and render a card component.
          Each card needs a unique "key" so React can track list changes efficiently. */}
      {calculations.map((calc) => (
        <CalculationCard key={calc.id} calculation={calc} />
      ))}
    </div>
  );
}

export default CalculationList;
