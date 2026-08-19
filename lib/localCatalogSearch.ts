import { BUNDLED_PROBLEM_CATALOG } from '../constants/catalogData';
import type { Platform, ProblemSearchResponse, ProblemCatalogItem } from '../types/problem';

export function searchLocalCatalog(platform: Platform, query: string, limit = 10): ProblemSearchResponse {
  const cleanQ = query.trim().toLowerCase();
  if (cleanQ.length < 2) {
    return { items: [], query, platform, hasMore: false };
  }

  const platformMatches = BUNDLED_PROBLEM_CATALOG.filter(
    item => item.platform.toLowerCase() === platform.toLowerCase()
  );

  const exactPrefix: ProblemCatalogItem[] = [];
  const titleContains: ProblemCatalogItem[] = [];
  const slugContains: ProblemCatalogItem[] = [];
  const topicContains: ProblemCatalogItem[] = [];

  for (const item of platformMatches) {
    const titleLower = item.title.toLowerCase();
    const slugLower = item.slug.toLowerCase();
    const topicsLower = (item.topics || []).map(t => t.toLowerCase());

    if (titleLower.startsWith(cleanQ)) {
      exactPrefix.push(item);
    } else if (titleLower.includes(cleanQ)) {
      titleContains.push(item);
    } else if (slugLower.includes(cleanQ)) {
      slugContains.push(item);
    } else if (topicsLower.some(t => t.includes(cleanQ))) {
      topicContains.push(item);
    }
  }

  const combined = [...exactPrefix, ...titleContains, ...slugContains, ...topicContains];
  const uniqueItems: ProblemCatalogItem[] = [];
  const seenIds = new Set<string>();

  for (const item of combined) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
      if (uniqueItems.length >= limit) break;
    }
  }

  return {
    items: uniqueItems,
    query,
    platform,
    hasMore: combined.length > limit,
  };
}
