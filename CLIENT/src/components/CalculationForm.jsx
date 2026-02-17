// CalculationForm.jsx — A form component that lets users create new calculations.
//
// === KEY CONCEPTS ===
//
// 1. Controlled Components:
//    Every input's value is driven by React state (e.g., value={left}).
//    The React state is the "single source of truth" — the input ALWAYS reflects the state.
//    This is the opposite of "uncontrolled" inputs where the DOM holds the value.
//
// 2. Two-Way Data Binding:
//    - State → Input:  The input displays whatever is in state (value={left}).
//    - Input → State:  When the user types, onChange fires and updates state (setLeft(e.target.value)).
//    - This creates a loop: State renders the input → User types → State updates → Input re-renders.
//
// 3. Events:
//    - onChange: Fires on every keystroke in an input. We use it to sync state with user input.
//    - onSubmit: Fires when the form is submitted. We use it to process the calculation.
//    - e.target.value: The current text/value of the input element that triggered the event.
//
// 4. Lifting State Up (via the onAdd prop):
//    - This component does NOT own the calculations list — App does.
//    - When the user submits, we call onAdd(newCalc) which is a function passed from App.
//    - This is how children communicate data UPWARD to their parent.

import { useState } from "react";
import Button from "./Button";

function CalculationForm({ onAdd }) {
  // === Local State for Form Inputs ===
  // Each input has its own piece of state.
  // These are "local" to this component — App doesn't need to know what the user is typing mid-form.
  // State only needs to be "lifted up" when it's needed by other components.
  const [left, setLeft] = useState("");    // First number input
  const [right, setRight] = useState("");  // Second number input
  const [operation, setOperation] = useState("Add"); // Selected operation (dropdown)

  // === Form Submission Handler ===
  // This function runs when the user clicks "Calculate" (submits the form).
  const handleSubmit = (e) => {
    // e.preventDefault() is MANDATORY for React forms.
    // Without it, the browser performs its default behavior: a full page refresh.
    // A page refresh would wipe out all React state and reload the app from scratch.
    e.preventDefault();

    // Parse the string input values into numbers.
    // Input values from HTML are ALWAYS strings (e.g., "10", not 10).
    // parseFloat converts "10" → 10.0 so we can do math with them.
    const l = parseFloat(left);
    const r = parseFloat(right);

    // Simple calculation logic based on the selected operation.
    // In a real app, this would be done on the backend API.
    // For now, we calculate locally to demonstrate state management.
    let result = 0;
    if (operation === "Add") result = l + r;
    if (operation === "Subtract") result = l - r;
    if (operation === "Multiply") result = l * r;
    if (operation === "Divide") result = l / r;

    // Build the new calculation object.
    // This matches the shape of objects already in the calculations array.
    const newCalc = {
      id: Date.now(),        // Temporary unique ID (millisecond timestamp). The real ID comes from the DB later.
      left: l,
      right: r,
      operation: operation,
      result: result,
    };

    // === Call the Parent ===
    // onAdd is a PROP — it's actually the addCalculation function from App.
    // By calling it here, we "send" the new calculation UP to the parent.
    // App will then call setCalculations, triggering a re-render of the entire tree.
    onAdd(newCalc);

    // Reset the form inputs back to empty after submission.
    // Because these are controlled components, setting state to "" clears the inputs.
    setLeft("");
    setRight("");
  };

  return (
    // onSubmit on the <form> element catches both button clicks AND pressing Enter.
    // This is better than putting onClick on the button — it handles all submission methods.
    <form onSubmit={handleSubmit} className="calc-form">

      {/* === Controlled Input: Left Number ===
          value={left}  → The input DISPLAYS whatever is in the "left" state.
          onChange={...} → Every keystroke calls setLeft with the new value.
          e.target.value → The current text inside the input element. */}
      <input
        type="number"
        value={left}
        onChange={(e) => setLeft(e.target.value)}
        placeholder="Number 1"
      />

      {/* === Controlled Select: Operation ===
          Same pattern as the input — value is driven by state, onChange updates state. */}
      <select value={operation} onChange={(e) => setOperation(e.target.value)}>
        <option value="Add">Add (+)</option>
        <option value="Subtract">Subtract (-)</option>
        <option value="Multiply">Multiply (*)</option>
        <option value="Divide">Divide (/)</option>
      </select>

      {/* === Controlled Input: Right Number === */}
      <input
        type="number"
        value={right}
        onChange={(e) => setRight(e.target.value)}
        placeholder="Number 2"
      />

      {/* Button component — renders as type="submit" so it triggers the form's onSubmit */}
      <Button label="Calculate" />
    </form>
  );
}

export default CalculationForm;
