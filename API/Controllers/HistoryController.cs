using CalculatorDomain.Logic;
using CalculatorDomainDemo.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.DTOs;

[ApiController]
[Route("api/history")]
[Authorize(Roles ="Admin")]
public class HistoryController : ControllerBase
{
    private readonly CalculatorDbContext _context; 

    public HistoryController(CalculatorDbContext context)
    {
        _context = context; 
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _context.Calculations.ToListAsync();

        var response = history.Select(c => new CalculationHistoryItemDto
        {
            Left = c.Left,
            Right = c.Right,
            Operation = c.Operation.ToString(),
            Result = c.Result
        });

        return Ok(response);
    }
}
