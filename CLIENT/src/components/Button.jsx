// Button.jsx — A reusable button component.
//
// This component is "configurable via props" — the parent decides what the button says
// and what type it is.
//
// Props:
//   - label: The text displayed on the button.
//   - type:  The HTML button type. Defaults to "submit".
//            "submit" means clicking this button will trigger the parent <form>'s onSubmit event.
//            "button" means it's a plain button that does NOT trigger form submission.
//
// Default parameters (type = "submit") use JavaScript's default parameter syntax.
// If the parent doesn't pass a "type" prop, it falls back to "submit".

function Button({ label, type = "submit" }) {
  return <button type={type}>{label}</button>;
}

export default Button;
