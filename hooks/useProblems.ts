import {useStore} from '../store/useStore';export function useProblems(){return useStore(s=>s.problems)}
