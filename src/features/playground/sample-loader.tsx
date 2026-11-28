"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent } from "react";
import type { RequestConfig } from "@/domain/request/schema";
import { SAMPLE_PARAM, findPublicApi } from "@/features/guide/public-apis";

interface SampleLoaderProps {
  onLoad: (request: RequestConfig) => void;
}

/**
 * Loads the directory sample named in the URL into the editor without sending it (ADR-029).
 * Render it inside a Suspense boundary: reading search params opts only this component out of prerendering.
 */
export function SampleLoader({ onLoad }: SampleLoaderProps) {
  const sampleId = useSearchParams().get(SAMPLE_PARAM);
  const pathname = usePathname();
  const router = useRouter();

  const loadSample = useEffectEvent((id: string) => {
    const api = findPublicApi(id);
    if (api) onLoad(api.sample);
    // Without the parameter, a reload keeps the user's edits instead of loading the sample again.
    router.replace(pathname, { scroll: false });
  });

  useEffect(() => {
    if (sampleId !== null) loadSample(sampleId);
  }, [sampleId]);

  return null;
}
