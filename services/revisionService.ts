import { invokeEdge } from '../lib/edgeFunctions';
import { isSupabaseConfigured } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { PracticeProblem, PreviousSolutionSnapshot, RevisionContext } from '../types/revision';
import type { SupportedLanguage } from '../types/problem';

function getDemoPreviousSolution(name: string, topic: string, pattern: string): PreviousSolutionSnapshot {
  if (name.toLowerCase().includes('two sum')) {
    return {
      id: 'snap-two-sum',
      language: 'python' as const,
      sourceCode: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []`,
      explanation: 'One-pass hash map storing number to index for O(1) complement lookup.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      score: 100,
      attempts: 1,
      createdAt: new Date().toISOString(),
    };
  }

  if (name.toLowerCase().includes('course schedule')) {
    return {
      id: 'snap-course-sched',
      language: 'python' as const,
      sourceCode: `class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        adj = [[] for _ in range(numCourses)]\n        indegree = [0] * numCourses\n        for dest, src in prerequisites:\n            adj[src].append(dest)\n            indegree[dest] += 1\n        q = [i for i in range(numCourses) if indegree[i] == 0]\n        visited = 0\n        while q:\n            curr = q.pop(0)\n            visited += 1\n            for nxt in adj[curr]:\n                indegree[nxt] -= 1\n                if indegree[nxt] == 0:\n                    q.append(nxt)\n        return visited == numCourses`,
      explanation: 'Kahn’s algorithm using indegree array and BFS queue for topological sort cycle detection.',
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V + E)',
      score: 100,
      attempts: 1,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: `snap-${Date.now()}`,
    language: 'python' as const,
    sourceCode: `# Previous solution for ${name}\n# Algorithmic pattern: ${pattern || topic}\nclass Solution:\n    def solve(self, *args, **kwargs):\n        # Efficient ${topic} approach\n        pass`,
    explanation: `Solved using ${topic} with ${pattern} approach.`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    score: 95,
    attempts: 1,
    createdAt: new Date().toISOString(),
  };
}

export function buildLocalRevisionContext(revisionId: string): RevisionContext {
  const state = useStore.getState();
  const rev = state.revisions.find(r => r.id === revisionId) || state.revisions[0] || {
    id: revisionId,
    problem_id: 'p1',
    user_id: 'demo-user',
    revision_number: 1,
    due_date: new Date().toISOString().slice(0, 10),
    status: 'pending' as const,
  };

  const problem = state.problems.find(p => p.id === rev.problem_id) || state.problems[0] || {
    id: 'p1',
    user_id: 'demo-user',
    name: 'Two Sum',
    platform: 'LeetCode',
    difficulty: 'Easy' as const,
    topic: 'Arrays',
    subtopic: 'Hashing',
    pattern: 'Complement Lookup',
    url: 'https://leetcode.com/problems/two-sum/',
    solved_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  };

  let prevSolution: PreviousSolutionSnapshot | null = null;

  if (problem.source_code && problem.source_code.trim()) {
    prevSolution = {
      id: `snap-${problem.id}`,
      language: ((problem.language as SupportedLanguage) || 'python'),
      sourceCode: problem.source_code,
      explanation: problem.explanation || `Original solution recorded for ${problem.name}.`,
      timeComplexity: problem.time_complexity || 'O(n)',
      spaceComplexity: problem.space_complexity || 'O(1)',
      score: 100,
      attempts: 1,
      createdAt: problem.created_at || new Date().toISOString(),
    };
  } else if (problem.id === 'p1' || problem.id === 'p2') {
    prevSolution = getDemoPreviousSolution(problem.name, problem.topic, problem.pattern);
  } else {
    prevSolution = null;
  }

  return {
    revision: {
      id: rev.id,
      revisionNumber: rev.revision_number,
      dueDate: rev.due_date,
      status: rev.status === 'completed' ? 'completed' : 'in_progress',
      verificationStatus: rev.status === 'completed' ? 'passed' : 'reviewed',
      reviewedAt: new Date().toISOString(),
      score: rev.score ?? null,
    },
    originalProblem: {
      id: problem.id,
      name: problem.name,
      platform: problem.platform,
      difficulty: problem.difficulty,
      topic: problem.topic,
      subtopic: problem.subtopic,
      pattern: problem.pattern,
      url: problem.url ?? null,
      userNotes: problem.explanation || 'Original solution saved during study.',
    },
    previousSolution: prevSolution,
    practiceProblemId: `practice-${rev.id}`,
  };
}

export function buildLocalPracticeProblem(revisionId: string): PracticeProblem {
  const state = useStore.getState();
  const rev = state.revisions.find(r => r.id === revisionId) || state.revisions[0];
  const problem = state.problems.find(p => p.id === rev?.problem_id) || state.problems[0] || {
    name: 'Two Sum',
    topic: 'Arrays',
    subtopic: 'Hashing',
    pattern: 'Complement Lookup',
    difficulty: 'Easy' as const,
  };

  const isTwoSum = problem.name.toLowerCase().includes('two sum') || problem.topic.toLowerCase().includes('array');
  const isGraph = problem.name.toLowerCase().includes('course') || problem.topic.toLowerCase().includes('graph');

  if (isTwoSum) {
    return {
      id: `practice-${revisionId}`,
      revisionId,
      title: 'Target Pair Offset',
      statement: 'Given an array of integers nums and an integer target, find two distinct indices i and j such that nums[i] + nums[j] == target. Return their indices in ascending order.',
      difficulty: 'Easy',
      topic: problem.topic || 'Arrays',
      subtopic: problem.subtopic || 'Hashing',
      pattern: problem.pattern || 'Complement Lookup',
      inputFormat: 'nums = [2, 7, 11, 15], target = 9',
      outputFormat: '[0, 1]',
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Exactly one valid answer exists',
      ],
      examples: [
        { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9' },
        { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: 'nums[1] + nums[2] == 6' },
      ],
      starterCode: {
        python: 'class Solution:\n    def findTargetPair(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        pass',
        cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> findTargetPair(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};',
        java: 'import java.util.*;\n\nclass Solution {\n    public int[] findTargetPair(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}',
      },
      allowedLanguages: ['python', 'cpp', 'java'],
    };
  }

  if (isGraph) {
    return {
      id: `practice-${revisionId}`,
      revisionId,
      title: 'Prerequisite Course Order Verification',
      statement: 'There are numCourses labeled 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [a, b] indicates that course b must be completed before course a. Return true if you can finish all courses.',
      difficulty: 'Medium',
      topic: 'Graphs',
      subtopic: 'Topological Sort',
      pattern: 'Kahn’s Algorithm',
      inputFormat: 'numCourses = 2, prerequisites = [[1, 0]]',
      outputFormat: 'true',
      constraints: [
        '1 <= numCourses <= 2000',
        '0 <= prerequisites.length <= 5000',
        'prerequisites[i].length == 2',
        'All prerequisite pairs are unique',
      ],
      examples: [
        { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'To take course 1 you should have finished course 0.' },
        { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'A cycle exists.' },
      ],
      starterCode: {
        python: 'class Solution:\n    def canFinishCourses(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        # Write your code here\n        pass',
        cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canFinishCourses(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write your code here\n        return false;\n    }\n};',
        java: 'import java.util.*;\n\nclass Solution {\n    public boolean canFinishCourses(int numCourses, int[][] prerequisites) {\n        // Write your code here\n        return false;\n    }\n}',
      },
      allowedLanguages: ['python', 'cpp', 'java'],
    };
  }

  return {
    id: `practice-${revisionId}`,
    revisionId,
    title: `Reinforcement: ${problem.name} Pattern`,
    statement: `Apply your understanding of ${problem.topic} (${problem.pattern}) to solve this structured practice problem with optimal time and space complexity.`,
    difficulty: (problem.difficulty === 'Easy' || problem.difficulty === 'Hard' ? problem.difficulty : 'Medium'),
    topic: problem.topic,
    subtopic: problem.subtopic,
    pattern: problem.pattern,
    constraints: ['Input size: 1 <= n <= 10^5', 'Time limit: 2.0 seconds', 'Memory limit: 256 MB'],
    examples: [
      { input: 'Sample input representation', output: 'Expected output representation', explanation: 'Demonstrates base case.' },
    ],
    starterCode: {
      python: 'class Solution:\n    def solve(self, nums: list) -> any:\n        # Write your code here\n        pass',
      cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool solve(vector<int>& nums) {\n        // Write your code here\n        return true;\n    }\n};',
      java: 'import java.util.*;\n\nclass Solution {\n    public boolean solve(int[] nums) {\n        // Write your code here\n        return true;\n    }\n}',
    },
    allowedLanguages: ['python', 'cpp', 'java'],
  };
}

export async function getRevisionContext(revisionId: string): Promise<RevisionContext> {
  if (isSupabaseConfigured) {
    try {
      const result = await invokeEdge<RevisionContext>('get-revision-context', { revisionId });
      if (result && result.revision) {
        return result;
      }
    } catch {
      // Fall back to local revision context
    }
  }

  return buildLocalRevisionContext(revisionId);
}

export async function markRevisionReviewed(revisionId: string): Promise<{ reviewedAt: string }> {
  if (isSupabaseConfigured) {
    try {
      const result = await invokeEdge<{ reviewedAt: string }>('mark-revision-reviewed', { revisionId });
      if (result && result.reviewedAt) {
        return result;
      }
    } catch {
      // Fall back to local update
    }
  }

  return { reviewedAt: new Date().toISOString() };
}

export async function getOrGeneratePracticeProblem(revisionId: string): Promise<PracticeProblem> {
  if (isSupabaseConfigured) {
    try {
      const result = await invokeEdge<PracticeProblem>('generate-practice-problem', { revisionId });
      if (result && result.title) {
        return result;
      }
    } catch {
      // Fall back to local practice problem generator
    }
  }

  return buildLocalPracticeProblem(revisionId);
}
