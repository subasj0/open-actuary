import {database,hash,random,session,rate} from './identity';
import {AppError} from '../lib/learning/store';
const scope='courses:write';
export async function bearer(req:Request){const t=req.headers.get('authorization');if(!t?.startsWith('Bearer '))return null;return database().prepare('SELECT u.id,u.name,u.role FROM oauth_tokens t JOIN users u ON u.id=t.user_id WHERE t.hash=? AND t.expires>? AND t.resource=?').bind(await hash(t.slice(7)),Date.now(),new URL(req.url).origin+'/mcp').first<{id:string;name:string;role:string}>();}
export async function oauth(req:Request,body:any){const url=new URL(req.url),origin=url.origin,db=database(),path=url.pathname;
 const json=(data:any,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
 if(path.startsWith('/.well-known/oauth-protected-resource'))return json({resource:origin+'/mcp',authorization_servers:[origin],scopes_supported:[scope],bearer_methods_supported:['header']});
 if(path==='/.well-known/oauth-authorization-server')return json({issuer:origin,authorization_endpoint:origin+'/oauth/authorize',token_endpoint:origin+'/oauth/token',registration_endpoint:origin+'/oauth/register',revocation_endpoint:origin+'/oauth/revoke',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],scopes_supported:[scope],authorization_response_iss_parameter_supported:true});
 if(path==='/oauth/register'){
  await rate(req,'oauth-register',15);const uris=body.redirect_uris;
  if(!Array.isArray(uris)||uris.length<1||uris.length>5||uris.some((s:any)=>{try{const u=new URL(s);return u.protocol!=='https:'||!!u.hash||!!u.username||!!u.password;}catch{return true;}}))throw new AppError(400,'Provide HTTPS redirect URIs.');
  if(body.token_endpoint_auth_method&&body.token_endpoint_auth_method!=='none')throw new AppError(400,'Use public client authentication (none).');
  const id=crypto.randomUUID();await db.prepare('INSERT INTO oauth_clients VALUES(?,?,?)').bind(id,String(body.client_name||'Authoring app').slice(0,100),JSON.stringify(uris)).run();return json({client_id:id,client_name:body.client_name||'Authoring app',redirect_uris:uris,token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']},201);
 }
 if(path==='/oauth/authorize'){
  const p=req.method==='POST'?body:Object.fromEntries(url.searchParams),client=await db.prepare('SELECT * FROM oauth_clients WHERE id=?').bind(p.client_id||'').first<any>();
  if(!client||!JSON.parse(client.redirect_uris).includes(p.redirect_uri))throw new AppError(400,'Invalid OAuth client or redirect URI.');
  if(p.response_type!=='code'||p.code_challenge_method!=='S256'||!/^[-_a-zA-Z0-9]{43}$/.test(p.code_challenge||'')||p.resource!==origin+'/mcp'||(p.scope&&p.scope!==scope))throw new AppError(400,'Use authorization code, PKCE S256, and this server’s MCP resource.');
  if(req.method!=='POST')return Response.redirect(origin+'/oauth/consent?'+url.searchParams.toString(),302);
  const user=await session(req);if(user?.role!=='author')throw new AppError(403,'Sign in to the author account to connect an authoring app.');
  const code=random();await db.prepare('INSERT INTO oauth_codes VALUES(?,?,?,?,?,?,?)').bind(await hash(code),user.id,p.client_id,p.redirect_uri,p.code_challenge,p.resource,Date.now()+120000).run();
  const dest=new URL(p.redirect_uri);dest.searchParams.set('code',code);if(p.state)dest.searchParams.set('state',p.state);dest.searchParams.set('iss',origin);return json({redirect:dest.toString()});
 }
 if(path==='/oauth/token'){
  await rate(req,'oauth-token',60);
  async function issue(userId:string){const token=random(),refresh=random();await db.batch([db.prepare('INSERT INTO oauth_tokens VALUES(?,?,?,?,?)').bind(await hash(token),userId,body.client_id,body.resource,Date.now()+3600000),db.prepare('INSERT INTO oauth_refresh VALUES(?,?,?,?,?)').bind(await hash(refresh),userId,body.client_id,body.resource,Date.now()+2592000000)]);return json({access_token:token,refresh_token:refresh,token_type:'Bearer',expires_in:3600,scope});}
  if(body.grant_type==='refresh_token'){const row=await db.prepare('DELETE FROM oauth_refresh WHERE hash=? AND client_id=? AND resource=? AND expires>? RETURNING user_id').bind(await hash(body.refresh_token||''),body.client_id||'',body.resource||'',Date.now()).first<{user_id:string}>();if(!row)return json({error:'invalid_grant'},400);return issue(row.user_id);}
  if(body.grant_type!=='authorization_code')return json({error:'unsupported_grant_type'},400);
  const verifier=body.code_verifier||'';if(!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier))return json({error:'invalid_grant'},400);
  const challenge=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const c=await db.prepare('DELETE FROM oauth_codes WHERE hash=? AND client_id=? AND redirect_uri=? AND resource=? AND challenge=? AND expires>? RETURNING user_id').bind(await hash(body.code||''),body.client_id||'',body.redirect_uri||'',body.resource||'',challenge,Date.now()).first<{user_id:string}>();if(!c)return json({error:'invalid_grant'},400);
  return issue(c.user_id);
 }
 if(path==='/oauth/revoke'){const digest=await hash(body.token||'');await db.batch(['oauth_tokens','oauth_refresh'].map(t=>db.prepare(`DELETE FROM ${t} WHERE hash=? AND client_id=?`).bind(digest,body.client_id||'')));return json({});}
 throw new AppError(404,'OAuth endpoint not found.');
}
