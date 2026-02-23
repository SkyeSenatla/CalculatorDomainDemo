# Week 8, Day 1: The Full-Stack Handshake
## Complete Implementation Guide for Calculator App

> **Objective**: Connect your React frontend to the .NET backend with PostgreSQL, eliminating mock data and establishing a real full-stack connection.

---

## 📋 Prerequisites Checklist

- [ ] PostgreSQL installed on your machine
- [ ] Your .NET API project (in `API` folder)
- [ ] Your React project (in `CLIENT` folder)
- [ ] Basic understanding of how to run both projects

---

## 🎯 Part 1: Backend - Migrate to PostgreSQL

### Step 1.1: Install PostgreSQL Package

Open a terminal in the `API` folder and run:

```powershell
cd API
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

**Verification**: Check that `Npgsql.EntityFrameworkCore.PostgreSQL` appears in `API.csproj`.

---

### Step 1.2: Create PostgreSQL Database

1. Open **pgAdmin** or **psql** command line
2. Create a new database:

```sql
CREATE DATABASE calculator_db;
```

3. Note your connection details:
   - **Host**: localhost (usually)
   - **Port**: 5432 (default)
   - **Database**: calculator_db
   - **Username**: postgres (or your username)
   - **Password**: (your password)

---

### Step 1.3: Update Connection String

Open `API/appsettings.json` and replace the connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=calculator_db;Username=postgres;Password=YOUR_PASSWORD_HERE"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong",
    "Issuer": "CalculatorAPI",
    "Audience": "CalculatorClient",
    "ExpiresInMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

**⚠️ IMPORTANT**: Replace `YOUR_PASSWORD_HERE` with your actual PostgreSQL password.

---

### Step 1.4: Update Program.cs for PostgreSQL

Open `API/Program.cs` and find the `AddDbContext` section. Replace it with:

```csharp
// Replace the SQLite configuration with PostgreSQL
builder.Services.AddDbContext<CalculatorDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**Make sure to add the using statement at the top**:

```csharp
using Npgsql.EntityFrameworkCore.PostgreSQL;
```

---

### Step 1.5: Drop Old Migrations and Create New Ones

Since we're switching databases, we need fresh migrations:

```powershell
# Still in API folder
# Remove old migration files
Remove-Item -Path "Migrations\*.cs" -Force

# Create new migration for PostgreSQL
dotnet ef migrations add InitialPostgres

# Apply the migration
dotnet ef database update
```

**Verification**: 
- Check that new migration files appear in `API/Migrations/`
- Open pgAdmin and verify tables exist in `calculator_db`

---

### Step 1.6: Seed Data (Optional but Recommended)

Make sure your database has test data. Run your API once to trigger the `IdentitySeeder`:

```powershell
dotnet run
```

The seeder should create a test user. You can also manually add some calculations via API calls.

---

## 🌐 Part 2: Backend - Configure CORS

### Step 2.1: Add CORS Policy in Program.cs

Open `API/Program.cs` and add CORS configuration **before** `builder.Build()`:

```csharp
// Add CORS policy (add this before var app = builder.Build();)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite's default port
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

---

### Step 2.2: Use CORS Middleware

In the same file, add `app.UseCors()` **after** `app.UseRouting()` and **before** `app.UseAuthentication()`:

```csharp
app.UseRouting();

// Apply CORS policy (add this line)
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();
```

**⚠️ Order Matters!** CORS must come after `UseRouting()` but before `UseAuthentication()`.

---

### Step 2.3: Restart Your API

```powershell
# Stop the API (Ctrl+C if running)
# Start it again
dotnet run
```

**Verification**: You should see output like:
```
Now listening on: http://localhost:5000
```

---

## ⚛️ Part 3: Frontend - Environment Variables

### Step 3.1: Create .env File

In the **CLIENT** folder (not API!), create a file named `.env`:

```
CLIENT/
  .env          ← Create this file
  src/
  package.json
```

Add this content:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**Important Notes**:
- Vite requires the `VITE_` prefix
- No quotes around the value
- No trailing slash on the URL

---

### Step 3.2: Add .env to .gitignore

Make sure `.env` is in `CLIENT/.gitignore`:

```
# Environment variables
.env
.env.local
```

---

### Step 3.3: Create .env.example

Create `CLIENT/.env.example` as a template for other developers:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🔌 Part 4: Frontend - Connect to Real API

### Step 4.1: Create API Service

Create `CLIENT/src/services/api.js`:

```javascript
import axios from 'axios';

// Read the base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login'; // Adjust as needed
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Step 4.2: Create Calculation Service

Create `CLIENT/src/services/calculationService.js`:

