// ================================================================
// CalculationSummaryDto — Projection DTO for list views
// ================================================================
// Updated to include Left, Right, and Operation as a string
// so the React CalculationCard can display the full expression:
//   {left} {operation} {right} = {result}
// ================================================================

using CalculatorDomainDemo;

namespace API.DTOs
{
    public class CalculationSummaryDto
    {
        public int Id { get; set; }
        public double Left { get; set; }
        public double Right { get; set; }
        public string Operation { get; set; }
        public double Result { get; set; }
        public string Username { get; set; }
    }
}
