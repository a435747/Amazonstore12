type StatCardProps = {
  value: string | number;
  label: string;
  className?: string;
};

export default function StatCard({ value, label, className = '' }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg ${className}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}




