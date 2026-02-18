// CalculationCard.jsx — A Presentational Component.
// It receives a single calculation object as a prop and displays it.
// This component has no state or side effects — it just renders what it's given.
// This separation makes it easy to reuse wherever a calculation needs to be displayed.

function CalculationCard({ calculation }) {
  return (
    // Each card displays one calculation's details in a styled container
    <div className="calc-card">
      <p>
        {calculation.left} {calculation.operation} {calculation.right} ={" "}
        {calculation.result}
      </p>
    </div>
  );
}

export default CalculationCard;
