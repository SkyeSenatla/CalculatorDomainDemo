interface Calculation {
  id: string;
  left: number;
  right: number;
  operation: string;
  result: number;
}

interface CalculationCardProps {
  calculation: Calculation;
  onDeactivate?: (id: string) => void;
}

export default function CalculationCard({ calculation, onDeactivate }: CalculationCardProps) {
  return (
    <div className="p-4 bg-white border-l-4 border-indigo-500 rounded-r-lg shadow-sm flex items-center justify-between">
      <p className="text-gray-700 font-medium">
        {calculation.left} {calculation.operation} {calculation.right} ={" "}
        <span className="text-indigo-600 font-bold">{calculation.result}</span>
      </p>
      {onDeactivate && (
        <button
          onClick={() => onDeactivate(calculation.id)}
          className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}
