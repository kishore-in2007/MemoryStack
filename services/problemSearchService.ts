import {invokeEdge} from '../lib/edgeFunctions';import type {Platform,ProblemSearchResponse,AddSolvedProblemInput} from '../types/problem';
export function searchProblems(platform:Platform,query:string,signal?:AbortSignal){return invokeEdge<ProblemSearchResponse>('search-problems',{platform,query,limit:10,signal:signal?.aborted})}
export function addSolvedProblem(input:AddSolvedProblemInput){return invokeEdge<{problemId:string;snapshotId:string}>('add-solved-problem',input)}
