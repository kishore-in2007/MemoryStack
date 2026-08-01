import type { Difficulty, Recommendation } from '../types';
import { getAIRecommendation } from './groq';
export async function getRecommendation(topic:string,subtopic:string,difficulty:Difficulty,solved:string[],existing:Recommendation[]){const queued=existing.find(x=>x.topic===topic&&x.status==='pending'&&!solved.includes(x.name));if(queued)return queued;const x=await getAIRecommendation(topic,subtopic,difficulty,solved);return{id:`rec-${Date.now()}`,name:x.name,platform:x.platform,difficulty:x.difficulty,pattern:x.pattern,url:x.url,topic,subtopic,status:'pending'} as Recommendation;}
