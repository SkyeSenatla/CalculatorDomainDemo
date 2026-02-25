import { useState } from "react"; 
import Button from "../Button"; 
import "./CalculationForm.css";


function CalculationForm({ onAdd }) { 
const [left, setLeft] = useState(""); 
const [right, setRight] = useState(""); 
const [operation, setOperation] = useState("Add"); 
const [isSubmitting, setIsSubmitting] = useState(false); 
const [formError, setFormError] = useState(null); 

const handleSubmit = async (e) => { 
e.preventDefault(); 
setFormError(null); 
setIsSubmitting(true); 
try { 
// onAdd now calls the API — it's async! 
await onAdd(parseFloat(left), parseFloat(right), operation); 
// Only reset the form on success 
setLeft(""); 
setRight(""); 
} catch (err) { 
      // We'll expand this error handling in Demo 2 
      setFormError(err.message || "Calculation failed"); 
    } finally { 
      setIsSubmitting(false); 
    } 
  }; 
 
  return ( 
    <form onSubmit={handleSubmit} className="calc-form"> 
      <input 
        type="number" 
        value={left} 
        onChange={(e) => setLeft(e.target.value)} 
        placeholder="Number 1" 
        required 
      /> 
 
      <select value={operation} onChange={(e) => setOperation(e.target.value)}> 
        <option value="Add">Add (+)</option> 
        <option value="Subtract">Subtract (-)</option> 
        <option value="Multiply">Multiply (*)</option> 
        <option value="Divide">Divide (/)</option> 
      </select> 
 
      <input 
        type="number" 
        value={right} 
        onChange={(e) => setRight(e.target.value)} 
placeholder="Number 2" 
required 
/> 
<Button label={isSubmitting ? "Saving..." : "Calculate"} /> 
{formError && <p className="form-error">{formError}</p>} 
</form> 
); 
} 
export default CalculationForm; 