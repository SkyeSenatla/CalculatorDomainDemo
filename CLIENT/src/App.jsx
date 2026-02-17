// App.jsx — The root component of our application.
// This is where we compose all of our components together.
//
// === DAY 2: STATE & EVENTS ===
//
// Yesterday this component used STATIC data (a plain const array).
// Today we convert it to use STATE so the UI can respond to user actions.
//
// Key concepts introduced today:
//   1. useState — React's hook for storing data that can change over time.
//   2. Events — Responding to user actions (clicks, typing, form submissions).
//   3. Controlled Components — Form inputs whose values are driven by React state.
//   4. Lifting State Up — The parent (App) owns the data, children communicate via props/callbacks.
//   5. Immutability — We never mutate state directly; we always create new copies.
//
// Data flow with state:
//   User Action → Event Handler → setState → React Re-renders → Updated UI
//
// Architecture:
//   App (owns state)
//     ├── Header
//     ├── CalculationForm (sends new calculations UP to App via onAdd prop)
//     └── CalculationList (receives calculations DOWN from App via calculations prop)

import { useState } from "react";
import Header from "./components/Header";
import CalculationList from "./components/CalculationList";
import CalculationForm from "./components/CalculationForm";

function App() {
  // === useState Hook ===
  // useState returns an array with exactly two elements:
  //   [0] calculations     — the CURRENT value of the state
  //   [1] setCalculations  — a FUNCTION to update the state and trigger a re-render
  //
  // We initialize it with some sample data so the list isn't empty on first load.
  // Later (Day 3+) this will come from the API instead.
  const [calculations, setCalculations] = useState([
    { id: 1, left: 10, right: 5, operation: "Add", result: 15 },
    { id: 2, left: 20, right: 4, operation: "Divide", result: 5 },
  ]);

  // === Lifting State Up — The Handler Function ===
  // This function is defined HERE in the parent (App), but will be CALLED
  // by the child (CalculationForm) when the user submits a new calculation.
  //
  // Why define it here? Because App owns the "calculations" state.
  // Only the component that owns state should update it.
  // The child doesn't know about setCalculations — it just calls onAdd().
  //
  // Data flow: CalculationForm calls onAdd(newCalc) → App runs addCalculation → state updates → re-render
  const addCalculation = (newCalculation) => {
    // === IMMUTABILITY IS KEY ===
    //
    // WHY NOT: calculations.push(newCalculation)?
    //   - .push() MUTATES the existing array (modifies it in place).
    //   - React compares the old state reference with the new one.
    //   - If we push, the reference is the SAME array object, so React thinks nothing changed.
    //   - Result: No re-render! The UI would NOT update.
    //
    // CORRECT: Use the spread operator to create a brand new array.
    //   [...calculations]         — copies all existing items into a new array
    //   [...calculations, newItem] — copies all existing + adds the new one at the end
    //
    // React sees a NEW array reference → detects a change → triggers a re-render.
    setCalculations([...calculations, newCalculation]);
  };

  // === Derived State ===
  // We do NOT need a separate useState for the count.
  // Since totalCalculations depends entirely on "calculations",
  // we can just calculate it on every render.
  //
  // Rule: If you can compute it from existing state, don't store it as separate state.
  // When "calculations" changes → App re-renders → totalCalculations is recalculated automatically.
  const totalCalculations = calculations.length;

  return (
    <div>
      {/* Header component — no props needed, just renders a title */}
      <Header />

      {/* Display the derived count — updates automatically when calculations changes */}
      <p>Total Calculations: {totalCalculations}</p>

      {/* CalculationForm receives addCalculation as the "onAdd" prop.
          This is how the child communicates back to the parent.
          The child calls props.onAdd(data), which runs addCalculation here. */}
      <CalculationForm onAdd={addCalculation} />

      {/* CalculationList receives the calculations array as a prop.
          When state updates above, this component re-renders with the new data. */}
      <CalculationList calculations={calculations} />
    </div>
  );
}

export default App;
