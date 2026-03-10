import CalculationCard from "./CalculationCard";

interface Calculation {
  id: string;
  left: number;
  right: number;
  operation: string;
  result: number;
}

interface CalculationListProps {
  calculations: Calculation[];
  onDeactivate: (id: string) => void;
}

export default function CalculationList({ calculations, onDeactivate }: CalculationListProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-gray-800">Calculation History</h2>
      {calculations.map((calc) => (
        <CalculationCard key={calc.id} calculation={calc} onDeactivate={onDeactivate} />
      ))}
    </div>
  );
}
