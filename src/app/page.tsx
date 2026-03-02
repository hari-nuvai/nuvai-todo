import { DashboardStats } from "@/components/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <DashboardStats />
    </div>
  );
}
