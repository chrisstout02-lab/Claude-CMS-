import type { Metadata } from "next";
import CfbDashboard from "@/components/cfb/CfbDashboard";

export const metadata: Metadata = {
  title: "College Football Outlook",
  description: "Weekly college football matchups, rankings, and lines, with the games most worth a closer look.",
};

export default function CfbPage() {
  return <CfbDashboard />;
}
