import apiClient from "@/api/apiClient";

export async function loginUser(username: string, password: string) {
  return await apiClient.post("/auth/login", { username, password });
}

const OPERATION_MAP: Record<string, number> = {
  Add: 0,
  Subtract: 1,
  Multiply: 2,
  Divide: 3,
};

export async function createCalculation(left: number, right: number, operation: string) {
  const payload = {
    left,
    right,
    operand: OPERATION_MAP[operation],
  };
  return await apiClient.post("/calculations", payload);
}

export async function fetchCalculations(signal?: AbortSignal) {
  return await apiClient.get("/calculations", { signal });
}

export async function updateCalculation(id: string, left: number, right: number, operation: string) {
  const payload = {
    left,
    right,
    operand: OPERATION_MAP[operation],
  };
  return await apiClient.put(`/calculations/${id}`, payload);
}

export async function deactivateCalculation(id: string) {
  return await apiClient.patch(`/calculations/${id}/deactivate`);
}

// Fetch the full calculation history (all active calculations, paginated)
export async function fetchHistory(searchTerm?: string, signal?: AbortSignal) {
  // If a search term is provided, use the search endpoint filtered by operation type
  if (searchTerm) {
    return await apiClient.get("/calculations/search", {
      params: { operation: searchTerm },
      signal,
    });
  }
  return await apiClient.get("/calculations", { signal });
}
