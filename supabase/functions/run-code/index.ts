import {handleOptions} from '../_shared/cors.ts';import {requireAuth} from '../_shared/auth.ts';import {errorResponse,json} from '../_shared/errors.ts';import {execute} from '../_shared/executeSubmission.ts';
Deno.serve(async req=>{const pre=handleOptions(req);if(pre)return pre;try{return json(await execute(await requireAuth(req),await req.json(),'run'))}catch(e){return errorResponse(e)}});
