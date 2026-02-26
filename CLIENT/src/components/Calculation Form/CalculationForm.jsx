// ================================================================
// DEMO 1 (Step 1C) + DEMO 2 (Step 2C): THE CALCULATION FORM
// ================================================================

import { useState } from "react";
import Button from "../Button";
import { parseValidationErrors } from "../../utils/parseValidationErrors";

function CalculationForm({ onAdd }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [operation, setOperation] = useState("Add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // DEMO 2: Changed from single formError string to an errors OBJECT for per-field display
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // DEMO 1: onAdd now calls the API — it's async!
      await onAdd(parseFloat(left), parseFloat(right), operation);
      // Only reset the form on success
      setLeft("");
      setRight("");
    } catch (err) {
      // ============================================
      // DEMO 2: THE VALIDATION HANDSHAKE
      // Parse the .NET ProblemDetails into per-field errors
      // ============================================
      const parsed = parseValidationErrors(err);
      setErrors(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="calc-form">
      {/* DEMO 2: Wrapped inputs in form-field divs for per-field error display */}
      <div className="form-field">
        <input
          type="number"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="Number 1"
          className={errors.left ? "input-error" : ""}
        />
        {/* DEMO 2: Per-field error display for "left" */}
        {errors.left && <p className="field-error">{errors.left}</p>}
      </div>

      <select value={operation} onChange={(e) => setOperation(e.target.value)}>
        <option value="Add">Add (+)</option>
        <option value="Subtract">Subtract (-)</option>
        <option value="Multiply">Multiply (*)</option>
        <option value="Divide">Divide (/)</option>
      </select>

      <div className="form-field">
        <input
          type="number"
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder="Number 2"
          className={errors.right ? "input-error" : ""}
        />
        {/* DEMO 2: Per-field error display for "right" */}
        {errors.right && <p className="field-error">{errors.right}</p>}
      </div>

      <Button label={isSubmitting ? "Saving..." : "Calculate"} />

      {/* DEMO 2: Generic errors (not tied to a specific field) */}
      {errors._generic && <p className="form-error">{errors._generic}</p>}
      {errors.operand && <p className="form-error">Operation: {errors.operand}</p>}
    </form>
  );
}

export default CalculationForm;
