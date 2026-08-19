import {invokeEdge} from '../lib/edgeFunctions';import type {RunCodeRequest,SubmissionResponse} from '../types/compiler';
export const runSampleTests=(input:RunCodeRequest)=>invokeEdge<SubmissionResponse>('run-code',input);
export const submitSolution=(input:RunCodeRequest)=>invokeEdge<SubmissionResponse>('submit-solution',input);
