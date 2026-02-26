// ================================================================
// DEMO 1 (Step 1A): THE API SERVICE LAYER — Payload Contract
// ================================================================

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

// ================================================================
// DEMO 1: POST /api/calculations — Create a new calculation
// ================================================================
// The payload MUST match CreateCalculationDto exactly: { left, right, operand }
export async function createCalculation(left, right, operation) {
  const payload = {
    left: left,                        // double — matches dto.left
    right: right,                      // double — matches dto.right
    operand: OPERATION_MAP[operation],  // int — matches dto.operand (enum)
  };
  console.log(">>> Payload Contract:", JSON.stringify(payload));
  return await apiClient.post("/calculations", payload);
}

// ================================================================
// DEMO 1: GET /api/calculations — Fetch paginated calculation list
// ================================================================
export async function fetchCalculations(signal) {
  return await apiClient.get("/calculations", { signal });
}

// ================================================================
// DEMO 3 (Step 3C): PUT /api/calculations/:id — Full replacement of a calculation
// ================================================================
export async function updateCalculation(id, left, right, operation) {
  const payload = {
    left: left,
    right: right,
    operand: OPERATION_MAP[operation],
  };
  return await apiClient.put(`/calculations/${id}`, payload);
}

// ================================================================
// DEMO 4 (Step 4B): PATCH /api/calculations/:id/deactivate — Soft delete
// ================================================================
export async function deactivateCalculation(id) {
  return await apiClient.patch(`/calculations/${id}/deactivate`);
}
