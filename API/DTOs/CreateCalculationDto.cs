using System.ComponentModel.DataAnnotations;
using System.Reflection.Emit;
using CalculatorDomainDemo;


public class CreateCalculationDto 
{ 
[Required(ErrorMessage = "The first number (left) is required.")] 
[Range(-1000000, 1000000, ErrorMessage = "Left operand must be between 1,000,000 and 1,000,000.")] 
public double left { get; set; } 
[Required(ErrorMessage = "The second number (right) is required.")] 
[Range(-1000000, 1000000, ErrorMessage = "Right operand must be between 1,000,000 and 1,000,000.")] 
public double right { get; set; } 
[Required(ErrorMessage = "The operation type is required.")] 
[EnumDataType(typeof(OperationType), ErrorMessage = "Invalid operation. Must be 0 (Add), 1 (Subtract), 2 (Multiply), or 3 (Divide).")] 
public OperationType operand { get; set; } 
}