// CalculationForm.jsx — A Controlled Component that handles user input.
// "Controlled" means React state drives the input values, not the DOM.
// Each input's value is tied to state, and onChange updates that state,
// giving React full control over the form data.

import { useState } from "react";
import Button from "./Button";

function CalculationForm({ onAdd }) {
  // Local state for each form field — this is what makes the inputs "controlled"
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [operation, setOperation] = useState("Add");

  // Handles form submission: computes the result and passes it up via onAdd
  const handleSubmit = (e) => {
    // Prevent the default browser form submission (which would reload the page)
    e.preventDefault();

    // Convert the string inputs to numbers for calculation
    const l = parseFloat(left);
    const r = parseFloat(right);

    // Perform the selected arithmetic operation
    let result = 0;
    if (operation === "Add") result = l + r;
    if (operation === "Subtract") result = l - r;
    if (operation === "Multiply") result = l * r;
    if (operation === "Divide") result = l / r;

    // Build a calculation object with a unique ID (timestamp)
    const newCalc = {
      id: Date.now(),
      left: l,
      right: r,
      operation: operation,
      result: result,
    };

    // Call the parent's callback to add the new calculation to the list
    onAdd(newCalc);

    // Reset the input fields after submission
    setLeft("");
    setRight("");
  };

  return (
    <form onSubmit={handleSubmit} className="calc-form">
      {/* Left operand input — value is controlled by state */}
      <input
        type="number"
        value={left}
        onChange={(e) => setLeft(e.target.value)}
        placeholder="Number 1"
      />

      {/* Operation selector — a dropdown tied to the operation state */}
      <select value={operation} onChange={(e) => setOperation(e.target.value)}>
        <option value="Add">Add (+)</option>
        <option value="Subtract">Subtract (-)</option>
        <option value="Multiply">Multiply (*)</option>
        <option value="Divide">Divide (/)</option>
      </select>

      {/* Right operand input — also controlled by state */}
      <input
        type="number"
        value={right}
        onChange={(e) => setRight(e.target.value)}
        placeholder="Number 2"
      />

      {/* Reusable Button component — presentational, just renders a button */}
      <Button label="Calculate" />
    </form>
  );
}

export default CalculationForm;
