# Module 3: Week 8, Day 3 — Demo Guide

## Data Mutations & The Real-Time Handshake

**"Writing Safely and Staying in Sync with SignalR"**

---

## Table of Contents

1. [Pre-Demo Setup & Checklist](#pre-demo-setup--checklist)
2. [Demo 1: The Payload Contract — Wiring POST from React to .NET](#demo-1-the-payload-contract--wiring-post-from-react-to-net)
3. [Demo 2: The Validation Handshake — Parsing ProblemDetails](#demo-2-the-validation-handshake--parsing-problemdetails)
4. [Demo 3: PUT Mutation — Full Resource Replacement](#demo-3-put-mutation--full-resource-replacement)
5. [Demo 4: PATCH Mutation — Partial Updates (Soft Delete)](#demo-4-patch-mutation--partial-updates-soft-delete)
6. [Demo 5: UI Refresh Patterns — Pessimistic vs Optimistic](#demo-5-ui-refresh-patterns--pessimistic-vs-optimistic)
7. [Demo 6: SignalR — Real-Time Sync Across Clients](#demo-6-signalr--real-time-sync-across-clients)
8. [Troubleshooting & Common Pitfalls](#troubleshooting--common-pitfalls)

---

## Pre-Demo Setup & Checklist

### Prerequisites

- [ ] PostgreSQL running locally (`Host=localhost; Database=CalculatorDb`)
- [ ] .NET 8 SDK installed
- [ ] Node.js 18+ installed
- [ ] Two separate browser windows ready (for SignalR demo later)
- [ ] Swagger UI accessible for direct API testing

### Step 0A: Fix the Existing Bug in `apiClient.js`

> **TALKING POINT:** *"Before we start today's demos, there's a bug lurking in our Axios singleton. The variable is declared as `api` but the interceptors reference `apiClient`. This would cause a ReferenceError at runtime. This is the kind of bug that slips through when you rename things — always test after refactoring."*

Open `CLIENT/src/api/apiClient.js` and replace the **entire file** with:

```javascript
import axios from "axios";

// Singleton Axios instance — one source of truth for all API calls
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR — runs before every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    // Attach JWT token if it exists in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`>>> Sending ${config.method.toUpperCase()} to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — runs after every response comes back
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap response.data so callers don't need .data every time
    return response.data;
  },
  (error) => {
    console.error("<<< Global API Error:", error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Key changes to point out:**
1. Variable name is now consistently `apiClient` everywhere
2. Removed `withcredentials: true` (we use JWT Bearer tokens, not cookies)
3. Added automatic token injection in the request interceptor — every request now gets the JWT automatically

### Step 0B: Quick Login to Get a Token

> **TALKING POINT:** *"Our API requires authentication. Before we can POST calculations, we need a JWT token. Let's use Swagger to get one, then we'll automate this in our React app."*

1. Start the API: `cd API && dotnet run`
2. Start the client: `cd CLIENT && npm run dev`
3. Open Swagger at `http://localhost:5152/swagger`
4. Execute `POST /api/auth/login` with:

```json
{
  "username": "Skye",
  "password": "Skye123!"
}
```

5. Copy the returned token
6. Open the browser console on the React app (`http://localhost:5173`) and run:

```javascript
localStorage.setItem("token", "PASTE_YOUR_TOKEN_HERE");
```

> **TALKING POINT:** *"In production you'd build a login page. For today, we just need the token in localStorage so our interceptor can attach it. Notice how the interceptor we just fixed automatically grabs it — separation of concerns."*

---

## Demo 1: The Payload Contract — Wiring POST from React to .NET

### Learning Outcome

> *Enforce the "Payload Contract" between JavaScript objects and C# Data Transfer Objects (DTOs).*

### The Concept (2 min)

> **TALKING POINT:** *"Right now, our CalculationForm calculates the result CLIENT-SIDE and just pushes it into React state. That's not a mutation — the database never hears about it. Today we fix that. But there's a catch: JavaScript and C# have to agree on the shape of the data. That agreement is what I call the Payload Contract."*

Show the existing C# DTO side-by-side with what the form currently sends:

**C# — `CreateCalculationDto.cs` (the contract):**
```csharp
public class CreateCalculationDto
{
    [Required]
    public double left { get; set; }
    [Required]
    public double right { get; set; }
    [Required]
    public OperationType operand { get; set; }
}
```

**What the OperationType enum expects (integer values):**
```csharp
public enum OperationType
{
    Add = 0,
    Subtract = 1,
    Multiply = 2,
    Divide = 3
}
```

> **TALKING POINT:** *"Notice the C# DTO uses lowercase `left`, `right`, `operand`. And `operand` is an enum that maps to integers: Add=0, Subtract=1, etc. Our JavaScript payload MUST match these exact keys and value types. If we send `operation: "Add"` instead of `operand: 0`, the server returns a 400 Bad Request. This is the Payload Contract."*

### Step 1A: Create the API Service Layer

> **TALKING POINT:** *"We'll centralise all API calls in a service file. This keeps our hooks clean — they manage state, not HTTP details."*

Open the empty file `CLIENT/src/services/api.js` and add:

```javascript
import apiClient from "../api/apiClient";

// ============================================
// The OPERATION_MAP is our "Payload Contract" translator.
// React uses human-readable strings ("Add", "Subtract").
// The C# enum expects integers (0, 1, 2, 3).
// This map bridges the two worlds.
// ============================================
const OPERATION_MAP = {
  Add: 0,
  Subtract: 1,
  Multiply: 2,
  Divide: 3,
};

// POST /api/calculations — Create a new calculation
// The payload MUST match CreateCalculationDto exactly: { left, right, operand }
export async function createCalculation(left, right, operation) {
  const payload = {
    left: left,          // double — matches dto.left
    right: right,        // double — matches dto.right
    operand: OPERATION_MAP[operation], // int — matches dto.operand (enum)
  };

  console.log(">>> Payload Contract:", JSON.stringify(payload));
  return await apiClient.post("/calculations", payload);
}

// GET /api/calculations — Fetch paginated calculation list
export async function fetchCalculations(signal) {
  return await apiClient.get("/calculations", { signal });
}
```

### Step 1B: Update the Custom Hook

> **TALKING POINT:** *"Now we update useCalculations to use our service layer instead of calling apiClient directly. The hook's job is state management, not HTTP."*

Replace the contents of `CLIENT/src/hooks/useCalculations.js` with:

```javascript
import { useState, useEffect } from "react";
import { fetchCalculations, createCalculation } from "../services/api";

export function useCalculations() {
  const [calculations, setCalculations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetches calculation history from the API
  const fetchHistory = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCalculations(signal);
      // The paginated endpoint returns { totalCount, page, pageSize, data }
      setCalculations(response.data || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.message || "Failed to fetch data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount with AbortController for cleanup
  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
    return () => controller.abort();
  }, []);

  // ============================================
  // PESSIMISTIC ADD — The "Safe" Pattern
  // 1. Send to API first
  // 2. Wait for server confirmation
  // 3. THEN update local state with server's response
  // ============================================
  const addCalculation = async (left, right, operation) => {
    setError(null);
    try {
      const result = await createCalculation(left, right, operation);
      // Server responded with { result, operation }
      // Refetch the full list to get the record with its DB-generated ID
      const controller = new AbortController();
      await fetchHistory(controller.signal);
      return result;
    } catch (err) {
      // Re-throw so the form can handle validation errors
      throw err;
    }
  };

  const totalSum = calculations.reduce(
    (acc, curr) => acc + (curr.result || 0),
    0
  );

  const retry = () => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
  };

  return { calculations, isLoading, error, addCalculation, totalSum, retry };
}

export default useCalculations;
```

### Step 1C: Update the Form to POST to the API

> **TALKING POINT:** *"This is the big change. Instead of calculating client-side, the form now sends the raw operands to the server. The server does the math, persists to PostgreSQL, and returns the result. If the server says 'no' — we handle it."*

Replace the contents of `CLIENT/src/components/CalculationForm.jsx` with:

```jsx
import { useState } from "react";
import Button from "./Button";

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
```

### Step 1D: Fix App.jsx Destructuring

> **TALKING POINT:** *"App.jsx was already referencing `error` and `retry` from the hook, but wasn't destructuring them. Let's fix that."*

Replace the destructuring line in `CLIENT/src/App.jsx`:

```jsx
// BEFORE (missing error and retry):
const { calculations, isLoading, addCalculation, totalSum } = useCalculations();

// AFTER (complete destructuring):
const { calculations, isLoading, error, addCalculation, totalSum, retry } = useCalculations();
```

### Step 1E: Add Form Error Styles

Add to the bottom of `CLIENT/src/index.css`:

```css
/* ============================================
   Form Validation Errors
   ============================================ */
.form-error {
  width: 100%;
  color: #c53030;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.field-error {
  color: #c53030;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
```

### Live Demo (5 min)

1. **Show the empty form** — refresh the page, show existing calculations loading from DB
2. **Enter values** — e.g., `10 + 5`
3. **Open the Network tab** before clicking Calculate
4. **Click Calculate** — Point out:
   - The POST request in the Network tab
   - The payload: `{"left": 10, "right": 5, "operand": 0}`
   - The response: `{"result": 15, "operation": "Add"}`
   - The subsequent GET request that refetches the list
5. **Show the new calculation** in the list with its real database ID

### Deliberate Break Demo: Payload Mismatch

> **TALKING POINT:** *"Watch what happens when the Payload Contract is violated."*

1. Temporarily change the payload key in `api.js` from `operand` to `operation`:

```javascript
const payload = {
  left: left,
  right: right,
  operation: OPERATION_MAP[operation], // WRONG KEY — should be 'operand'
};
```

2. Submit the form — show the **400 Bad Request** in the Network tab
3. Expand the response body — show the ProblemDetails error structure
4. **Revert the change** back to `operand`

> **TALKING POINT:** *"The server expects `operand` because that's what CreateCalculationDto defines. We sent `operation` — the server couldn't bind it, so we got a 400. This is why the Payload Contract matters. One mismatched key and your entire mutation fails silently."*

---

## Demo 2: The Validation Handshake — Parsing ProblemDetails

### Learning Outcome

> *Negotiate the "Validation Handshake" by parsing .NET 8 ProblemDetails for user feedback.*

### The Concept (3 min)

> **TALKING POINT:** *"When .NET model validation fails, it doesn't just say 'Bad Request.' It returns a structured error object following RFC 7807 — called ProblemDetails. It tells you exactly WHICH fields failed and WHY. Our job is to parse this and show the right error under the right form field."*

Show the ProblemDetails structure (use Swagger to trigger one):

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "left": ["The left field is required."],
    "operand": ["The operand field is required."]
  }
}
```

### Step 2A: Add Server-Side Validation to the DTO

> **TALKING POINT:** *"Let's add more specific validation rules so we have richer errors to parse."*

Replace `API/DTOs/CreateCalculationDto.cs` with:

```csharp
using System.ComponentModel.DataAnnotations;
using CalculatorDomainDemo;

public class CreateCalculationDto
{
    [Required(ErrorMessage = "The first number (left) is required.")]
    [Range(-1000000, 1000000, ErrorMessage = "Left operand must be between -1,000,000 and 1,000,000.")]
    public double left { get; set; }

    [Required(ErrorMessage = "The second number (right) is required.")]
    [Range(-1000000, 1000000, ErrorMessage = "Right operand must be between -1,000,000 and 1,000,000.")]
    public double right { get; set; }

    [Required(ErrorMessage = "The operation type is required.")]
    [EnumDataType(typeof(OperationType), ErrorMessage = "Invalid operation. Must be 0 (Add), 1 (Subtract), 2 (Multiply), or 3 (Divide).")]
    public OperationType operand { get; set; }
}
```

### Step 2B: Create the Validation Error Parser

> **TALKING POINT:** *"This utility function is the heart of the Validation Handshake. It knows how to dig into the ProblemDetails structure and extract per-field errors."*

Create a new file `CLIENT/src/utils/parseValidationErrors.js`:

```javascript
// ============================================
// parseValidationErrors.js
// The "Validation Handshake" — translating .NET ProblemDetails
// into React-friendly per-field error messages.
//
// .NET ProblemDetails (RFC 7807) returns:
// {
//   "title": "One or more validation errors occurred.",
//   "status": 400,
//   "errors": {
//     "left":    ["The first number (left) is required."],
//     "operand": ["Invalid operation. Must be 0-3."]
//   }
// }
//
// We transform this into:
// {
//   left:    "The first number (left) is required.",
//   operand: "Invalid operation. Must be 0-3."
// }
// ============================================

export function parseValidationErrors(axiosError) {
  // Step 1: Check if the server returned response data
  const data = axiosError?.response?.data;
  if (!data) {
    return { _generic: axiosError.message || "An unknown error occurred." };
  }

  // Step 2: Check for ProblemDetails "errors" object (RFC 7807)
  if (data.errors && typeof data.errors === "object") {
    const fieldErrors = {};
    for (const [field, messages] of Object.entries(data.errors)) {
      // .NET sends arrays of messages per field — we take the first one
      fieldErrors[field.toLowerCase()] = Array.isArray(messages)
        ? messages[0]
        : messages;
    }
    return fieldErrors;
  }

  // Step 3: Check for our custom middleware error shape
  if (data.detail) {
    return { _generic: data.detail };
  }

  // Step 4: Fallback
  return { _generic: data.title || "Validation failed. Please check your inputs." };
}
```

### Step 2C: Update the Form with Per-Field Error Display

> **TALKING POINT:** *"Now we connect the dots. The form catches errors, passes them through our parser, and displays the right message under the right field."*

Replace `CLIENT/src/components/CalculationForm.jsx` with:

```jsx
import { useState } from "react";
import Button from "./Button";
import { parseValidationErrors } from "../utils/parseValidationErrors";

function CalculationForm({ onAdd }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [operation, setOperation] = useState("Add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await onAdd(parseFloat(left), parseFloat(right), operation);
      setLeft("");
      setRight("");
    } catch (err) {
      // === THE VALIDATION HANDSHAKE ===
      // Parse the .NET ProblemDetails into per-field errors
      const parsed = parseValidationErrors(err);
      setErrors(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="calc-form">
      <div className="form-field">
        <input
          type="number"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder="Number 1"
          className={errors.left ? "input-error" : ""}
        />
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
        {errors.right && <p className="field-error">{errors.right}</p>}
      </div>

      <Button label={isSubmitting ? "Saving..." : "Calculate"} />

      {/* Generic errors (not tied to a specific field) */}
      {errors._generic && <p className="form-error">{errors._generic}</p>}
      {errors.operand && <p className="form-error">Operation: {errors.operand}</p>}
    </form>
  );
}

export default CalculationForm;
```

### Step 2D: Add Input Error Styles

Add to `CLIENT/src/index.css`:

```css
/* ============================================
   Form Field Layout & Validation Styling
   ============================================ */
.form-field {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 100px;
}

.input-error {
  border-color: #c53030 !important;
  box-shadow: 0 0 0 3px rgba(197, 48, 48, 0.2) !important;
}
```

### Live Demo (5 min)

1. **Trigger Division by Zero:**
   - Enter `10 / 0`
   - Click Calculate
   - Show the error message from `ExceptionHandlingMiddleware` ("Division by zero is not allowed.")
   - Point out: this came from `CalculatorService.CalculateAsync` → thrown as `InvalidOperationException` → caught by middleware → returned as custom error shape

2. **Trigger ProblemDetails Validation:**
   - Temporarily modify the `createCalculation` function in `api.js` to send a bad payload:
   ```javascript
   const payload = {
     left: left,
     right: right,
     operand: 99, // Invalid enum value
   };
   ```
   - Submit the form — show the per-field error "Invalid operation. Must be 0 (Add), 1 (Subtract), 2 (Multiply), or 3 (Divide)." appearing in the UI
   - **Revert the change**

3. **Show the Network Tab:**
   - Point to the 400 response
   - Expand the response body — show the `errors` object
   - Trace the path: `err.response.data.errors` → `parseValidationErrors()` → per-field state → rendered under each input

> **TALKING POINT:** *"This is the Validation Handshake complete. The server speaks ProblemDetails, our parser translates it, and React renders it exactly where the user needs to see it. No more generic 'Save Failed' alerts."*

---

## Demo 3: PUT Mutation — Full Resource Replacement

### Learning Outcome

> *Execute persistent HTTP mutations (PUT) to a PostgreSQL database.*

### The Concept (2 min)

> **TALKING POINT:** *"POST creates new records. PUT replaces an ENTIRE existing record. Think of it like overwriting a file — you must send ALL fields, not just the ones you changed. If you omit a field, it gets set to its default value."*

### Step 3A: Create an Update DTO

Create `API/DTOs/UpdateCalculationDto.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
using CalculatorDomainDemo;

public class UpdateCalculationDto
{
    [Required(ErrorMessage = "The first number (left) is required.")]
    public double left { get; set; }

    [Required(ErrorMessage = "The second number (right) is required.")]
    public double right { get; set; }

    [Required(ErrorMessage = "The operation type is required.")]
    [EnumDataType(typeof(OperationType))]
    public OperationType operand { get; set; }
}
```

### Step 3B: Add the PUT Endpoint to the Controller

Add this method inside `CalculationsController.cs`, after the existing `[HttpPost]` method:

```csharp
// PUT /api/calculations/{id} — Full replacement of a calculation
[HttpPut("{id}")]
public async Task<IActionResult> Update(int id, [FromBody] UpdateCalculationDto dto)
{
    var calculation = await _context.Calculations.FindAsync(id);

    if (calculation == null || !calculation.IsActive)
        return NotFound(new { error = "Calculation not found" });

    // Verify the user owns this calculation
    var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
    if (calculation.UserId != userId)
        return Forbid();

    // PUT = full replacement — recalculate the result
    double newResult = dto.operand switch
    {
        OperationType.Add => dto.left + dto.right,
        OperationType.Subtract => dto.left - dto.right,
        OperationType.Multiply => dto.left * dto.right,
        OperationType.Divide when dto.right != 0 => dto.left / dto.right,
        OperationType.Divide => throw new InvalidOperationException("Division by zero is not allowed."),
        _ => throw new InvalidOperationException("Unsupported operation.")
    };

    // Replace ALL fields (this is what makes it PUT, not PATCH)
    calculation.Left = dto.left;
    calculation.Right = dto.right;
    calculation.Operation = dto.operand;
    calculation.Result = newResult;

    await _context.SaveChangesAsync();

    return Ok(new CalculationResultDto
    {
        Result = calculation.Result,
        Operation = calculation.Operation.ToString()
    });
}
```

### Step 3C: Add the PUT Client Function

Add to `CLIENT/src/services/api.js`:

```javascript
// PUT /api/calculations/:id — Full replacement of a calculation
export async function updateCalculation(id, left, right, operation) {
  const payload = {
    left: left,
    right: right,
    operand: OPERATION_MAP[operation],
  };

  return await apiClient.put(`/calculations/${id}`, payload);
}
```

### Live Demo (3 min)

1. **Use Swagger** to demonstrate the PUT endpoint:
   - Find an existing calculation ID from the GET list
   - Execute `PUT /api/calculations/{id}` with new values
   - Show the old record is completely overwritten in the database

2. **Show the contrast:**
   - "If I send only `{ left: 99 }` without `right` and `operand`, what happens?"
   - Execute it — show the validation errors for missing required fields
   - "PUT demands the COMPLETE payload. That's the contract."

> **TALKING POINT:** *"PUT is 'total replacement.' You're saying: 'Server, forget what you had for this ID. Here's the entire new version.' This is why all fields are required — you're replacing the whole resource."*

---

## Demo 4: PATCH Mutation — Partial Updates (Soft Delete)

### Learning Outcome

> *Execute persistent HTTP mutations (PATCH) to a PostgreSQL database.*

### The Concept (2 min)

> **TALKING POINT:** *"PATCH is surgical. You only send the fields you want to change. In our case, the perfect PATCH use case is soft delete — we only flip `IsActive` to false without touching the operands or result."*

### Step 4A: Add the PATCH Endpoint

Add this method inside `CalculationsController.cs`:

```csharp
// PATCH /api/calculations/{id}/deactivate — Soft delete (partial update)
[HttpPatch("{id}/deactivate")]
public async Task<IActionResult> Deactivate(int id)
{
    var calculation = await _context.Calculations.FindAsync(id);

    if (calculation == null || !calculation.IsActive)
        return NotFound(new { error = "Calculation not found or already deactivated" });

    var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
    if (calculation.UserId != userId)
        return Forbid();

    // PATCH = partial update — only change what's needed
    calculation.IsActive = false;
    calculation.DeletedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new { message = "Calculation deactivated", id = calculation.Id });
}
```

### Step 4B: Add the PATCH Client Function

Add to `CLIENT/src/services/api.js`:

```javascript
// PATCH /api/calculations/:id/deactivate — Soft delete
export async function deactivateCalculation(id) {
  return await apiClient.patch(`/calculations/${id}/deactivate`);
}
```

### Step 4C: Add a Delete Button to CalculationCard

Replace `CLIENT/src/components/CalculationCard.jsx` with:

```jsx
function CalculationCard({ calculation, onDeactivate }) {
  return (
    <div className="calc-card">
      <p>
        {calculation.left} {calculation.operation} {calculation.right} ={" "}
        {calculation.result}
      </p>
      {onDeactivate && (
        <button
          className="deactivate-btn"
          onClick={() => onDeactivate(calculation.id)}
        >
          Remove
        </button>
      )}
    </div>
  );
}

export default CalculationCard;
```

### Step 4D: Wire Up the Deactivation in the Hook

Add to `CLIENT/src/hooks/useCalculations.js` (inside the hook function, before the return):

```javascript
// PATCH — Soft-delete a calculation
const removeCalculation = async (id) => {
  try {
    await deactivateCalculation(id);
    // Refetch to stay in sync with the server
    const controller = new AbortController();
    await fetchHistory(controller.signal);
  } catch (err) {
    setError(err.message || "Failed to deactivate calculation");
  }
};
```

And add `deactivateCalculation` to the import:

```javascript
import { fetchCalculations, createCalculation, deactivateCalculation } from "../services/api";
```

And add `removeCalculation` to the return object:

```javascript
return { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry };
```

### Step 4E: Pass the Handler Down Through Components

In `App.jsx`, destructure `removeCalculation` and pass it to the list:

```jsx
const { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry } = useCalculations();

// ... in the JSX:
<CalculationList calculations={calculations} onDeactivate={removeCalculation} />
```

In `CalculationList.jsx`, pass it to each card:

```jsx
function CalculationList({ calculations, onDeactivate }) {
  return (
    <div className="calc-list">
      <h2>Calculation History</h2>
      {calculations.map((calc) => (
        <CalculationCard
          key={calc.id}
          calculation={calc}
          onDeactivate={onDeactivate}
        />
      ))}
    </div>
  );
}
```

### Step 4F: Add Deactivate Button Styles

Add to `CLIENT/src/index.css`:

```css
/* ============================================
   Deactivate / Remove Button
   ============================================ */
.calc-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deactivate-btn {
  padding: 0.3rem 0.8rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.deactivate-btn:hover {
  opacity: 0.8;
}
```

### Live Demo (4 min)

1. **Show the list** with Remove buttons on each card
2. **Click Remove** on one calculation
3. **Open Network tab** — point out:
   - It's a `PATCH` request (not DELETE, not PUT)
   - The URL includes the ID: `/api/calculations/5/deactivate`
   - There's no request body — PATCH can be "just change this one thing"
4. **Show the calculation disappears** from the list
5. **Open pgAdmin/database** — show the record still exists with `IsActive = false` and `DeletedAt` set

> **TALKING POINT:** *"This is the power of PATCH — surgical precision. We didn't send the entire calculation again (that's PUT). We just told the server: 'flip IsActive to false.' And because it's a soft delete, the data is never truly lost. Audit trail preserved."*

### Contrast Summary (Quick Whiteboard)

| Verb  | Purpose                  | Payload            | Example                     |
|-------|--------------------------|--------------------|-----------------------------|
| POST  | Create new resource      | Full object        | New calculation              |
| PUT   | Replace entire resource  | Full object        | Redo a calculation           |
| PATCH | Modify specific fields   | Partial or none    | Deactivate (soft delete)     |

---

## Demo 5: UI Refresh Patterns — Pessimistic vs Optimistic

### Learning Outcome

> *Contrast Optimistic vs. Pessimistic UI updates for high-performance UX.*

### The Concept (3 min)

> **TALKING POINT:** *"We've been using Pessimistic updates — wait for the server, THEN update the UI. It's safe, but the user sees a loading delay. Optimistic updates flip this: update the UI IMMEDIATELY, then if the server says 'no,' roll it back. It feels instant but requires rollback logic."*

### Step 5A: Show Pessimistic (Already Implemented)

> **TALKING POINT:** *"Look at our current `addCalculation` in the hook. We call `createCalculation()`, WAIT for it, then call `fetchHistory()` to reload. The user sees the 'Saving...' button text during this wait. This is Pessimistic — we don't trust the outcome until the server confirms."*

Point to the current code:

```javascript
// PESSIMISTIC — what we have now
const addCalculation = async (left, right, operation) => {
  const result = await createCalculation(left, right, operation); // WAIT
  await fetchHistory(controller.signal);                          // THEN refresh
  return result;
};
```

### Step 5B: Demonstrate Optimistic Update Pattern

> **TALKING POINT:** *"Now watch the optimistic version. We add the item to the UI FIRST, before the server responds. If the request fails, we roll back to the previous state."*

Show this alternative version (write it below the existing function, commented out for comparison):

```javascript
// ============================================
// OPTIMISTIC ADD — The "Fast" Pattern
// 1. Save previous state (for rollback)
// 2. Immediately update UI with predicted result
// 3. Send to API in background
// 4. If API fails → rollback to saved state
// ============================================
const addCalculationOptimistic = async (left, right, operation) => {
  setError(null);

  // Step 1: Snapshot current state for rollback
  const previousCalculations = [...calculations];

  // Step 2: Predict the result locally (same math the server would do)
  const ops = { Add: "+", Subtract: "-", Multiply: "*", Divide: "/" };
  let predictedResult = 0;
  if (operation === "Add") predictedResult = left + right;
  if (operation === "Subtract") predictedResult = left - right;
  if (operation === "Multiply") predictedResult = left * right;
  if (operation === "Divide") predictedResult = left / right;

  const optimisticCalc = {
    id: `temp-${Date.now()}`, // Temporary ID — will be replaced by DB ID
    left,
    right,
    operation: ops[operation],
    result: predictedResult,
  };

  // Step 3: Update UI immediately — user sees it INSTANTLY
  setCalculations((prev) => [...prev, optimisticCalc]);

  try {
    // Step 4: Send to server in background
    await createCalculation(left, right, operation);
    // Step 5: Refetch to replace temp ID with real DB ID
    const controller = new AbortController();
    await fetchHistory(controller.signal);
  } catch (err) {
    // Step 6: ROLLBACK — restore the previous state
    console.warn("Optimistic update rolled back:", err.message);
    setCalculations(previousCalculations);
    throw err;
  }
};
```

### Live Demo (5 min)

1. **Pessimistic demo:**
   - Slow down the network in Chrome DevTools → Network → Throttle → "Slow 3G"
   - Submit a calculation — point out the "Saving..." delay before the list updates
   - "The user waits. Safe, but slow."

2. **Optimistic demo:**
   - Swap `addCalculation` to use the optimistic version temporarily
   - Submit a calculation on Slow 3G — it appears INSTANTLY in the list
   - "The user sees the result immediately. The network request is happening in the background."

3. **Rollback demo:**
   - With optimistic enabled, trigger an error (e.g., divide by zero)
   - The item briefly appears, then disappears when the server rejects it
   - "That's the rollback. The optimistic prediction was wrong, so we undo it."

4. **Reset throttle** back to normal and **revert to pessimistic** (the safe default)

> **TALKING POINT:** *"In real apps, use Optimistic for actions with high confidence of success — like toggling a 'read' status. Use Pessimistic for important mutations — like payments or bookings. Know the trade-off: speed vs. safety."*

---

## Demo 6: SignalR — Real-Time Sync Across Clients

### Learning Outcome

> *Synchronize application state across multiple clients using SignalR WebSockets.*

### The Concept (3 min)

> **TALKING POINT:** *"Everything we've built so far has a problem: if User A creates a calculation, User B doesn't see it until they refresh. In a booking system, that's a disaster — two people could book the same room. SignalR solves this. The server PUSHES updates to every connected client in real-time."*

### Step 6A: Install the SignalR NuGet Package

Run in the `API` directory:

```bash
dotnet add package Microsoft.AspNetCore.SignalR
```

> **NOTE:** SignalR is included in the ASP.NET Core shared framework for .NET 8, so this package may already be available. The `dotnet add` command won't hurt if it's already present.

### Step 6B: Create the SignalR Hub

Create a new file `API/Hubs/CalculationHub.cs`:

```csharp
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs
{
    // A Hub is like a "broadcast station" — clients connect to it,
    // and the server can push messages to all connected clients.
    public class CalculationHub : Hub
    {
        // Called automatically when a client connects
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        // Called automatically when a client disconnects
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
```

### Step 6C: Register SignalR in `Program.cs`

Add to the service registration section (after `builder.Services.AddControllers();`):

```csharp
builder.Services.AddSignalR();
```

Add to the endpoint mapping section (after `app.MapControllers();`):

```csharp
app.MapHub<API.Hubs.CalculationHub>("/hubs/calculations");
```

Update the CORS policy to allow SignalR's credentials:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Required for SignalR WebSocket negotiation
    });
});
```

### Step 6D: Broadcast from the Controller

> **TALKING POINT:** *"The Hub is the broadcast station. But WHO triggers the broadcast? The Controller. After a successful POST, PUT, or PATCH, the controller tells the Hub: 'Hey, something changed — tell everyone.'"*

Update `CalculationsController.cs`:

Add the using statement at the top:

```csharp
using API.Hubs;
using Microsoft.AspNetCore.SignalR;
```

Add `IHubContext` to the constructor:

```csharp
private readonly CalculatorService _calculator;
private readonly CalculatorDbContext _context;
private readonly IHubContext<CalculationHub> _hubContext;

public CalculationsController(
    CalculatorService calculator,
    CalculatorDbContext context,
    IHubContext<CalculationHub> hubContext)
{
    _calculator = calculator;
    _context = context;
    _hubContext = hubContext;
}
```

Update the POST method to broadcast after saving:

```csharp
[HttpPost]
public async Task<IActionResult> Calculate([FromBody] CreateCalculationDto dto)
{
    var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrEmpty(userId))
        return Unauthorized("User ID not found in token");

    var request = new CalculationRequest(dto.left, dto.right, dto.operand);
    var calculation = await _calculator.CalculateAsync(request, userId);

    var response = new CalculationResultDto
    {
        Result = calculation.Result,
        Operation = calculation.Operation.ToString()
    };

    // === SIGNALR BROADCAST ===
    // Tell ALL connected clients: "A new calculation was created!"
    await _hubContext.Clients.All.SendAsync("CalculationCreated", new
    {
        id = calculation.Id,
        left = calculation.Left,
        right = calculation.Right,
        operation = calculation.Operation.ToString(),
        result = calculation.Result
    });

    return Ok(response);
}
```

Also add a broadcast to the PATCH (deactivate) method:

```csharp
// After _context.SaveChangesAsync() in the Deactivate method:
await _hubContext.Clients.All.SendAsync("CalculationDeactivated", new { id = calculation.Id });
```

### Step 6E: Install the SignalR Client Package

Run in the `CLIENT` directory:

```bash
npm install @microsoft/signalr
```

### Step 6F: Create the SignalR Hook

> **TALKING POINT:** *"In React, we manage the SignalR lifecycle with a custom hook. Connect on mount, subscribe to events, disconnect on unmount. If you skip the cleanup, you get ghost connections — sockets that stay open even after the component is gone."*

Create `CLIENT/src/hooks/useSignalR.js`:

```javascript
import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

// ============================================
// useSignalR — Manages the real-time connection lifecycle
//
// Connection:    Create HubConnection when the component mounts
// Subscription:  Listen for specific events ("CalculationCreated", etc.)
// Action:        Update React state when events fire
// Cleanup:       Disconnect when the component unmounts (prevent ghost connections!)
// ============================================

export function useSignalR(onCalculationCreated, onCalculationDeactivated) {
  // useRef persists the connection across renders without causing re-renders
  const connectionRef = useRef(null);

  useEffect(() => {
    // === STEP 1: CONNECTION ===
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5152/hubs/calculations")
      .withAutomaticReconnect()   // Auto-reconnect on network drops
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    // === STEP 2: SUBSCRIPTION ===
    // Listen for "CalculationCreated" events from the server
    connection.on("CalculationCreated", (data) => {
      console.log("SignalR >>> CalculationCreated:", data);
      if (onCalculationCreated) {
        onCalculationCreated(data);
      }
    });

    // Listen for "CalculationDeactivated" events
    connection.on("CalculationDeactivated", (data) => {
      console.log("SignalR >>> CalculationDeactivated:", data);
      if (onCalculationDeactivated) {
        onCalculationDeactivated(data);
      }
    });

    // === STEP 3: START the connection ===
    connection
      .start()
      .then(() => console.log("SignalR Connected!"))
      .catch((err) => console.error("SignalR Connection Error:", err));

    // === STEP 4: CLEANUP on unmount ===
    // CRUCIAL: Without this, the WebSocket stays open forever (ghost connection)
    return () => {
      connection
        .stop()
        .then(() => console.log("SignalR Disconnected (cleanup)"));
    };
  }, []); // Empty deps = run once on mount

  return connectionRef;
}

export default useSignalR;
```

### Step 6G: Integrate SignalR into useCalculations

> **TALKING POINT:** *"The last piece: when SignalR fires, we update React state. No refetch needed — the server sends us the exact data. This is the Gold Standard for real-time apps."*

Update `CLIENT/src/hooks/useCalculations.js` to incorporate SignalR:

```javascript
import { useState, useEffect, useCallback } from "react";
import { fetchCalculations, createCalculation, deactivateCalculation } from "../services/api";
import { useSignalR } from "./useSignalR";

export function useCalculations() {
  const [calculations, setCalculations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCalculations(signal);
      setCalculations(response.data || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.message || "Failed to fetch data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
    return () => controller.abort();
  }, []);

  // === SIGNALR EVENT HANDLERS ===
  // When the server broadcasts "CalculationCreated", refetch to get the full updated list
  const handleCalculationCreated = useCallback(() => {
    console.log("SignalR: Refetching after CalculationCreated...");
    const controller = new AbortController();
    fetchHistory(controller.signal);
  }, []);

  // When the server broadcasts "CalculationDeactivated", remove it from local state
  const handleCalculationDeactivated = useCallback((data) => {
    console.log("SignalR: Removing deactivated calculation", data.id);
    setCalculations((prev) => prev.filter((c) => c.id !== data.id));
  }, []);

  // Connect to SignalR — events will trigger the handlers above
  useSignalR(handleCalculationCreated, handleCalculationDeactivated);

  // PESSIMISTIC ADD — send to API, let SignalR handle the state update
  const addCalculation = async (left, right, operation) => {
    setError(null);
    try {
      const result = await createCalculation(left, right, operation);
      // No manual refetch needed — SignalR broadcast will trigger handleCalculationCreated
      return result;
    } catch (err) {
      throw err;
    }
  };

  // PATCH — Soft-delete, let SignalR handle the state update
  const removeCalculation = async (id) => {
    try {
      await deactivateCalculation(id);
      // No manual state update — SignalR broadcast will trigger handleCalculationDeactivated
    } catch (err) {
      setError(err.message || "Failed to deactivate calculation");
    }
  };

  const totalSum = calculations.reduce(
    (acc, curr) => acc + (curr.result || 0),
    0
  );

  const retry = () => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
  };

  return { calculations, isLoading, error, addCalculation, removeCalculation, totalSum, retry };
}

export default useCalculations;
```

### The Big Live Demo (7 min)

> **This is the highlight of the entire session.**

1. **Open two browser windows side by side**, both at `http://localhost:5173`
2. **Open the console** in both windows — show "SignalR Connected!" in each
3. **In Window A:** Submit a calculation (e.g., `25 + 17`)
4. **Watch Window B:** The new calculation appears AUTOMATICALLY — no refresh!
5. **In Window B:** Click "Remove" on a calculation
6. **Watch Window A:** The calculation disappears AUTOMATICALLY
7. **Show the console logs:**
   - Window A: `>>> Sending POST to /calculations`
   - Window B: `SignalR >>> CalculationCreated: {id: 42, left: 25, ...}`
   - "Window B never made an HTTP request. The SERVER pushed the update via WebSocket."

8. **Open Network tab in Window B** and filter by "WS" (WebSocket):
   - Show the persistent WebSocket connection
   - Show the frames being exchanged in real-time
   - "This is the Push model. No polling. No wasted requests. The server tells the client."

> **TALKING POINT:** *"Compare this to our earlier pattern where we called fetchHistory() after every mutation. That's the Pull model — extra network traffic, stale data possible between polls. SignalR is the Push model — the server broadcasts to everyone instantly. For a booking system, this is the difference between double-bookings and a seamless collaborative experience."*

### Lifecycle Cleanup Demo

> **TALKING POINT:** *"One last thing — cleanup. Watch the console when I close one of the tabs."*

1. Close Window B
2. Show the server console: `Client disconnected: {connectionId}`
3. "The `useSignalR` cleanup function called `connection.stop()`. Without that cleanup, the server would still try to push updates to a dead socket — wasting resources and eventually erroring."

---

## Troubleshooting & Common Pitfalls

### "401 Unauthorized on POST"

**Cause:** JWT token is missing or expired.

**Fix:**
1. Re-login via Swagger: `POST /api/auth/login`
2. Store token: `localStorage.setItem("token", "NEW_TOKEN_HERE")`
3. The Axios interceptor will pick it up on the next request

### "400 Bad Request — Payload Contract"

**Cause:** JavaScript object keys don't match C# DTO properties.

**Fix:** Compare your JS payload with `CreateCalculationDto`:
- JS key `operand` (int) ← must match → C# `operand` (OperationType enum)
- Not `operation`, not `operator`, not `op` — exactly `operand`

### "CORS Error on SignalR"

**Cause:** CORS policy missing `.AllowCredentials()`.

**Fix:** Ensure `Program.cs` has:
```csharp
policy.WithOrigins("http://localhost:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials(); // THIS is required for SignalR
```

### "SignalR Negotiation 404"

**Cause:** Hub endpoint not mapped.

**Fix:** Ensure `Program.cs` has:
```csharp
app.MapHub<API.Hubs.CalculationHub>("/hubs/calculations");
```
and it comes AFTER `app.MapControllers();`

### "Ghost connections / memory leak warning"

**Cause:** Missing cleanup in `useSignalR`.

**Fix:** The `useEffect` return function MUST call `connection.stop()`:
```javascript
return () => {
  connection.stop();
};
```

### "Changes appear in Database but not in UI"

**Cause:** SignalR broadcast sends different field names than what React expects.

**Fix:** Ensure the broadcast payload matches what CalculationCard renders:
```csharp
// Server sends:
new { id, left, right, operation = "Add", result }

// React expects:
calculation.id, calculation.left, calculation.operation, calculation.result
```

### "Optimistic update flickers then disappears"

**Cause:** Rollback working correctly after server rejection — this is expected behavior for optimistic updates.

**Fix:** Not a bug! If it keeps happening, check the server-side validation. If the operation consistently fails, use Pessimistic instead.

---

## Summary: What We Built Today

| Slide Concept                    | Demo                                    | Files Changed                         |
|----------------------------------|-----------------------------------------|---------------------------------------|
| HTTP Mutations (POST)            | Demo 1: Form POSTs to API              | `api.js`, `useCalculations.js`, `CalculationForm.jsx` |
| Payload Contract                 | Demo 1: Mismatch demo → 400 error      | `api.js` (OPERATION_MAP)              |
| Validation Handshake             | Demo 2: Per-field error display         | `parseValidationErrors.js`, `CalculationForm.jsx`, `CreateCalculationDto.cs` |
| HTTP Mutations (PUT)             | Demo 3: Full replacement via Swagger    | `CalculationsController.cs`, `UpdateCalculationDto.cs`, `api.js` |
| HTTP Mutations (PATCH)           | Demo 4: Soft-delete with Remove button  | `CalculationsController.cs`, `CalculationCard.jsx`, `api.js` |
| Optimistic vs Pessimistic        | Demo 5: Side-by-side with Slow 3G      | `useCalculations.js` (both patterns)  |
| SignalR Real-Time                | Demo 6: Two windows in sync            | `CalculationHub.cs`, `Program.cs`, `useSignalR.js`, `useCalculations.js` |

---

## File Reference — Final State

After all demos, these files will be new or modified:

### New Files
- `API/Hubs/CalculationHub.cs`
- `API/DTOs/UpdateCalculationDto.cs`
- `CLIENT/src/utils/parseValidationErrors.js`
- `CLIENT/src/hooks/useSignalR.js`

### Modified Files
- `API/Program.cs` — Added SignalR services, hub mapping, CORS credentials
- `API/Controllers/CalculationsController.cs` — Added PUT, PATCH, SignalR broadcasts
- `API/DTOs/CreateCalculationDto.cs` — Added validation attributes
- `CLIENT/src/api/apiClient.js` — Fixed variable name bug, added token interceptor
- `CLIENT/src/services/api.js` — Added all mutation functions
- `CLIENT/src/hooks/useCalculations.js` — SignalR integration, pessimistic/optimistic patterns
- `CLIENT/src/components/CalculationForm.jsx` — Async submission, validation errors
- `CLIENT/src/components/CalculationCard.jsx` — Added Remove button
- `CLIENT/src/components/CalculationList.jsx` — Passes onDeactivate prop
- `CLIENT/src/App.jsx` — Fixed destructuring, passes removeCalculation
- `CLIENT/src/index.css` — Added error and button styles
- `CLIENT/package.json` — Added @microsoft/signalr dependency
