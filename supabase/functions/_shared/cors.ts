export const corsHeaders={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
export function handleOptions(req:Request){return req.method==='OPTIONS'?new Response('ok',{headers:corsHeaders}):null}
