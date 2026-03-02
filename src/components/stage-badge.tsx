import { Badge } from "@/components/ui/badge";

const stageColors: Record<string, string> = {
  "Not Started": "bg-gray-500/30 text-gray-200 border-gray-500/40",
  "In Progress": "bg-blue-500/30 text-blue-200 border-blue-500/40",
  "Testing": "bg-purple-500/30 text-purple-200 border-purple-500/40",
  "Completed": "bg-green-500/30 text-green-200 border-green-500/40",
  "Blocked": "bg-red-500/30 text-red-200 border-red-500/40",
  "On Hold": "bg-yellow-500/30 text-yellow-200 border-yellow-500/40",
};

export function StageBadge({ stage }: { stage: string }) {
  const colors = stageColors[stage] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors}`}>
      {stage}
    </Badge>
  );
}
