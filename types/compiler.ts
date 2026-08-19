import type {SupportedLanguage} from './problem';
export type SubmissionStatus='queued'|'processing'|'accepted'|'wrong_answer'|'compile_error'|'runtime_error'|'time_limit'|'memory_limit'|'internal_error';
export interface RunCodeRequest {revisionId:string;practiceProblemId:string;language:SupportedLanguage;sourceCode:string}
export interface TestResult {index:number;passed:boolean;input?:string;expected?:string;actual?:string;runtimeMs?:number}
export interface SubmissionResponse {submissionId:string;status:SubmissionStatus;testsPassed:number;testsTotal:number;runtimeMs?:number;memoryKb?:number;compilerOutput?:string;failureSummary?:string;visibleResults?:TestResult[];score?:number}
