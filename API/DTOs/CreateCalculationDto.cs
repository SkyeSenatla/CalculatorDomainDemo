using System.ComponentModel.DataAnnotations;
using System.Reflection.Emit;
using CalculatorDomainDemo;


public class CreateCalculationDto
{
    [Required]
    public double left {get;set;}
    [Required]
    public double right {get; set;}
    [Required]
    public OperationType operand{get; set;}
}