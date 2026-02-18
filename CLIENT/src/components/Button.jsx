// Button.jsx — A Presentational Component.
// Presentational components only receive props and render UI.
// They contain no business logic or state management.
// This makes them highly reusable and easy to test.

function Button({ label, type = "submit" }) {
  // Renders a simple HTML button; "type" defaults to "submit" for form usage
  return <button type={type}>{label}</button>;
}

export default Button;
