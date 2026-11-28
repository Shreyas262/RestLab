import type { GuideTopicSlug } from "../guide-topics";
import { FirstRequest } from "./first-request";
import { ParametersHeadersBody } from "./parameters-headers-body";
import { ReadingResponses } from "./reading-responses";
import { SavedTemplates } from "./saved-templates";
import { StrategiesAndCors } from "./strategies-and-cors";

export const GUIDE_CONTENT: Readonly<
  Record<GuideTopicSlug, () => React.JSX.Element>
> = {
  "first-request": FirstRequest,
  "parameters-headers-body": ParametersHeadersBody,
  "reading-responses": ReadingResponses,
  "strategies-and-cors": StrategiesAndCors,
  "saved-templates": SavedTemplates,
};
