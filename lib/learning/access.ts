import { env } from 'cloudflare:workers';
import {AppError} from './store';
const identities=new WeakMap<Request,{id:string;email:string;role:string}>();
export function setIdentity(request:Request,user:{id:string;name:string;role:string}|null){if(user)identities.set(request,{id:user.id,email:user.name,role:user.role});}
export function identity(request:Request){return identities.get(request)??null;}
export async function isAuthor(request:Request){return identity(request)?.role==='author';}
export async function requireAuthor(request:Request){if(!await isAuthor(request))throw new AppError(403,'Only the workspace author can change or preview drafts.');}
export async function readJson(request:Request){
 const max=2000000;
 if(!request.headers.get('content-type')?.includes('application/json'))throw new AppError(415,'Send application/json.');
 const reader=request.body?.getReader();if(!reader)throw new AppError(400,'A JSON body is required.');let length=0;let tooLarge=Number(request.headers.get('content-length'))>max;const chunks:Uint8Array[]=[];
 // Drain rejected uploads without retaining their bytes, so HTTP clients receive
 // the structured error instead of a reset while they are still sending data.
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){tooLarge=true;chunks.length=0;}if(!tooLarge)chunks.push(value);}
 if(tooLarge)throw new AppError(413,'Content package is too large (2MB maximum).');
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new AppError(400,'The body is not valid JSON.');}
}
export function db(){if(!env.DB)throw new AppError(503,'The content database is not connected.');return env.DB;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});}
export function errorResponse(error:unknown){if(error instanceof AppError)return json({error:error.message,details:error.details},error.status);console.error(JSON.stringify({event:'request_failure',message:error instanceof Error?error.message:'Unknown failure'}));return json({error:'The request could not be completed. Your previous saved content is unchanged.'},500);}
