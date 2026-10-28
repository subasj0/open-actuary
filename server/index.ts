import {env} from 'cloudflare:workers';
import {GET as api} from './api';
import {mcp} from '../lib/learning/mcp';
import {setIdentity,readJson,errorResponse} from '../lib/learning/access';
import {auth,session,database} from './identity';
import {oauth,bearer} from './oauth';
import {AppError} from '../lib/learning/store';
export default {
 async fetch(req:Request){try{
  const u=new URL(req.url),p=u.pathname;
  if(!['GET','POST','OPTIONS'].includes(req.method))throw new AppError(405,'Method not allowed.');
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Authorization, Content-Type, MCP-Protocol-Version, Accept'}});
  if(req.method==='POST'&&req.headers.get('origin')&&req.headers.get('origin')!==u.origin)throw new AppError(403,'Use a same-origin request.');
  let res:Response;
  if(p.startsWith('/api/auth/')){if(req.method!=='POST'&&p!=='/api/auth/me')throw new AppError(405,'Use POST.');res=await auth(req,p.slice(10),req.method==='POST'?await readJson(req):{});}
  else if(p.startsWith('/.well-known/')||p.startsWith('/oauth/')&&p!=='/oauth/consent'){
   if(['/oauth/token','/oauth/register','/oauth/revoke'].includes(p)&&req.method!=='POST')throw new AppError(405,'Use POST.');
   const body=req.method==='POST'?(req.headers.get('content-type')?.includes('application/json')?await readJson(req):Object.fromEntries(new URLSearchParams(await req.text()))):{};res=await oauth(req,body);
  }else if(p==='/mcp'){
   const user=await bearer(req);if(!user){res=Response.json({error:'Connect your author account with OAuth.'},{status:401,headers:{'WWW-Authenticate':`Bearer resource_metadata="${u.origin}/.well-known/oauth-protected-resource/mcp", scope="courses:write"`}});}else{setIdentity(req,user);res=req.method==='POST'?await mcp(req):new Response(null,{status:405});}
  }else if(p.startsWith('/api/')){setIdentity(req,await session(req));res=await api(req);}
  else return env.ASSETS.fetch(req);
  const headers=new Headers(res.headers);headers.set('cache-control','no-store');headers.set('x-content-type-options','nosniff');headers.set('referrer-policy','same-origin');headers.set('access-control-allow-origin','*');return new Response(res.body,{status:res.status,headers});
 }catch(e){return errorResponse(e);}},
 async scheduled(){const db=database();await db.batch(['sessions','challenges','oauth_codes','oauth_tokens','oauth_refresh','rate_limits'].map(t=>db.prepare(`DELETE FROM ${t} WHERE expires<?`).bind(Date.now())));}
};
