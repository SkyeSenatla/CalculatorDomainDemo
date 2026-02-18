import { useState } from "react";
import Button from "./Button";

function CalculationForm({ onAdd }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [operation, setOperation] = useState("Add");

  const handleSubmit = (e) => {
    e.preventDefault();

    const l = parseFloat(left);
    const r = parseFloat(right);

    let result = 0;
    if (operation === "Add") result = l + r;
    if (operation === "Subtract") result = l - r;
    if (operation === "Multiply") result = l * r;
    if (operation === "Divide") result = l / r;

    const newCalc = {
      id: Date.now(),
      left: l,
      right: r,
      operation: operation,
      result: result,
    };

    onAdd(newCalc);

    setLeft("");
    setRight("");
  };

  return (
    <form onSubmit={handleSubmit} className="calc-form">
      <input
        type="number"
        value={left}
        onChange={(e) => setLeft(e.target.value)}
        placeholder="Number 1"
      />

      <select value={operation} onChange={(e) => setOperation(e.target.value)}>
        <option value="Add">Add (+)</option>
        <option value="Subtract">Subtract (-)</option>
        <option value="Multiply">Multiply (*)</option>
        <option value="Divide">Divide (/)</option>
      </select>

      <input
        type="number"
        value={right}
        onChange={(e) => setRight(e.target.value)}
        placeholder="Number 2"
      />

      <Button label="Calculate" />
    </form>
  );
}

export default CalculationForm;
