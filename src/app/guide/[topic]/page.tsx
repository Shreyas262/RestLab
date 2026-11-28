import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/features/guide/components/guide-article";
import { findGuideTopic, GUIDE_TOPICS } from "@/features/guide/guide-topics";

interface GuideTopicPageProps {
  params: Promise<{ topic: string }>;
}

export function generateStaticParams() {
  return GUIDE_TOPICS.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: GuideTopicPageProps): Promise<Metadata> {
  const topic = findGuideTopic((await params).topic);
  if (!topic) return {};
  return {
    title: `${topic.title} · Guide · RestLab`,
    description: topic.summary,
  };
}

export default async function GuideTopicPage({ params }: GuideTopicPageProps) {
  const topic = findGuideTopic((await params).topic);
  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-8">
      <GuideArticle topic={topic} />
    </main>
  );
}
