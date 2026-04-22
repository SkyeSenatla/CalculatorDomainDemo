# CalculatorDomainDemo - Setup Commands

## Prerequisites

- Docker running with a PostgreSQL container named `conference-pg`
- .NET 8 SDK
- Node.js / npm

## 1. Start the PostgreSQL Container

```bash
docker start conference-pg
```

## 2. Create the Database

The API expects a database called `CalculatorDb` on `localhost:5432`. If it doesn't exist yet:

```bash
docker exec -it conference-pg psql -U postgres -c "CREATE DATABASE \"CalculatorDb\";"
```

## 3. Apply EF Core Migrations

From the `API` folder:

```bash
cd API
dotnet ef database update
```

This creates all required tables (Identity tables, Calculation table, etc.).

## 4. Run the API

```bash
cd API
dotnet run
```

API runs at `http://localhost:5152`.

## 5. Run the Next.js Frontend

From the `calculator-next` folder:

```bash
cd calculator-next
npm run dev
```

Frontend runs at `http://localhost:3000`.

> **Note:** Use `npm run dev` — not `next dev` directly, as `next` is not on the system PATH.
