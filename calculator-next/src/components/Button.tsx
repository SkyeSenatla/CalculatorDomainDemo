interface ButtonProps {
  label: string;
  type?: "submit" | "button" | "reset";
}

export default function Button({ label, type = "submit" }: ButtonProps) {
  return (
    <button
      type={type}
      className="bg-indigo-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
}
