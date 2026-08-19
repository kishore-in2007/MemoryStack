import {corsHeaders} from './cors.ts';
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
export function errorResponse(error:unknown){const status=error instanceof HttpError?error.status:500;const message=error instanceof HttpError?error.message:'The service is temporarily unavailable.';return json({error:message},status)}
