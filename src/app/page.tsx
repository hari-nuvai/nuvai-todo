import { DashboardStats } from "@/components/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <DashboardStats />
    </div>
  );
}
