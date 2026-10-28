import {env} from 'cloudflare:workers';
import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {AppError} from '../lib/learning/store';
export const database=()=>env.DB;
export const random=()=>crypto.randomUUID()+crypto.randomUUID();
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');}
export function cookie(req:Request,name:string){return req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
export const cookies=(name:string,value:string,age=2592000)=>`${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
export async function session(req:Request){const token=cookie(req,'__Host-oa-session');if(!token)return null;return database().prepare('SELECT u.id,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').bind(await hash(token),Date.now()).first<{id:string;name:string;role:string}>();}
export async function rate(req:Request,bucket:string,max=30){const key=bucket+':'+(req.headers.get('cf-connecting-ip')||'local')+':'+Math.floor(Date.now()/600000);const r=await database().prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,Date.now()+1200000).first<{count:number}>();if((r?.count||0)>max)throw new AppError(429,'Too many attempts. Please try again in ten minutes.');}
export async function newSession(user:string){const token=random();await database().prepare('INSERT INTO sessions VALUES(?,?,?)').bind(await hash(token),user,Date.now()+2592000000).run();return cookies('__Host-oa-session',token);}
const b64=(s:Uint8Array)=>btoa(String.fromCharCode(...s));
const unb64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function auth(req:Request,path:string,body:any){
 const db=database(),u=new URL(req.url),rpID=u.hostname,expectedOrigin=u.origin;
 if(path==='logout'){await db.prepare('DELETE FROM sessions WHERE hash=?').bind(await hash(cookie(req,'__Host-oa-session'))).run();return Response.json({ok:true},{headers:{'set-cookie':cookies('__Host-oa-session','',0)}});}
 if(path==='me')return Response.json({user:await session(req)});
 await rate(req,'auth');
 if(path==='registration-options'){
  const current=await session(req);const name=current?.name||String(body.name||'').trim();if(name.length<2||name.length>80)throw new AppError(422,'Choose an account name between 2 and 80 characters.');
  let author=false;if(body.invite){author=!!await db.prepare('SELECT hash FROM author_invites WHERE hash=?').bind(await hash(String(body.invite))).first();if(!author)throw new AppError(403,'This author invitation is invalid or already used.');}
  const userId=current?.id||crypto.randomUUID();const existing=current?(await db.prepare('SELECT id FROM passkeys WHERE user_id=?').bind(current.id).all<{id:string}>()).results:[];
  const options=await generateRegistrationOptions({rpName:'Open Actuary',rpID,userName:name,userID:new TextEncoder().encode(userId),attestationType:'none',excludeCredentials:existing.map(x=>({id:x.id})),authenticatorSelection:{residentKey:'required',userVerification:'required'}});
  const id=random();await db.prepare('INSERT INTO challenges VALUES(?,?,?)').bind(id,JSON.stringify({type:'register',challenge:options.challenge,userId,name,author,invite:body.invite?await hash(String(body.invite)):null,add:!!current}),Date.now()+300000).run();
  return Response.json(options,{headers:{'set-cookie':cookies('__Host-oa-challenge',id,300)}});
 }
 if(path==='authentication-options'){const options=await generateAuthenticationOptions({rpID,userVerification:'required'});const id=random();await db.prepare('INSERT INTO challenges VALUES(?,?,?)').bind(id,JSON.stringify({type:'login',challenge:options.challenge}),Date.now()+300000).run();return Response.json(options,{headers:{'set-cookie':cookies('__Host-oa-challenge',id,300)}});}
 if(path==='registration-verify'||path==='authentication-verify'){
  const id=cookie(req,'__Host-oa-challenge');const row=await db.prepare('DELETE FROM challenges WHERE id=? AND expires>? RETURNING data').bind(id,Date.now()).first<{data:string}>();if(!row)throw new AppError(400,'This sign-in attempt expired. Start again.');const c=JSON.parse(row.data);
  let userId:string;let recovery:string|undefined;
  if(path==='registration-verify'){
   if(c.type!=='register')throw new AppError(400,'Invalid challenge.');
   if(c.add&&(await session(req))?.id!==c.userId)throw new AppError(403,'Sign in again to add a passkey.');
   const result=await verifyRegistrationResponse({response:body,expectedChallenge:c.challenge,expectedOrigin,expectedRPID:rpID,requireUserVerification:true});if(!result.verified||!result.registrationInfo)throw new AppError(400,'Passkey could not be verified.');
   const k=result.registrationInfo.credential;userId=c.userId;
   const statements=[];
   if(!c.add){recovery=random();statements.push(db.prepare('INSERT INTO users VALUES(?,?,?,?)').bind(userId,c.name,'reader',await hash(recovery)));}
   statements.push(db.prepare('INSERT INTO passkeys VALUES(?,?,?,?,?)').bind(k.id,userId,b64(k.publicKey),k.counter,JSON.stringify(k.transports||[])));
   if(c.invite){statements.push(db.prepare("UPDATE users SET role='author' WHERE id=? AND EXISTS(SELECT 1 FROM author_invites WHERE hash=?)").bind(userId,c.invite),db.prepare('DELETE FROM author_invites WHERE hash=?').bind(c.invite));}
   await db.batch(statements);
  }else{
   if(c.type!=='login')throw new AppError(400,'Invalid challenge.');const k=await db.prepare('SELECT * FROM passkeys WHERE id=?').bind(body.id||'').first<any>();if(!k)throw new AppError(401,'This passkey is not registered.');
   const result=await verifyAuthenticationResponse({response:body,expectedChallenge:c.challenge,expectedOrigin,expectedRPID:rpID,credential:{id:k.id,publicKey:unb64(k.public_key),counter:k.counter,transports:JSON.parse(k.transports)},requireUserVerification:true});if(!result.verified)throw new AppError(401,'Passkey could not be verified.');
   await db.prepare('UPDATE passkeys SET counter=? WHERE id=?').bind(result.authenticationInfo.newCounter,k.id).run();userId=k.user_id;
  }
  return Response.json({ok:true,recovery},{headers:{'set-cookie':await newSession(userId)}});
 }
 if(path==='recover'){const replacement=random();const user=await db.prepare('UPDATE users SET recovery_hash=? WHERE recovery_hash=? RETURNING id').bind(await hash(replacement),await hash(String(body.code||''))).first<{id:string}>();if(!user)throw new AppError(401,'Recovery code is invalid or already used.');await db.batch([db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM oauth_tokens WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM oauth_refresh WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM passkeys WHERE user_id=?').bind(user.id)]);return Response.json({ok:true,recovery:replacement},{headers:{'set-cookie':await newSession(user.id)}});}
 throw new AppError(404,'Account operation not found.');
}
