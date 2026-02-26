// ================================================================
// DEMO 3 (Step 3A): UPDATE CALCULATION DTO — Full Resource Replacement
// ================================================================

using System.ComponentModel.DataAnnotations;
using CalculatorDomainDemo;

public class UpdateCalculationDto
{
    [Required(ErrorMessage = "The first number (left) is required.")]
    public double left { get; set; }

    [Required(ErrorMessage = "The second number (right) is required.")]
    public double right { get; set; }

    [Required(ErrorMessage = "The operation type is required.")]
    [EnumDataType(typeof(OperationType))]
    public OperationType operand { get; set; }
}
