import type { Metadata } from "next";
import { PublicApiDirectory } from "@/features/guide/components/public-api-directory";

export const metadata: Metadata = {
  title: "Public APIs · RestLab",
  description: "Free public APIs you can try in RestLab, with sample requests.",
};

export default function ApisPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-8">
      <PublicApiDirectory />
    </main>
  );
}
