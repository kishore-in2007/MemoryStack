import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Difficulty, MemoryStrength, Problem, Recommendation, Revision } from '../types';
import type { SupportedLanguage } from '../types/problem';
import { generateRevisionSchedule, withOverdue } from '../lib/spacedRepetition';
import { updateMemoryStrength } from '../lib/memoryStrength';

const today = new Date().toISOString().slice(0, 10);
const user = { id: 'demo-user', email: 'student@memorystack.app', name: 'Akash Sharma' };

const seedProblems: Problem[] = [
  {
    id: 'p1',
    user_id: user.id,
    name: 'Two Sum',
    platform: 'LeetCode',
    difficulty: 'Easy',
    topic: 'Arrays',
    subtopic: 'Hashing',
    pattern: 'Complement Lookup',
    url: 'https://leetcode.com/problems/two-sum/',
    solved_date: today,
    created_at: new Date().toISOString(),
    source_code: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []`,
    language: 'python',
    explanation: 'One-pass hash map for O(1) complement lookup.',
    time_complexity: 'O(n)',
    space_complexity: 'O(n)',
  },
  {
    id: 'p2',
    user_id: user.id,
    name: 'Course Schedule',
    platform: 'LeetCode',
    difficulty: 'Medium',
    topic: 'Graphs',
    subtopic: 'Topological Sort',
    pattern: 'Kahn’s Algorithm',
    url: 'https://leetcode.com/problems/course-schedule/',
    solved_date: today,
    created_at: new Date().toISOString(),
    source_code: `class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        adj = [[] for _ in range(numCourses)]\n        indegree = [0] * numCourses\n        for dest, src in prerequisites:\n            adj[src].append(dest)\n            indegree[dest] += 1\n        q = [i for i in range(numCourses) if indegree[i] == 0]\n        visited = 0\n        while q:\n            curr = q.pop(0)\n            visited += 1\n            for nxt in adj[curr]:\n                indegree[nxt] -= 1\n                if indegree[nxt] == 0:\n                    q.append(nxt)\n        return visited == numCourses`,
    language: 'python',
    explanation: 'Topological sort cycle detection with BFS.',
    time_complexity: 'O(V + E)',
    space_complexity: 'O(V + E)',
  },
];

const initialRevisions: Revision[] = [
  ...generateRevisionSchedule('p1', user.id, today),
  ...generateRevisionSchedule('p2', user.id, today),
].map((r, i) =>
  i === 10
    ? { ...r, due_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), status: 'overdue' as const }
    : r
) as Revision[];

type User = typeof user | null;

export interface AddProblemInput {
  name: string;
  platform: string;
  difficulty: Difficulty;
  url?: string;
  solvedDate: string;
  topic?: string;
  subtopic?: string;
  pattern?: string;
  language?: SupportedLanguage;
  sourceCode?: string;
  explanation?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface State {
  hydrated: boolean;
  user: User;
  problems: Problem[];
  revisions: Revision[];
  strengths: MemoryStrength[];
  recommendations: Recommendation[];
  notificationHour: number;
  darkMode: boolean;
  setUser: (u: User) => void;
  hydrate: () => Promise<void>;
  addProblem: (input: AddProblemInput) => Problem;
  completeRevision: (
    id: string,
    data: {
      score: number;
      timeTaken: number;
      attempts: number;
      timeComplexity: string;
      spaceComplexity: string;
      recommendation?: Recommendation;
    }
  ) => void;
  addRecommendation: (r: Recommendation) => void;
  setNotificationHour: (h: number) => void;
  setDarkMode: (v: boolean) => void;
  resetDemo: () => void;
}

const CACHE = 'memory-stack-full-v1';

const snapshot = (s: State) => ({
  user: s.user,
  problems: s.problems,
  revisions: s.revisions,
  strengths: s.strengths,
  recommendations: s.recommendations,
  notificationHour: s.notificationHour,
  darkMode: s.darkMode,
});

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const persist = (get: () => State) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => AsyncStorage.setItem(CACHE, JSON.stringify(snapshot(get()))), 50);
};

export const useStore = create<State>((set, get) => ({
  hydrated: false,
  user: null,
  problems: seedProblems,
  revisions: initialRevisions,
  strengths: [],
  recommendations: [],
  notificationHour: 9,
  darkMode: false,

  setUser: u => {
    set({ user: u });
    persist(get);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE);
      if (raw) {
        set({
          ...JSON.parse(raw),
          hydrated: true,
          revisions: withOverdue(JSON.parse(raw).revisions || []),
        });
      } else {
        set({ hydrated: true, user });
      }
    } catch {
      set({ hydrated: true, user });
    }
  },

  addProblem: input => {
    const u = get().user || user;
    const p: Problem = {
      id: `p-${Date.now()}`,
      user_id: u.id,
      name: input.name,
      platform: input.platform,
      difficulty: input.difficulty,
      topic: input.topic?.trim() || 'Algorithms',
      subtopic: input.subtopic?.trim() || 'General',
      pattern: input.pattern?.trim() || 'Standard Pattern',
      url: input.url?.trim() || undefined,
      solved_date: input.solvedDate,
      created_at: new Date().toISOString(),
      source_code: input.sourceCode?.trim() || undefined,
      language: input.language,
      explanation: input.explanation?.trim() || undefined,
      time_complexity: input.timeComplexity?.trim() || undefined,
      space_complexity: input.spaceComplexity?.trim() || undefined,
    };

    set(s => ({
      problems: [p, ...s.problems],
      revisions: [...generateRevisionSchedule(p.id, u.id, input.solvedDate), ...s.revisions],
    }));
    persist(get);
    return p;
  },

  completeRevision: (id, data) => {
    const rev = get().revisions.find(r => r.id === id);
    if (!rev) return;
    const problem = get().problems.find(p => p.id === rev.problem_id);
    if (!problem) return;
    const next = get().revisions.find(
      r => r.problem_id === rev.problem_id && r.revision_number === rev.revision_number + 1
    );
    const current = get().strengths.find(x => x.topic === problem.topic);
    const strength = updateMemoryStrength(current, rev.user_id, problem.topic, data.score, next?.due_date);

    set(s => ({
      revisions: s.revisions.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'completed' as const,
              score: data.score,
              time_taken: data.timeTaken,
              attempts: data.attempts,
              time_complexity: data.timeComplexity,
              space_complexity: data.spaceComplexity,
              completed_date: today,
              recommended_problem_name: data.recommendation?.name,
              recommended_problem_url: data.recommendation?.url,
            }
          : r
      ),
      strengths: [strength, ...s.strengths.filter(x => x.topic !== problem.topic)],
      recommendations: s.recommendations.map(x =>
        x.id === data.recommendation?.id ? { ...x, status: 'completed' as const } : x
      ),
    }));
    persist(get);
  },

  addRecommendation: r => {
    if (!get().recommendations.some(x => x.name === r.name)) {
      set(s => ({ recommendations: [r, ...s.recommendations] }));
      persist(get);
    }
  },

  setNotificationHour: h => {
    set({ notificationHour: h });
    persist(get);
  },

  setDarkMode: v => {
    set({ darkMode: v });
    persist(get);
  },

  resetDemo: () => {
    set({
      user,
      problems: seedProblems,
      revisions: initialRevisions,
      strengths: [],
      recommendations: [],
      notificationHour: 9,
      darkMode: false,
    });
    persist(get);
  },
}));
