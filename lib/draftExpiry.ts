export const DRAFT_TTL_MS=14*86400000;
export function isDraftFresh(savedAt:number,now=Date.now()){return Number.isFinite(savedAt)&&savedAt<=now&&now-savedAt<=DRAFT_TTL_MS}