```javascript
import apiClient from './api';

export const calculationService = {
  // Get all calculations for the current user
  async getCalculations() {
    const response = await apiClient.get('/calculations');
    return response.data;
  },

  // Create a new calculation
  async createCalculation(calculationData) {
    const response = await apiClient.post('/calculations', calculationData);
    return response.data;
  },

  // Get calculation summary
  async getSummary() {
    const response = await apiClient.get('/calculations/summary');
    return response.data;
  },

  // Get calculation history
  async getHistory() {
    const response = await apiClient.get('/history');
    return response.data;
  },
};
```

---

### Step 4.3: Update useCalculations Hook

Open `CLIENT/src/hooks/useCalculations.js` and replace the mock data logic with real API calls:

```javascript
import { useState, useEffect } from 'react';
import { calculationService } from '../services/calculationService';

export function useCalculations() {
  const [calculations, setCalculations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch calculations on mount
  useEffect(() => {
    fetchCalculations();
  }, []);

  const fetchCalculations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await calculationService.getHistory();
      setCalculations(data);
    } catch (err) {
      console.error('Failed to fetch calculations:', err);
      setError(err.message || 'Failed to load calculations');
    } finally {
      setIsLoading(false);
    }
  };

  const addCalculation = async (newCalc) => {
    try {
      // Send to API
      const result = await calculationService.createCalculation({
        operandA: newCalc.operandA,
        operandB: newCalc.operandB,
        operation: newCalc.operation,
      });

      // Refresh the list
      await fetchCalculations();

      return result;
    } catch (err) {
      console.error('Failed to add calculation:', err);
      setError(err.message || 'Failed to add calculation');
      throw err;
    }
  };

  // Calculate sum of all results
  const totalSum = calculations.reduce((sum, calc) => sum + (calc.result || 0), 0);

  return {
    calculations,
    isLoading,
    error,
    addCalculation,
    totalSum,
    refreshCalculations: fetchCalculations,
  };
}
```

---

### Step 4.4: Update App.jsx to Show Errors

Open `CLIENT/src/App.jsx` and add error handling:

```javascript
function App() {
  const { calculations, isLoading, error, addCalculation, totalSum } = useCalculations();

  useEffect(() => {
    document.title = `Calculations (${calculations.length})`;
  }, [calculations]);

  return (
    <Layout title="Advanced Calculator">
      <p className="stats">
        Total Calculations: {calculations.length} | Sum of Results: {totalSum}
      </p>

      <CalculationForm onAdd={addCalculation} />

      {/* Show error if present */}
      {error && (
        <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
          ⚠️ Error: {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <p className="loading">Fetching history...</p>
      ) : (
        <CalculationList calculations={calculations} />
      )}
    </Layout>
  );
}

export default App;
```

---

## 🚀 Part 5: Testing the Connection

### Step 5.1: Start Both Servers

**Terminal 1 - Backend**:
```powershell
cd API
dotnet run
```

Wait for: `Now listening on: http://localhost:5000`

**Terminal 2 - Frontend**:
```powershell
cd CLIENT
npm run dev
```

Wait for: `Local: http://localhost:5173/`

---

### Step 5.2: Test in Browser

1. Open `http://localhost:5173`
2. Open **Chrome DevTools** (F12)
3. Go to **Network** tab
4. Try to submit a calculation

**What to Look For**:
- You should see XHR/Fetch requests to `localhost:5000/api/...`
- Status should be `200 OK` (or `201 Created`)
- Response should contain real data from PostgreSQL

---

### Step 5.3: Verify the Full Flow

1. **React Form** → Submit a calculation (e.g., 10 + 5)
2. **Network Tab** → See POST request to `/api/calculations`
3. **PostgreSQL** → Open pgAdmin, query `Calculations` table:
   ```sql
   SELECT * FROM "Calculations" ORDER BY "PerformedAt" DESC;
   ```
4. **React UI** → See the new calculation appear in the list

---

## 🚨 Common Errors & Fixes

### Error 1: CORS Policy Error

**Symptom**: Console shows:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/calculations' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix**:
1. Check that CORS is configured in `Program.cs` (see Part 2)
2. Verify the origin URL matches exactly: `http://localhost:5173`
3. Ensure `app.UseCors("AllowReactApp")` is in the right order
4. Restart the API server

---

### Error 2: Network Error / Cannot Connect

**Symptom**: 
```
Error: Network Error
```

**Fix**:
1. Check that the API is actually running on port 5000
2. Verify `.env` file has the correct URL
3. Restart Vite dev server after changing `.env`
4. Try accessing `http://localhost:5000/api/calculations` directly in browser

---

### Error 3: 401 Unauthorized

**Symptom**:
```
Error: Request failed with status code 401
```

