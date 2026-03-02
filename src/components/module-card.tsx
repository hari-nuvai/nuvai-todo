import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "@/components/stage-badge";

interface ModuleCardProps {
  name: string;
  status?: string;
  owner?: string;
}

export function ModuleCard({ name, status, owner }: ModuleCardProps) {
  return (
    <Link href={`/modules/${encodeURIComponent(name)}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-1.5">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{name}</span>
            {status && <StageBadge stage={status} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {owner ? (
            <p className="text-sm text-muted-foreground">Owner: {owner}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No owner</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
