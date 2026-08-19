import type {SubmissionStatus} from '../types/compiler';
const map:Record<number,SubmissionStatus>={1:'queued',2:'processing',3:'accepted',4:'wrong_answer',5:'time_limit',6:'compile_error',7:'runtime_error',8:'runtime_error',9:'runtime_error',10:'runtime_error',11:'runtime_error',12:'runtime_error',13:'internal_error',14:'internal_error'};
export function mapJudgeStatus(id:number){return map[id]??'internal_error'}
