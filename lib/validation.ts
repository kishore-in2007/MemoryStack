export function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
export function requiredString(value:unknown,name:string,max=50000){if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error(`Invalid ${name}`);return value.trim()}
