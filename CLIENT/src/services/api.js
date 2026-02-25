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
left: left,         
right: right,       
 // double — matches dto.left 
 // double — matches dto.right 
operand: OPERATION_MAP[operation], // int — matches dto.operand (enum) 
}; 
console.log(">>> Payload Contract:", JSON.stringify(payload)); 
return await apiClient.post("/calculations", payload); 
} 
// GET /api/calculations — Fetch paginated calculation list 
export async function fetchCalculations(signal) { 
return await apiClient.get("/calculations", { signal }); 
}