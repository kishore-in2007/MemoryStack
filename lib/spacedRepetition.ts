import { REVISION_INTERVALS } from '../constants/topics';
import type { Revision } from '../types';

export function addDays(date: string, days: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); }
export function generateRevisionSchedule(problemId: string, userId: string, solvedDate: string): Revision[] {
  return REVISION_INTERVALS.map((days, i) => ({ id:`${problemId}-r${i+1}`, problem_id:problemId, user_id:userId, revision_number:i+1, due_date:addDays(solvedDate,days), status:'pending' }));
}
export function withOverdue(revisions: Revision[]) { const today=new Date().toISOString().slice(0,10); return revisions.map(r => r.status==='pending' && r.due_date<today ? {...r,status:'overdue' as const}:r); }
export function calculateRevisionScore(v:{correct:boolean;timeTaken:number;attempts:number;timeComplexity:string;spaceComplexity:string}) { if(!v.correct)return Math.max(10,40-(v.attempts-1)*10); let score=100-(Math.max(0,v.attempts-1)*10); if(v.timeTaken>45)score-=15; else if(v.timeTaken>30)score-=8; if(/n\s*(\^?2|²)/i.test(v.timeComplexity)||/n\s*(\^?2|²)/i.test(v.spaceComplexity))score-=10; return Math.max(10,Math.min(100,score)); }
export function performanceLabel(score:number){ return score>=80?'Excellent':score>=60?'Good':score>=40?'Needs reinforcement':'Relearn concept'; }
