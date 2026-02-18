function CalculationCard({ calculation }) {
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
