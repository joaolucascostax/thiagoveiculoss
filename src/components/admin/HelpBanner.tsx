import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, HelpCircle } from "lucide-react";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function HelpBanner({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-primary/20 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground space-y-2 leading-relaxed">
          {children}
        </div>
      )}
    </Card>
  );
}
