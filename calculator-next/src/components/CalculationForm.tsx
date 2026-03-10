"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import Button from "./Button";
import { parseValidationErrors } from "@/utils/parseValidationErrors";

interface CalculationFormProps {
  onAdd: (left: number, right: number, operation: string) => Promise<unknown>;
}

export default function CalculationForm({ onAdd }: CalculationFormProps) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [operation, setOperation] = useState("Add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await onAdd(parseFloat(left), parseFloat(right), operation);
      setLeft("");
      setRight("");
    } catch (err) {
      const parsed = parseValidationErrors(err as AxiosError<Record<string, unknown>>);
      setErrors(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-start mb-6">
      <div className="flex flex-col">
        <input
          type="number"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="Number 1"
          className={`border-2 rounded-md px-3 py-2 w-28 focus:outline-none focus:border-indigo-500 ${
            errors.left ? "border-red-500" : "border-gray-200"
          }`}
        />
        {errors.left && <p className="text-red-500 text-xs mt-1">{errors.left}</p>}
      </div>

      <select
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
        className="border-2 border-gray-200 rounded-md px-3 py-2 focus:border-indigo-500 focus:outline-none"
      >
        <option value="Add">Add (+)</option>
        <option value="Subtract">Subtract (-)</option>
        <option value="Multiply">Multiply (*)</option>
        <option value="Divide">Divide (/)</option>
      </select>

      <div className="flex flex-col">
        <input
          type="number"
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder="Number 2"
          className={`border-2 rounded-md px-3 py-2 w-28 focus:outline-none focus:border-indigo-500 ${
            errors.right ? "border-red-500" : "border-gray-200"
          }`}
        />
        {errors.right && <p className="text-red-500 text-xs mt-1">{errors.right}</p>}
      </div>

      <Button label={isSubmitting ? "Saving..." : "Calculate"} />

      {errors._generic && <p className="text-red-500 text-sm w-full">{errors._generic}</p>}
      {errors.operand && <p className="text-red-500 text-sm w-full">Operation: {errors.operand}</p>}
    </form>
  );
}
