using System.Text.Json;
using CalculatorDomainDemo;
using CalculatorDomainDemo.Domain;
using CalculatorDomainDemo.Persistence;

namespace CalculatorDomain.Persistence
{
    public class FileCalculationStore : ICalculationStore
    {
        private readonly string _directoryPath;
        private readonly string _filePath;

        public FileCalculationStore(string directoryPath)
        {
            _directoryPath = directoryPath;
            _filePath = Path.Combine(_directoryPath, "calculations.json");
        }

        public async Task SaveAsync(Calculation calculation)
        {
            if (!Directory.Exists(_directoryPath))
                Directory.CreateDirectory(_directoryPath);

            var calculations = (await LoadAllAsync()).ToList();
            calculations.Add(calculation);

            var json = JsonSerializer.Serialize(calculations);
            await File.WriteAllTextAsync(_filePath, json);
        }

        public async Task<IReadOnlyList<Calculation>> LoadAllAsync()
        {
            if (!File.Exists(_filePath))
                return new List<Calculation>();

            var json = await File.ReadAllTextAsync(_filePath);

            if (string.IsNullOrWhiteSpace(json))
                return new List<Calculation>();

            return JsonSerializer.Deserialize<List<Calculation>>(json)
                   ?? new List<Calculation>();
        }
    }

}