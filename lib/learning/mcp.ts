import {CONTRACT} from './authoring-contract';
import {db,identity,isAuthor,readJson,requireAuthor} from './access';
import {AppError,exportCourse,getDocument,history,importCourse,listDocuments,publishDocument,recordReview,restore,saveDocument,seedPilot} from './store';
import {validateCourse,validateLesson} from './validate';
import type {Course,Lesson,Review} from './types';
const id={type:'string',description:'Stable content ID from the workspace; never invent an ID when updating.'};
const revision={type:'integer',minimum:0,description:'Current revision from get_course/get_lesson. Use 0 only for a new document.'};
function tool(name:string,description:string,properties:Record<string,unknown>,required:string[]=[],write=false){return{name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:!write,destructiveHint:false,openWorldHint:false}};}
export const MCP_TOOLS=[
 tool('studio_overview','Start here. Read the workspace, publication state, educational authoring workflow and links. No paid AI service is invoked.',{}),
 tool('get_authoring_contract','Read the educational authoring skill and exact Open Actuary v1 fields before creating content. Explains interaction design, reviews, draft/live separation and limitations.',{}),
 tool('list_courses','List available courses. The verified author sees drafts; other visitors see only published courses.',{}),
 tool('get_course','Read a course outline, syllabus edition, scope atoms and its revision.',{id},['id']),
 tool('save_course','Create or update an original course outline as a DRAFT. Supply all course fields from the authoring contract. No publishing occurs. expectedRevision prevents overwrites.',{course:{type:'object',description:'Full Course object; get_authoring_contract supplies required fields.'},expectedRevision:revision},['course','expectedRevision'],true),
 tool('get_lesson','Read full lesson blocks and current revision. Author sees the draft; other readers get only the published snapshot.',{id},['id']),
 tool('save_lesson','Save an original lesson DRAFT with complete teaching, practice, coverage and interaction rationale. Validate errors are returned for repair. This does not change the published lesson.',{lesson:{type:'object',description:'Full Lesson object from get_authoring_contract.'},expectedRevision:revision},['lesson','expectedRevision'],true),
 tool('validate_lesson','Check objective mapping, earlier teaching references, block fields, accessible fallback and question structure. Cannot certify mathematics or pedagogy. Use id OR a proposed lesson object.',{id,lesson:{type:'object'}},[]),
 tool('preview_lesson','Get a draft preview URL and inspectable learning map. Open the URL in a browser and exercise interactions; structured output alone is not visual verification.',{id},['id']),
 tool('record_review','Record actual review evidence for the exact revision. Required: reviewer, level pilot/expert-reviewed, checks for technical/pedagogy/interaction/accessibility/originality, unresolved: []. Do not invent reviews or pass unresolved concerns.',{id,review:{type:'object',description:'Full review object as specified in get_authoring_contract.'}},['id','review'],true),
 tool('publish_lesson','Explicitly publish the current reviewed lesson snapshot after actual checks and requested publication. Parent course outline must already be published. Never substitute this for draft save.',{id,expectedRevision:revision},['id','expectedRevision'],true),
 tool('publish_course','Explicitly publish a reviewed course outline. Does not publish its draft lessons. All outline lesson IDs must exist in this course.',{id,expectedRevision:revision},['id','expectedRevision'],true),
 tool('list_revisions','List immutable draft history for an author-owned document.',{id},['id']),
 tool('restore_revision','Restore an earlier document as a NEW DRAFT revision; live content remains unchanged. Review is invalidated and must be redone.',{id,revision:{type:'integer',minimum:1},expectedRevision:revision},['id','revision','expectedRevision'],true),
 tool('export_course','Export a portable Open Actuary v1 course package. All lessons, widgets and review provenance included; no account secrets or learner notes.',{id},['id']),
 tool('import_course','Import a portable v1 package AS DRAFTS. Existing IDs are not overwritten. Imported review claims do not confer approval.',{package:{type:'object'}},['package'],true),
 tool('initialize_pilot','Install the original bounded CS1 pilot as drafts if absent. Does not publish or overwrite existing content.',{},[],true),
];
type Arguments={id?:string;expectedRevision?:number;course?:Course;lesson?:Lesson;review?:Review;revision?:number;package?:unknown};
async function callTool(request:Request,name:string,args:Arguments){const database=db(),author=await isAuthor(request),origin=new URL(request.url).origin;
 const read=async(id:string,kind:'course'|'lesson')=>{const d=await getDocument(database,id);if(d.kind!==kind)throw new AppError(404,'Content kind does not match.');if(author)return d;if(!d.published)throw new AppError(404,'Content is not published.');if(kind==='lesson'){const c=await getDocument(database,d.courseId);if(!c.published||!(c.published as Course).chapters.some(ch=>ch.lessonIds.includes(id)))throw new AppError(404,'Lesson is not published in its course.');}return{...d,draft:d.published,revision:d.publishedRevision,review:d.publishedReview};};
 if(name==='get_authoring_contract')return CONTRACT;
 if(name==='studio_overview')return{title:'Open Actuary',author,identity:identity(request)?.id??null,guide:origin+'/?view=guide',studio:origin+'/?view=studio',instructions:'Get the authoring contract, read a syllabus-bound course, create bounded draft lessons, inspect actual previews, independently check and review, then publish only when requested. No reference books are needed.',courses:(await listDocuments(database,'course')).filter(c=>author||c.published).map(c=>({id:c.id,title:((author?c.draft:c.published)as Course).title,revision:author?c.revision:c.publishedRevision,publishedRevision:c.publishedRevision}))};
 if(name==='list_courses')return(await listDocuments(database,'course')).filter(c=>author||c.published).map(c=>author?c:{id:c.id,course:c.published,revision:c.publishedRevision});
 if(name==='get_course')return read(args.id||'','course');
 if(name==='get_lesson')return read(args.id||'','lesson');
 await requireAuthor(request);
 if(name==='save_course'){if(!args.course)throw new AppError(422,'Supply a full course object.');return saveDocument(database,'course',args.course,args.expectedRevision??-1);}
 if(name==='save_lesson'){if(!args.lesson)throw new AppError(422,'Supply a full lesson object.');return saveDocument(database,'lesson',args.lesson,args.expectedRevision??-1);}
 if(name==='validate_lesson'){const l=args.lesson||(await getDocument(database,args.id||'')).draft as Lesson;const c=await getDocument(database,l.courseId);return{issues:validateLesson(l,c.draft as Course),notice:'Structure and declared links only. Independently verify meaning, mathematics and interaction behavior.'};}
 if(name==='preview_lesson'){const d=await getDocument(database,args.id||'');if(d.kind!=='lesson')throw new AppError(422,'Choose a lesson.');const l=d.draft as Lesson;return{url:`${origin}/?course=${encodeURIComponent(l.courseId)}&lesson=${encodeURIComponent(l.id)}&draft=1`,revision:d.revision,title:l.title,scope:l.scopeNote,blocks:l.blocks.map(b=>({id:b.id,type:b.type,title:b.title,objectives:b.objectives,purpose:b.purpose,prediction:b.prediction,transfer:b.transfer,checks:b.checks})),issues:validateLesson(l,(await getDocument(database,l.courseId)).draft as Course),browserChecklist:['Read the explanation before the widget.','Try every control, boundary and reset.','Check numeric outputs independently.','Use keyboard and a narrow viewport.','Attempt a question before revealing feedback.','Confirm readable fallback and actual objective transfer.']};}
 if(name==='record_review')return recordReview(database,args.id||'',args.review as Review);
 if(name==='publish_lesson'||name==='publish_course'){const d=await getDocument(database,args.id||'');if(d.kind!==(name==='publish_course'?'course':'lesson'))throw new AppError(422,'Use the publish tool for this content kind.');return publishDocument(database,d.id,args.expectedRevision??-1);}
 if(name==='list_revisions')return history(database,args.id||'');
 if(name==='restore_revision')return restore(database,args.id||'',args.revision??-1,args.expectedRevision??-1);
 if(name==='export_course')return exportCourse(database,args.id||'');
 if(name==='import_course')return importCourse(database,args.package);
 if(name==='initialize_pilot')return seedPilot(database);
 throw new AppError(404,'Unknown tool.');
}
const LEGACY_VERSION='2025-11-25',MODERN_VERSION='2026-07-28';
const serverInfo={name:'open-actuary',version:'1.0.1'};
export async function mcp(request:Request){let body:{id?:number|string;method?:string;params?:{name?:string;arguments?:Arguments;protocolVersion?:string;_meta?:Record<string,unknown>}}={};try{
 body=await readJson(request);
 const modern=request.headers.get('mcp-protocol-version')===MODERN_VERSION;
 const result=(value:unknown)=>{
  const tagged=modern&&value&&typeof value==='object'?{...value,_meta:{...((value as {_meta?:unknown})._meta as object), 'io.modelcontextprotocol/serverInfo':serverInfo}}:value;
  return Response.json({jsonrpc:'2.0',id:body.id??null,result:tagged},{headers:{'cache-control':'no-store'}});
 };
 if(modern){
  const declared=body.params?._meta?.['io.modelcontextprotocol/protocolVersion'];
  if(declared!==MODERN_VERSION)throw new AppError(400,'Modern MCP requests must declare protocol version 2026-07-28 in _meta.');
  const headerMethod=request.headers.get('mcp-method');
  if(headerMethod&&headerMethod!==body.method)throw new AppError(400,'Mcp-Method does not match the JSON-RPC method.');
 }
 if(body.method==='notifications/initialized')return new Response(null,{status:204});
 if(body.method==='server/discover')return result({supportedVersions:[MODERN_VERSION,LEGACY_VERSION],capabilities:{tools:{}},ttlMs:300000,cacheScope:'private'});
 if(body.method==='initialize')return result({protocolVersion:body.params?.protocolVersion===LEGACY_VERSION?LEGACY_VERSION:LEGACY_VERSION,serverInfo,capabilities:{tools:{}}});
 if(body.method==='ping')return result({});
 if(body.method==='tools/list')return result(modern?{tools:MCP_TOOLS,ttlMs:300000,cacheScope:'private'}:{tools:MCP_TOOLS});
 if(body.method==='tools/call'){try{const data=await callTool(request,body.params?.name||'',body.params?.arguments||{});return result({content:[{type:'text',text:JSON.stringify(data)}]});}catch(error){const e=error instanceof AppError?error:new AppError(500,'The operation failed. Re-read the saved state before retrying.');return result({isError:true,content:[{type:'text',text:JSON.stringify({error:e.message,status:e.status,details:e.details})}]});}}
 return Response.json({jsonrpc:'2.0',id:body.id??null,error:{code:-32601,message:'Method not found'}},{status:400});
 }catch(error){console.warn('MCP rejected request:',error instanceof Error?error.message:'invalid request');return Response.json({jsonrpc:'2.0',id:body.id??null,error:{code:-32600,message:error instanceof Error?error.message:'Invalid request'}},{status:400});}}
