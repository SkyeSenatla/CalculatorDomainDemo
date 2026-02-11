using API.DTOs;
using CalculatorDomain.Logic;
using Microsoft.AspNetCore.Mvc;
using CalculatorDomainDemo;
using CalculatorDomainDemo.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;


namespace API.controllers
{
    [ApiController]
    [Route("api/calculations")]
    [Authorize]
    public class CalculationsController : ControllerBase
    {
        private readonly CalculatorService _calculator;
        private readonly CalculatorDbContext _context;

        public CalculationsController(CalculatorService calculator, CalculatorDbContext context)
        {
            _calculator = calculator;
            _context = context;
        }

        // DEMO 2 — Basic Filtering Endpoint
        [HttpGet("by-operation")]
        public async Task<IActionResult> GetByOperation([FromQuery] OperationType operation)
        {
            var results = await _context.Calculations
                .Where(c => c.Operation == operation)
                .ToListAsync();

            return Ok(results);
        }

        // DEMO 3 — Searching (Range Filtering)
        [HttpGet("by-result-range")]
        public async Task<IActionResult> GetByResultRange(
            [FromQuery] double min,
            [FromQuery] double max)
        {
            var results = await _context.Calculations
                .Where(c => c.Result >= min && c.Result <= max)
                .ToListAsync();

            return Ok(results);
        }

        // DEMO 4 — Projection
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var results = await _context.Calculations
                .Select(c => new CalculationSummaryDto
                {
                    Id = c.Id,
                    Operation = c.Operation,
                    Result = c.Result
                })
                .ToListAsync();

            return Ok(results);
        }

        // DEMO 5 — Pagination
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null)
        {
            var query = _context.Calculations.AsQueryable();

            // DEMO 6 — Sorting
            if (sortBy == "result")
            {
                query = query.OrderBy(c => c.Result);
            }
            else
            {
                query = query.OrderByDescending(c => c.Id);
            }

            var totalCount = await query.CountAsync();

            var results = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                totalCount,
                page,
                pageSize,
                data = results
            });
        }

        // DEMO 10 — End-to-End Example
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] OperationType? operation,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Calculations.AsQueryable();

            if (operation.HasValue)
                query = query.Where(c => c.Operation == operation.Value);

            var total = await query.CountAsync();

            var data = await query
                .AsNoTracking()
                .OrderByDescending(c => c.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CalculationSummaryDto
                {
                    Id = c.Id,
                    Operation = c.Operation,
                    Result = c.Result
                })
                .ToListAsync();

            return Ok(new { total, data });
        }

        [HttpPost] //POST /api/calculations
        public async Task<IActionResult> Calculate([FromBody] CreateCalculationDto dto)
        {
            var request = new CalculationRequest(
                dto.left,
                dto.right,
                dto.operand
            );
            var calculation = await _calculator.CalculateAsync(request);

            var response = new CalculationResultDto
            {
                Result = calculation.Result,
                Operation = calculation.Operation.ToString()
            };

            return Ok(response);
        }
    }
}
