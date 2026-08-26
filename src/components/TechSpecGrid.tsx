interface TechSpec {
  icon: string;
  label: string;
  value: string;
}

interface TechSpecGridProps {
  specs: TechSpec[];
}

const TechSpecGrid = ({ specs }: TechSpecGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {specs.map((spec) => (
        <div key={spec.label} className="flex flex-col items-center text-center gap-2 bg-surface-container-low rounded-lg p-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">{spec.icon}</span>
          </div>
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{spec.label}</p>
          <p className="text-on-surface text-sm font-bold">{spec.value}</p>
        </div>
      ))}
    </div>
  );
};

export default TechSpecGrid;
