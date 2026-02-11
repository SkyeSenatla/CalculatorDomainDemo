
namespace CalculatorDomainDemo.Domain
{
    public class Calculation
    {
        public int Id { get; set; }
        public double Left { get; set; }
        public double Right { get; set; }
        public OperationType Operation { get; set; }
        public double Result { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Calculation(
            int id,
            double left,
            double right,
            OperationType operation,
            double result, DateTime createdAt)
        {
            Id = id;
            Left = left;
            Right = right;
            Operation = operation;
            Result = result;
            CreatedAt = createdAt;
        }

        public Calculation (){}

    }
}