import type { Metadata } from "next";
import { GuideIndex } from "@/features/guide/components/guide-index";

export const metadata: Metadata = {
  title: "Guide · RestLab",
  description:
    "How to send requests, read responses, and save templates in RestLab.",
};

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-8">
      <GuideIndex />
    </main>
  );
}
