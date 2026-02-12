using CalculatorDomain.Logic;
using CalculatorDomainDemo.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.DTOs;

[ApiController]
[Route("api/history")]
//[Authorize(Roles ="Admin")]
public class HistoryController : ControllerBase
{
    private readonly CalculatorDbContext _context; 
    private readonly EFCalculationStore calculationStore;
    
    public HistoryController(CalculatorDbContext context, EFCalculationStore eFCalculationStore)
    {
        _context = context;
        calculationStore = eFCalculationStore;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _context.Calculations
            .Where(c => c.IsActive)
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var response = history.Select(c => new CalculationHistoryItemDto
        {
            Left = c.Left,
            Right = c.Right,
            Operation = c.Operation.ToString(),
            Result = c.Result
        });

        return Ok(response);
    }

    [HttpGet("adds")]
    public async Task<IActionResult> GetAdditions()
    {
        var adds = await calculationStore.LoadAllAddsAsync();
        var response = adds.Select(c => new CalculationHistoryItemDto
        {
            Left = c.Left,
            Right = c.Right,
            Operation = c.Operation.ToString(),
            Result = c.Result
        });

        return Ok(response);
    }
    [HttpGet("Number")]
    public async Task<IActionResult> GetCalculationsByNumber([FromQuery] double number)
    {
        var calculations = await _context.Calculations
            .Where(c => c.IsActive && (c.Left == number || c.Right == number))
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var response = calculations.Select(c => new CalculationHistoryItemDto
        {
            Left = c.Left,
            Right = c.Right,
            Operation = c.Operation.ToString(),
            Result = c.Result
        });

        return Ok(response);
    }
}
