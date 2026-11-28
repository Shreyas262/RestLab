import { API_CATEGORIES, type PublicApi } from "./public-apis";

// Case and accents are ignored, so "pokemon" finds "PokéAPI".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function searchableText(api: PublicApi): string {
  const category =
    API_CATEGORIES.find((item) => item.id === api.category)?.name ?? "";
  return normalize(
    [api.name, api.description, category, api.baseUrl].join(" "),
  );
}

/** Keeps the APIs whose name, description, category, or base URL contain every word of the query. */
export function searchPublicApis(
  apis: readonly PublicApi[],
  query: string,
): readonly PublicApi[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return apis;
  return apis.filter((api) => {
    const text = searchableText(api);
    return words.every((word) => text.includes(word));
  });
}
