export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type RevisionStatus = 'pending' | 'completed' | 'overdue';

export interface Problem {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  difficulty: Difficulty;
  topic: string;
  subtopic: string;
  pattern: string;
  url?: string;
  solved_date: string;
  created_at: string;
  source_code?: string;
  language?: string;
  explanation?: string;
  time_complexity?: string;
  space_complexity?: string;
}

export interface Revision {
  id: string;
  problem_id: string;
  user_id: string;
  revision_number: number;
  due_date: string;
  status: RevisionStatus;
  score?: number;
  time_taken?: number;
  time_complexity?: string;
  space_complexity?: string;
  attempts?: number;
  completed_date?: string;
  recommended_problem_name?: string;
  recommended_problem_url?: string;
}

export interface MemoryStrength {
  id: string;
  user_id: string;
  topic: string;
  strength_score: number;
  revision_count: number;
  success_rate: number;
  avg_score: number;
  last_revision_date?: string;
  next_revision_date?: string;
}

export interface Recommendation {
  id: string;
  name: string;
  platform: string;
  difficulty: Difficulty;
  topic: string;
  subtopic: string;
  pattern: string;
  url: string;
  status: 'pending' | 'completed' | 'skipped';
}

export interface Classification {
  topic: string;
  subtopic: string;
  pattern: string;
  difficulty: Difficulty;
}
