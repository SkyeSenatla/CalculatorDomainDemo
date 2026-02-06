using CalculatorDomain.Logic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/history")]
[Authorize(Roles ="Admin")]
public class HistoryController : ControllerBase
{
    private readonly CalculatorService _calculator;

    public HistoryController(CalculatorService calculator)
    {
        _calculator = calculator;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _calculator.GetAllAsync();

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
