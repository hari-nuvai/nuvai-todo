import { Badge } from "@/components/ui/badge";

const phaseConfig: Record<number, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  0: { label: "P0 Critical", variant: "destructive" },
  1: { label: "P1 High", variant: "default" },
  2: { label: "P2 Medium", variant: "secondary" },
  3: { label: "P3 Low", variant: "outline" },
};

export function PhaseBadge({ phase }: { phase: number }) {
  const config = phaseConfig[phase] ?? phaseConfig[3];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
