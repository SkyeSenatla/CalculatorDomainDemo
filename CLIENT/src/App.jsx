// App.jsx — The root component of our application.
// This is where we compose all of our components together.
//
// React is:
//   - Declarative: We describe WHAT the UI should look like, not HOW to update it.
//   - State-driven: Data determines what renders (today we use static data; state comes tomorrow).
//   - Component-based: UI is built from small, reusable pieces.
//
// React is NOT:
//   - Direct DOM manipulation (no document.getElementById or manual updates).
//
// Data flow: Data → Component → JSX → Virtual DOM → Real DOM
//
// Today's static data simulates what will later come from: React → API → PostgreSQL
// Tomorrow we introduce state, then effects, then API calls.
// The API endpoint we'll eventually connect to: GET /api/calculations

import Header from "./components/Header";
import CalculationList from "./components/CalculationList";
import Button from "./components/Button";

function App() {
  // Static data simulating what will later come from the backend API.
  // Each object has an "id" — this is used as the "key" when rendering lists.
  const calculations = [
    { id: 1, left: 10, right: 5, operation: "Add", result: 15 },
    { id: 2, left: 20, right: 4, operation: "Divide", result: 5 },
    { id: 3, left: 7, right: 3, operation: "Multiply", result: 21 },
  ];

  return (
    <div>
      {/* Header component — no props needed, just renders a title */}
      <Header />

      {/* CalculationList receives the calculations array as a prop */}
      <CalculationList calculations={calculations} />

      {/* Button is a reusable component — we configure it via the "label" prop */}
      <Button label="New Calculation" />
    </div>
  );
}

export default App;