**Fix**:
1. Your endpoints require authentication
2. You need to implement login first
3. Check if `AuthController.cs` exists and has Login/Register endpoints
4. Test with a tool like Postman to verify auth works

**Temporary Workaround**: Remove `[Authorize]` attribute from controllers during testing.

---

### Error 4: PostgreSQL Connection Failed

**Symptom**:
```
Npgsql.NpgsqlException: Failed to connect to server
```

**Fix**:
1. Verify PostgreSQL service is running
2. Check connection string in `appsettings.json`:
   - Host, Port, Database name, Username, Password
3. Try connecting via pgAdmin with same credentials
4. Ensure firewall isn't blocking port 5432

---

### Error 5: import.meta.env.VITE_API_BASE_URL is undefined

**Symptom**:
```
Error: Request failed with status code undefined
```

**Fix**:
1. Check `.env` file is in `CLIENT` folder (not root)
2. Variable must start with `VITE_`
3. **Restart Vite dev server** after creating/changing `.env`
4. Verify with: `console.log(import.meta.env.VITE_API_BASE_URL)`

---

## 🎁 Extra Credit: Health Check Component

### Create CLIENT/src/components/HealthCheck.jsx

```javascript
import { useState, useEffect } from 'react';
import apiClient from '../services/api';

function HealthCheck() {
  const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline'

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      // Try a simple endpoint (adjust to match your API)
      await apiClient.get('/calculations');
      setStatus('online');
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('offline');
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      padding: '5px 10px', 
      borderRadius: '5px',
      background: status === 'online' ? '#4caf50' : status === 'offline' ? '#f44336' : '#ff9800',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
    }}>
      {status === 'checking' && '🟡 Checking...'}
      {status === 'online' && '🟢 API Online'}
      {status === 'offline' && '🔴 API Offline'}
    </div>
  );
}

export default HealthCheck;
```

### Add to App.jsx

```javascript
import HealthCheck from './components/HealthCheck';

function App() {
  // ... existing code

  return (
    <Layout title="Advanced Calculator">
      <HealthCheck />  {/* Add this */}
      {/* ... rest of your JSX */}
    </Layout>
  );
}
```

---

## ✅ Final Verification Checklist

- [ ] PostgreSQL database created and accessible
- [ ] .NET API connects to PostgreSQL (check startup logs)
- [ ] CORS configured and no console errors
- [ ] `.env` file exists in CLIENT folder with correct URL
- [ ] API calls visible in Network tab
- [ ] Calculations appear in both React UI and PostgreSQL
- [ ] No console errors in browser
- [ ] Health check shows green light (if implemented)

---

## 📚 Understanding the Flow

```
┌─────────────────┐
│  React Button   │  User clicks "Calculate"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useCalculations │  Custom hook calls service
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Axios Request   │  HTTP POST to http://localhost:5000/api/calculations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CORS Check     │  API validates origin (http://localhost:5173)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │  CalculationsController.Create()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EF Core         │  Translates C# to SQL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  INSERT INTO Calculations...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │  { id: 1, result: 15, ... }
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React UI       │  Updates state, re-renders list
└─────────────────┘
```

---

## 🎓 Key Takeaways

1. **PostgreSQL vs SQLite**: PostgreSQL handles production workloads better
2. **CORS is Essential**: Without it, browsers block your API calls
3. **Environment Variables**: Keep configuration flexible and secure
4. **Network Tab is Your Friend**: Always verify requests are actually being made
5. **Order Matters**: Middleware order in .NET can break your app

---

## 📝 Troubleshooting Checklist

If something isn't working:

1. ✅ Both servers running? (API on 5000, React on 5173)
2. ✅ PostgreSQL service running?
3. ✅ `.env` file in correct location with `VITE_` prefix?
4. ✅ Vite restarted after `.env` changes?
5. ✅ CORS policy includes your React URL?
6. ✅ Connection string password correct?
7. ✅ Migrations applied? (`dotnet ef database update`)
8. ✅ Check browser console for errors
9. ✅ Check API terminal for errors
10. ✅ Try the API directly in browser or Postman

---

## 🎉 Success Criteria

You've successfully completed this assignment when:

✅ You can create a calculation in React and see it in PostgreSQL  
✅ Network tab shows real HTTP requests  
✅ No CORS errors in console  
✅ API and React communicate seamlessly  
✅ (Extra Credit) Health check indicator works  

**Congratulations!** You now have a true full-stack application. 🚀

---

## 📞 Need Help?

Common commands to check:

```powershell
# Check PostgreSQL status
Get-Service postgresql*

# Check what's running on port 5000
netstat -ano | findstr :5000

# Check what's running on port 5173
netstat -ano | findstr :5173

# View API logs
cd API
dotnet run --verbosity detailed
```

Remember: The Network tab and console logs are your best debugging tools!
