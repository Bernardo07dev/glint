import type { Metadata } from "next";
import { PreviewScheduleClient } from "./preview-schedule-client";

export const metadata: Metadata = {
  title: "Preview — Schedule Picker | Glint",
};

export default function PreviewSchedulePage() {
  return <PreviewScheduleClient />;
}
