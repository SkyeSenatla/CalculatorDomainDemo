import apiClient from "../api/apiClient";

// POST /api/auth/login
// Sends username + password to the server. If valid, the server
// returns { token: "jwt_string" } which we pass back to the caller.
// The caller (LoginPage) then persists it via AuthContext.login().
export async function loginUser(username, password) {
  return await apiClient.post("/auth/login", { username, password });
}

// The OPERATION_MAP translates React's human-readable strings ("Add", "Subtract")
// to the C# enum integers (0, 1, 2, 3) expected by the API.
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
    left: left,                        // double — matches dto.left
    right: right,                      // double — matches dto.right
    operand: OPERATION_MAP[operation],  // int — matches dto.operand (enum)
  };
  console.log(">>> Payload Contract:", JSON.stringify(payload));
  return await apiClient.post("/calculations", payload);
}

// GET /api/calculations — Fetch paginated calculation list
export async function fetchCalculations(signal) {
  return await apiClient.get("/calculations", { signal });
}

// PUT /api/calculations/:id — Full replacement of a calculation
export async function updateCalculation(id, left, right, operation) {
  const payload = {
    left: left,
    right: right,
    operand: OPERATION_MAP[operation],
  };
  return await apiClient.put(`/calculations/${id}`, payload);
}

// PATCH /api/calculations/:id/deactivate — Soft delete
export async function deactivateCalculation(id) {
  return await apiClient.patch(`/calculations/${id}/deactivate`);
}
