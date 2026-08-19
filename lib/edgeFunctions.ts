import {supabase} from './supabase';
export async function invokeEdge<T>(name:string,body:object):Promise<T>{const {data,error}=await supabase.functions.invoke(name,{body});if(error)throw new Error(error.message||`Failed to call ${name}`);return data as T}
