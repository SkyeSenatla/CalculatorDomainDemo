// ================================================================
// CalculationsController.cs — All Calculation Endpoints
// ================================================================
// This controller evolved through the demos:
//   Existing:  GET endpoints (filtering, pagination, sorting, search)
//   DEMO 1:   POST (create) — already existed, now broadcasts via SignalR
//   DEMO 3:   PUT (full replacement)
//   DEMO 4:   PATCH (soft delete / deactivate)
//   DEMO 6:   SignalR broadcast after POST, PUT, and PATCH mutations
// ================================================================

using API.DTOs;
using CalculatorDomain.Logic;
using Microsoft.AspNetCore.Mvc;
using CalculatorDomainDemo;
using CalculatorDomainDemo.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
// DEMO 6 (Step 6D): SignalR using statements
using API.Hubs;
using Microsoft.AspNetCore.SignalR;


namespace API.controllers
{
    [ApiController]
    [Route("api/calculations")]
    [Authorize]
    public class CalculationsController : ControllerBase
    {
        private readonly CalculatorService _calculator;
        private readonly CalculatorDbContext _context;
        // DEMO 6 (Step 6D): IHubContext for broadcasting to all connected clients
        private readonly IHubContext<CalculationHub> _hubContext;

        // DEMO 6 (Step 6D): Updated constructor to accept IHubContext
        public CalculationsController(
            CalculatorService calculator,
            CalculatorDbContext context,
            IHubContext<CalculationHub> hubContext)
        {
            _calculator = calculator;
            _context = context;
            _hubContext = hubContext;
        }

        // --- Existing GET Endpoints (from previous weeks) ---

        // Basic Filtering Endpoint
        [HttpGet("by-operation")]
        public async Task<IActionResult> GetByOperation([FromQuery] OperationType operation)
        {
            var results = await _context.Calculations
                .Where(c => c.IsActive && c.Operation == operation)
                .Include(c => c.User)
                .ToListAsync();

            return Ok(results);
        }

        // Searching (Range Filtering)
        [HttpGet("by-result-range")]
        public async Task<IActionResult> GetByResultRange(
            [FromQuery] double min,
            [FromQuery] double max)
        {
            var results = await _context.Calculations
                .Where(c => c.IsActive && c.Result >= min && c.Result <= max)
                .Include(c => c.User)
                .ToListAsync();

            return Ok(results);
        }

        // Projection
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var results = await _context.Calculations
                .Where(c => c.IsActive)
                .Include(c => c.User)
                .Select(c => new CalculationSummaryDto
                {
                    Id = c.Id,
                    Left = c.Left,
                    Right = c.Right,
                    Operation = c.Operation.ToString(),
                    Result = c.Result,
                    Username = c.User.UserName
                })
                .ToListAsync();

            return Ok(results);
        }

        // Pagination + Sorting
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null)
        {
            var query = _context.Calculations
                .Where(c => c.IsActive)
                .Include(c => c.User)
                .AsQueryable();

            // Sorting
            if (sortBy == "result")
            {
                query = query.OrderBy(c => c.Result);
            }
            else
            {
                query = query.OrderByDescending(c => c.CreatedAt);
            }

            var totalCount = await query.CountAsync();

            var results = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CalculationSummaryDto
                {
                    Id = c.Id,
                    Left = c.Left,
                    Right = c.Right,
                    Operation = c.Operation.ToString(),
                    Result = c.Result,
                    Username = c.User.UserName
                })
                .ToListAsync();

            return Ok(new
            {
                totalCount,
                page,
                pageSize,
                data = results
            });
        }

        // End-to-End Search (filter + pagination + sort)
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] OperationType? operation,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Calculations
                .Where(c => c.IsActive)
                .AsQueryable();

            if (operation.HasValue)
                query = query.Where(c => c.Operation == operation.Value);

            var total = await query.CountAsync();

            var data = await query
                .AsNoTracking()
                .Include(c => c.User)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CalculationSummaryDto
                {
                    Id = c.Id,
                    Left = c.Left,
                    Right = c.Right,
                    Operation = c.Operation.ToString(),
                    Result = c.Result,
                    Username = c.User.UserName
                })
                .ToListAsync();

            return Ok(new { total, data });
        }

        // ================================================================
        // DEMO 1 + DEMO 6: POST /api/calculations — Create a new calculation
        // ================================================================
        [HttpPost]
        public async Task<IActionResult> Calculate([FromBody] CreateCalculationDto dto)
        {
            // Get userId from JWT claims
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token");

            var request = new CalculationRequest(
                dto.left,
                dto.right,
                dto.operand
            );

            var calculation = await _calculator.CalculateAsync(request, userId);

            var response = new CalculationResultDto
            {
                Result = calculation.Result,
                Operation = calculation.Operation.ToString()
            };

            // ================================================================
            // DEMO 6 (Step 6D): SIGNALR BROADCAST
            // Tell ALL connected clients: "A new calculation was created!"
            // ================================================================
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

        // ================================================================
        // DEMO 3 (Step 3B): PUT /api/calculations/{id} — Full replacement
        // ================================================================
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

        // ================================================================
        // DEMO 4 (Step 4A): PATCH /api/calculations/{id}/deactivate — Soft delete
        // ================================================================
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

            // ================================================================
            // DEMO 6 (Step 6D): SIGNALR BROADCAST
            // Tell ALL connected clients: "A calculation was deactivated!"
            // ================================================================
            await _hubContext.Clients.All.SendAsync("CalculationDeactivated", new { id = calculation.Id });

            return Ok(new { message = "Calculation deactivated", id = calculation.Id });
        }
    }
}
