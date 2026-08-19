import {invokeEdge} from '../lib/edgeFunctions';import type {PracticeProblem,RevisionContext} from '../types/revision';
export const getRevisionContext=(revisionId:string)=>invokeEdge<RevisionContext>('get-revision-context',{revisionId});
export const markRevisionReviewed=(revisionId:string)=>invokeEdge<{reviewedAt:string}>('mark-revision-reviewed',{revisionId});
export const getOrGeneratePracticeProblem=(revisionId:string)=>invokeEdge<PracticeProblem>('generate-practice-problem',{revisionId});
