import { Badge } from "@/components/ui/badge";

const stageColors: Record<string, string> = {
  "Not Started": "bg-[#aaa]/10 text-[#aaa] border-[#aaa]/30",
  "In Progress": "bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/30",
  "Testing": "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/30",
  "Completed": "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30",
  "Blocked": "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/30",
  "On Hold": "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30",
};

export function StageBadge({ stage }: { stage: string }) {
  const colors = stageColors[stage] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors}`}>
      {stage}
    </Badge>
  );
}
