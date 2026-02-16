// Button.jsx — A reusable button component.
// This component is "configurable via props" — the parent decides what the button says.
// Reusability is a core benefit of component-based architecture:
// instead of writing <button> tags everywhere, we create one Button component
// and use it wherever we need a button, passing different labels (and later, onClick handlers).

function Button({ label }) {
  return <button>{label}</button>;
}

export default Button;
