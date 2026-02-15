// CalculationCard.jsx — Displays a single calculation.
// This component receives data through "props" (properties passed from a parent component).
// Props flow downward: Parent → Child. This is called "one-way data flow."
// Components should be "pure" — given the same props, they always render the same output.
// No state, no side effects — just a function that transforms data into UI.

function CalculationCard({ calculation }) {
  // We destructure { calculation } from props.
  // This is the same as writing: function CalculationCard(props) { const calculation = props.calculation; }
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "5px" }}>
      <p>
        {calculation.left} {calculation.operation} {calculation.right} ={" "}
        {calculation.result}
      </p>
    </div>
  );
}

export default CalculationCard;
