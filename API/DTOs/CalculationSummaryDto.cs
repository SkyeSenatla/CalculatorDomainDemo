using CalculatorDomainDemo;

namespace API.DTOs
{
    public class CalculationSummaryDto
    {
        public int Id { get; set; }
        public OperationType Operation { get; set; }
        public double Result { get; set; }
    }
}
