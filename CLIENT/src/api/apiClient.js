import axios from 'axios';

//Create a singleton Axios instance : one source of truth for all API calls within this application
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000, // reject any request that take longer than 5 seconds
  headers:{
    'Content-Type': 'application/json'

  }, //withcredentials: true  // You are going to use cookies for auth, so you need this to include cookies in cross-origin requests
});
 //request inteeceptor to log outgoing requests, useful for debugging and monitoring
 //runs before everyoutgoing request, 
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
// --- RESPONSE INTERCEPTOR --- 
// Runs AFTER every response comes back 
apiClient.interceptors.response.use( 
(response) => { 
// Axios wraps the actual payload in response.data 
// By returning response.data here, our hooks don't have to write .data every time 
return response.data; 
}, 
(error) => { 
console.error("<<< Global API Error:", error.message); 
return Promise.reject(error); 
} 
); 
export default apiClient; 

