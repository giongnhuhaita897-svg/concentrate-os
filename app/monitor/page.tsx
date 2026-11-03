import type { Metadata } from "next";
import { MonitorPage } from "@/components/exercise/monitor-page";

export const metadata: Metadata = {
  title: "Thực hiện và giám sát · Focus OS",
};

export default function Page() {
  return <MonitorPage />;
}
