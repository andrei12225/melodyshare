import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import StatsDashboard from "@/components/StatsDashboard";

export const metadata: Metadata = { title: "Stats" };

export default async function StatsRoute() {
  await requireUser();
  return <StatsDashboard />;
}
