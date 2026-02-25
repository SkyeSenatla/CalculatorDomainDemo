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