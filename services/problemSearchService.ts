import { invokeEdge } from '../lib/edgeFunctions';
import { isSupabaseConfigured } from '../lib/supabase';
import { searchLocalCatalog } from '../lib/localCatalogSearch';
import type { Platform, ProblemSearchResponse, AddSolvedProblemInput } from '../types/problem';

export { searchLocalCatalog };

export async function searchProblems(platform: Platform, query: string, signal?: AbortSignal): Promise<ProblemSearchResponse> {
  if (isSupabaseConfigured) {
    try {
      const res = await invokeEdge<ProblemSearchResponse>('search-problems', {
        platform,
        query,
        limit: 10,
        signal: signal?.aborted,
      });
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        return res;
      }
    } catch {
      // Fallback to local catalog if edge function fails or is unreachable
    }
  }

  return searchLocalCatalog(platform, query, 10);
}

export async function addSolvedProblem(input: AddSolvedProblemInput): Promise<{ problemId: string; snapshotId: string }> {
  return invokeEdge<{ problemId: string; snapshotId: string }>('add-solved-problem', input);
}
