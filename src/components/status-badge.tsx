import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30",
  SUSPENDED: "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30",
  CANCELLED: "bg-[#aaa]/10 text-[#aaa] border-[#aaa]/30",
  BLOCKED: "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/30",
};

export function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors}`}>
      {status}
    </Badge>
  );
}
