using CalculatorDomainDemo;
using CalculatorDomainDemo.Domain;
using CalculatorDomainDemo.Persistence;

namespace CalculatorDomain.Logic
{
    public class CalculatorService
    {
        private readonly ICalculationStore _store;

        public CalculatorService(ICalculationStore store)
        {
            _store = store;
        }

        public async Task<Calculation> CalculateAsync(CalculationRequest request)
        {
            if (request.operand == OperationType.Divide && request.right == 0)
                throw new InvalidOperationException("Division by zero is not allowed.");

            double result = request.operand switch
            {
                OperationType.Add => request.Left + request.right,
                OperationType.Subtract => request.Left - request.right,
                OperationType.Multiply => request.Left * request.right,
                OperationType.Divide => request.Left / request.right,
                _ => throw new InvalidOperationException("Unsupported operation.")
            };

            var calculation = new Calculation(
                0, // id will be set by the store
                request.Left,
                request.right,
                request.operand,
                result,
                DateTime.UtcNow);

            await _store.SaveAsync(calculation);

            return calculation;
        }

        public Task<IReadOnlyList<Calculation>> GetAllAsync()
        {
            return _store.LoadAllAsync();
        }
    }
}