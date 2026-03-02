import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModuleCardProps {
  name: string;
  taskCount?: number;
}

export function ModuleCard({ name, taskCount }: ModuleCardProps) {
  return (
    <Link href={`/modules/${encodeURIComponent(name)}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {taskCount !== undefined ? `${taskCount} tasks` : "View tasks"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
