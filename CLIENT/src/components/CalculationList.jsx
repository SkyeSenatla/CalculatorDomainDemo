// CalculationList.jsx — Renders a list of CalculationCard components.
// This demonstrates two key React concepts:
//
// 1. Component Composition: CalculationList uses CalculationCard inside it.
//    Components can contain other components, forming a tree (just like HTML elements).
//
// 2. Rendering Lists with .map() and Keys:
//    - We use JavaScript's .map() to transform each data item into a <CalculationCard />.
//    - Every item in a list MUST have a unique "key" prop.
//    - React uses keys to track which items changed, were added, or were removed between renders.
//    - Keys help React optimize re-renders and prevent UI bugs (like inputs losing their values).
//    - NEVER use the array index as a key — if the list order changes, React will mix up the items.
//    - Always use a stable, unique identifier (like an id from the database).

import CalculationCard from "./CalculationCard";

function CalculationList({ calculations }) {
  return (
    <div>
      <h2>Calculation History</h2>
      {calculations.map((calc) => (
        // key={calc.id} tells React how to identify each item uniquely.
        // This is critical for performance and correctness when the list changes.
        <CalculationCard key={calc.id} calculation={calc} />
      ))}
    </div>
  );
}

export default CalculationList;
