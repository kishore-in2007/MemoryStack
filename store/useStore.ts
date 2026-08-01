import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Difficulty, MemoryStrength, Problem, Recommendation, Revision } from '../types';
import { generateRevisionSchedule, withOverdue } from '../lib/spacedRepetition';
import { updateMemoryStrength } from '../lib/memoryStrength';

const today=new Date().toISOString().slice(0,10);
const user={id:'demo-user',email:'student@memorystack.app',name:'Akash Sharma'};
const seedProblems:Problem[]=[
 {id:'p1',user_id:user.id,name:'Two Sum',platform:'LeetCode',difficulty:'Easy',topic:'Arrays',subtopic:'Hashing',pattern:'Complement Lookup',url:'https://leetcode.com/problems/two-sum/',solved_date:today,created_at:new Date().toISOString()},
 {id:'p2',user_id:user.id,name:'Course Schedule',platform:'LeetCode',difficulty:'Medium',topic:'Graphs',subtopic:'Topological Sort',pattern:'Kahn’s Algorithm',url:'https://leetcode.com/problems/course-schedule/',solved_date:today,created_at:new Date().toISOString()},
];
const initialRevisions:Revision[]=[...generateRevisionSchedule('p1',user.id,today),...generateRevisionSchedule('p2',user.id,today)].map((r,i)=>i===10?{...r,due_date:new Date(Date.now()-86400000).toISOString().slice(0,10),status:'overdue'}:r) as Revision[];
type User=typeof user|null;
interface State { hydrated:boolean; user:User; problems:Problem[]; revisions:Revision[]; strengths:MemoryStrength[]; recommendations:Recommendation[]; notificationHour:number; darkMode:boolean; setUser:(u:User)=>void; hydrate:()=>Promise<void>; addProblem:(input:{name:string;platform:string;difficulty:Difficulty;url?:string;solvedDate:string;topic:string;subtopic:string;pattern:string})=>Problem; completeRevision:(id:string,data:{score:number;timeTaken:number;attempts:number;timeComplexity:string;spaceComplexity:string;recommendation?:Recommendation})=>void; addRecommendation:(r:Recommendation)=>void; setNotificationHour:(h:number)=>void; setDarkMode:(v:boolean)=>void; resetDemo:()=>void; }
const CACHE='memory-stack-full-v1';
const snapshot=(s:State)=>({user:s.user,problems:s.problems,revisions:s.revisions,strengths:s.strengths,recommendations:s.recommendations,notificationHour:s.notificationHour,darkMode:s.darkMode});
let saveTimer:ReturnType<typeof setTimeout>|undefined;
const persist=(get:()=>State)=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>AsyncStorage.setItem(CACHE,JSON.stringify(snapshot(get()))),50)};
export const useStore=create<State>((set,get)=>({
 hydrated:false,user:null,problems:seedProblems,revisions:initialRevisions,strengths:[],recommendations:[],notificationHour:9,darkMode:false,
 setUser:u=>{set({user:u});persist(get)},
 hydrate:async()=>{try{const raw=await AsyncStorage.getItem(CACHE);if(raw)set({...JSON.parse(raw),hydrated:true,revisions:withOverdue(JSON.parse(raw).revisions||[])});else set({hydrated:true,user});}catch{set({hydrated:true,user});}},
 addProblem:input=>{const u=get().user||user;const p:Problem={id:`p-${Date.now()}`,user_id:u.id,name:input.name,platform:input.platform,difficulty:input.difficulty,topic:input.topic,subtopic:input.subtopic,pattern:input.pattern,url:input.url,solved_date:input.solvedDate,created_at:new Date().toISOString()};set(s=>({problems:[p,...s.problems],revisions:[...generateRevisionSchedule(p.id,u.id,input.solvedDate),...s.revisions]}));persist(get);return p;},
 completeRevision:(id,data)=>{const rev=get().revisions.find(r=>r.id===id);if(!rev)return;const problem=get().problems.find(p=>p.id===rev.problem_id);if(!problem)return;const next=get().revisions.find(r=>r.problem_id===rev.problem_id&&r.revision_number===rev.revision_number+1);const current=get().strengths.find(x=>x.topic===problem.topic);const strength=updateMemoryStrength(current,rev.user_id,problem.topic,data.score,next?.due_date);set(s=>({revisions:s.revisions.map(r=>r.id===id?{...r,status:'completed',score:data.score,time_taken:data.timeTaken,attempts:data.attempts,time_complexity:data.timeComplexity,space_complexity:data.spaceComplexity,completed_date:today,recommended_problem_name:data.recommendation?.name,recommended_problem_url:data.recommendation?.url}:r),strengths:[strength,...s.strengths.filter(x=>x.topic!==problem.topic)],recommendations:s.recommendations.map(x=>x.id===data.recommendation?.id?{...x,status:'completed'}:x)}));persist(get)},
 addRecommendation:r=>{if(!get().recommendations.some(x=>x.name===r.name)){set(s=>({recommendations:[r,...s.recommendations]}));persist(get)}},
 setNotificationHour:h=>{set({notificationHour:h});persist(get)},setDarkMode:v=>{set({darkMode:v});persist(get)},
 resetDemo:()=>{set({user,problems:seedProblems,revisions:initialRevisions,strengths:[],recommendations:[],notificationHour:9,darkMode:false});persist(get)}
}));
