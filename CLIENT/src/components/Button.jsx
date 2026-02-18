function Button({ label, type = "submit" }) {
  return <button type={type}>{label}</button>;
}

export default Button;
