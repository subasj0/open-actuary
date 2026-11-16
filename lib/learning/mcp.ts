import {CONTRACT} from './authoring-contract';
import {db,identity,isAuthor,readJson,requireAuthor} from './access';
import {AppError,exportCourse,getDocument,history,importCourse,listDocuments,publishDocument,recordReview,restore,revisionContent,saveDocument,seedPilot} from './store';
import {validateCourse,validateLesson} from './validate';
import type {Block,Course,Lesson,Review} from './types';
const id={type:'string',description:'Stable content ID from the workspace; never invent an ID when updating.'};
const revision={type:'integer',minimum:0,description:'Current revision from get_course/get_lesson. Use 0 only for a new document.'};
const blockId={type:'string',description:'Stable block ID from get_lesson_outline or get_lesson. Never invent an existing block ID.'};
function tool(name:string,description:string,properties:Record<string,unknown>,required:string[]=[],write=false,destructive=false){return{name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:!write,destructiveHint:destructive,openWorldHint:false}};}
export const MCP_TOOLS=[
 tool('studio_overview','Start here. Read the workspace, publication state, educational authoring workflow and links. No paid AI service is invoked.',{}),
 tool('get_authoring_contract','Read the educational authoring skill and exact Open Actuary v1 fields before creating content. Explains interaction design, reviews, draft/live separation and limitations.',{}),
 tool('get_authoring_template','Get a compact, valid starting shape for a course, lesson, block, question, interaction or review. Replace every placeholder with original content and validate before saving.',{kind:{type:'string',enum:['course','lesson','prose','worked','choice-question','numeric-question','written-question','lab','widget','review'],description:'The authoring element to start from.'}},['kind']),
 tool('list_courses','List available courses. The verified author sees drafts; other visitors see only published courses.',{}),
 tool('get_course_map','Read a compact course map: objectives, chapter order, lesson titles, revisions and publication state. Use before creating or revising a module; use get_course only when the full outline is needed.',{courseId:{type:'string',description:'Optional course ID. Omit to map every visible course.'}},[]),
 tool('get_course','Read a course outline, syllabus edition, scope atoms and its revision.',{id},['id']),
 tool('validate_course','Validate a saved course outline or a proposed course before saving. Reports structural issues without modifying content.',{id,course:{type:'object',description:'Optional proposed full Course object. Supply exactly one of id or course.'}},[]),
 tool('save_course','Create or update an original course outline as a DRAFT. Supply all course fields from the authoring contract. No publishing occurs. expectedRevision prevents overwrites.',{course:{type:'object',description:'Full Course object; get_authoring_contract supplies required fields.'},expectedRevision:revision},['course','expectedRevision'],true),
 tool('get_lesson','Read full lesson blocks and current revision. Author sees the draft; other readers get only the published snapshot.',{id},['id']),
 tool('get_lesson_outline','Read lesson metadata plus an ordered block map with IDs, types, objectives and dependencies. Start here for an existing lesson; fetch one block only when you need its full content.',{id},['id']),
 tool('get_lesson_block','Read one complete block from a lesson. Use this for focused editorial work without loading the whole lesson.',{id,blockId},['id','blockId']),
 tool('save_lesson','Save an original lesson DRAFT with complete teaching, practice, coverage and interaction rationale. Validate errors are returned for repair. This does not change the published lesson.',{lesson:{type:'object',description:'Full Lesson object from get_authoring_contract.'},expectedRevision:revision},['lesson','expectedRevision'],true),
 tool('replace_lesson_block','Replace exactly one draft block while preserving its position. The whole lesson is validated and the revision advances; re-read the outline after saving.',{id,blockId,block:{type:'object',description:'Complete replacement block. Keep its id equal to blockId unless deliberately repairing an ID and its references.'},expectedRevision:revision},['id','blockId','block','expectedRevision'],true),
 tool('insert_lesson_block','Insert one complete draft block after a named block, or append it when afterBlockId is omitted. The whole lesson is validated and the revision advances.',{id,afterBlockId:{...blockId,description:'Insert immediately after this block. Omit to append.'},block:{type:'object',description:'Complete new block with a unique stable id.'},expectedRevision:revision},['id','block','expectedRevision'],true),
 tool('remove_lesson_block','Remove one draft block. It is rejected if questions, coverage or other references would become invalid. The live lesson is unaffected until explicit publication.',{id,blockId,expectedRevision:revision},['id','blockId','expectedRevision'],true,true),
 tool('validate_lesson','Check objective mapping, earlier teaching references, block fields, accessible fallback and question structure. Cannot certify mathematics or pedagogy. Use id OR a proposed lesson object.',{id,lesson:{type:'object'}},[]),
 tool('preview_lesson','Get a draft preview URL and inspectable learning map. Open the URL in a browser and exercise interactions; structured output alone is not visual verification.',{id},['id']),
 tool('record_review','Record actual review evidence for the exact revision. Required: reviewer, level pilot/expert-reviewed, checks for technical/pedagogy/interaction/accessibility/originality, unresolved: []. Do not invent reviews or pass unresolved concerns.',{id,review:{type:'object',description:'Full review object as specified in get_authoring_contract.'}},['id','review'],true),
 tool('publish_lesson','Explicitly publish the current reviewed lesson snapshot after actual checks and requested publication. Parent course outline must already be published. Never substitute this for draft save.',{id,expectedRevision:revision},['id','expectedRevision'],true),
 tool('publish_course','Explicitly publish a reviewed course outline. Does not publish its draft lessons. All outline lesson IDs must exist in this course.',{id,expectedRevision:revision},['id','expectedRevision'],true),
 tool('list_revisions','List immutable draft history for an author-owned document.',{id},['id']),
 tool('get_revision_content','Read the exact immutable content saved at one revision before comparing or restoring it.',{id,revision:{type:'integer',minimum:1}},['id','revision']),
 tool('diff_revisions','Compare two immutable revisions. Returns focused structural and block-level changes so you can reason about an earlier version before restoring it.',{id,fromRevision:{type:'integer',minimum:1},toRevision:{type:'integer',minimum:1}},['id','fromRevision','toRevision']),
 tool('restore_revision','Restore an earlier document as a NEW DRAFT revision; live content remains unchanged. Review is invalidated and must be redone.',{id,revision:{type:'integer',minimum:1},expectedRevision:revision},['id','revision','expectedRevision'],true),
 tool('export_course','Export a portable Open Actuary v1 course package. All lessons, widgets and review provenance included; no account secrets or learner notes.',{id},['id']),
 tool('import_course','Import a portable v1 package AS DRAFTS. Existing IDs are not overwritten. Imported review claims do not confer approval.',{package:{type:'object'}},['package'],true),
 tool('initialize_pilot','Install the original bounded CS1 pilot as drafts if absent. Does not publish or overwrite existing content.',{},[],true),
];
const excerpt=(value:unknown,max=180)=>typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,max):undefined;
function blockOutline(block:Block,index:number){return{position:index+1,id:block.id,type:block.type,title:block.title,objectives:block.objectives??[],dependsOn:block.taughtIn??[],summary:excerpt(block.prompt??block.text??block.explanation??block.purpose??block.tex),};}
function lessonOutline(lesson:Lesson,revision:number|null,publishedRevision:number|null){return{id:lesson.id,courseId:lesson.courseId,title:lesson.title,subtitle:lesson.subtitle,minutes:lesson.minutes,objectiveIds:lesson.objectiveIds,prerequisites:lesson.prerequisites,outcomes:lesson.outcomes,scopeNote:lesson.scopeNote,revision,publishedRevision,blocks:lesson.blocks.map(blockOutline),coverage:lesson.coverage};}
function template(kind:string){
 const common={id:'replace-with-lowercase-slug',objectives:['replace-with-course-objective-id']};
 const templates:Record<string,unknown>={
  course:{id:'replace-with-course-slug',title:'Replace with a clear course title',subject:'Replace with subject and bounded area',edition:'State the syllabus edition or source scope',description:'Explain the learner journey and intended use.',scopeNote:'State what is covered, deferred and not claimed.',objectives:[{id:'replace-with-objective-id',description:'A bounded learner performance.'}],chapters:[{id:'first-chapter',title:'01 · Replace with chapter title',lessonIds:['first-lesson-id']}]},
  lesson:{id:'replace-with-lesson-slug',courseId:'existing-course-id',title:'Replace with learner-facing lesson title',subtitle:'State the conceptual bridge.',minutes:30,prerequisites:['A declared prerequisite capability.'],outcomes:['A learner can perform a bounded, observable action.'],objectiveIds:['replace-with-course-objective-id'],scopeNote:'State the bounded syllabus alignment and what remains outside the lesson.',blocks:[{id:'opening',type:'prose',text:'Motivate the problem in original prose and name the learner action.'},{id:'worked-example',type:'worked',title:'A worked application',steps:[{title:'Set up',text:'Introduce the quantities, assumptions and notation.',why:'Explain why this representation is useful.'}]},{id:'check-understanding',type:'question',questionKind:'written',prompt:'Ask the learner to explain or apply the taught idea in a changed context.',solution:'Give a complete explained solution.',taughtIn:['opening','worked-example'],objectives:['replace-with-course-objective-id'],rubric:[{text:'State a criterion that earlier teaching makes attainable.',marks:2,taughtIn:['opening']}]}],summary:['State the durable idea learners should retain.'],coverage:[{objective:'replace-with-course-objective-id',teaching:['opening','worked-example'],practice:['check-understanding']}],provenance:'Describe the original reasoning, examples and assets used to create this lesson.',technicalNotes:['Record assumptions, independent calculations or implementation constraints.']},
  prose:{...common,type:'prose',text:'Explain one idea in original prose, defining notation and assumptions when needed.'},
  worked:{...common,type:'worked',title:'A worked application',steps:[{title:'Set up',text:'State the quantities and assumptions.',why:'Explain why this step follows.'},{title:'Reason',text:'Develop the calculation or argument.',why:'Connect the result to the concept.'}]},
  'choice-question':{...common,type:'question',questionKind:'choice',prompt:'Ask one focused question about earlier teaching.',options:['Plausible distractor one','Plausible distractor two','Correct conclusion'],correct:2,feedback:['Explain the specific misconception.','Explain the specific misconception.','Explain why this conclusion follows.'],solution:'Provide the complete reasoning, not only the answer.',taughtIn:['replace-with-earlier-teaching-block-id']},
  'numeric-question':{...common,type:'question',questionKind:'numeric',prompt:'Ask for a calculated value with stated units.',answer:0,tolerance:0.01,unit:'replace-with-unit',solution:'Show the calculation, assumptions and interpretation.',taughtIn:['replace-with-earlier-teaching-block-id']},
  'written-question':{...common,type:'question',questionKind:'written',prompt:'Ask the learner to apply and explain a taught method in a changed context.',solution:'Give a complete model solution.',taughtIn:['replace-with-earlier-teaching-block-id'],rubric:[{text:'A distinct, attainable criterion.',marks:2,taughtIn:['replace-with-earlier-teaching-block-id']}]},
  lab:{...common,type:'lab',labKind:'sampling',title:'Use only when the fixed built-in sampling model fits',purpose:'State the specific comparison the learner should make.',prediction:'Ask for a prediction before manipulation.',debrief:'Explain what the learner should observe and why.',fallback:'Provide a readable static equivalent.',transfer:'Ask a changed-context reasoning question.'},
  widget:{...common,type:'widget',title:'A focused custom interaction',purpose:'State what varying or constructing reveals.',prediction:'Ask for a prediction before interaction.',debrief:'Explain the observed relationship.',fallback:'Provide an equivalent readable table or explanation.',transfer:'Ask for transfer to a changed context.',html:'<!doctype html><html><body><label>Replace with a native labelled control <input type="range" min="0" max="10" value="5"></label><output>5</output><script>/* self-contained code only */</script></body></html>',height:360,checks:['Change every control and verify the displayed relationship.','Use keyboard control and reset.','Check a narrow viewport and the text fallback.']},
  review:{revision:'current-draft-revision',reviewer:'Describe the actual reviewer or review process.',level:'pilot',checks:{technical:'Record concrete independent calculations and their results.',pedagogy:'Record the teaching and assessment alignment actually inspected.',interaction:'Record exercised controls or why no interaction is used.',accessibility:'Record viewport, keyboard and fallback checks plus limits.',originality:'Record the source scope and independent design evidence.'},unresolved:[]},
 };
 const value=templates[kind];if(!value)throw new AppError(422,'Choose a supported template kind.');return value;
}
function diffContent(from:Course|Lesson,to:Course|Lesson){
 if('blocks' in from&&'blocks' in to){
  const before=new Map(from.blocks.map((b,i)=>[b.id,{block:b,index:i}])),after=new Map(to.blocks.map((b,i)=>[b.id,{block:b,index:i}]));
  const added=to.blocks.filter(b=>!before.has(b.id)).map(b=>({id:b.id,type:b.type}));
  const removed=from.blocks.filter(b=>!after.has(b.id)).map(b=>({id:b.id,type:b.type}));
  const changed=to.blocks.flatMap((b,index)=>{const old=before.get(b.id);if(!old)return[];const fields=Object.keys({...old.block,...b}).filter(key=>JSON.stringify((old.block as Record<string,unknown>)[key])!==JSON.stringify((b as Record<string,unknown>)[key]));return fields.length?[{id:b.id,type:b.type,moved:old.index!==index,changedFields:fields}]:[];});
  const lessonFields=['title','subtitle','minutes','prerequisites','outcomes','objectiveIds','scopeNote','summary','coverage','provenance','technicalNotes'].filter(key=>JSON.stringify((from as unknown as Record<string,unknown>)[key])!==JSON.stringify((to as unknown as Record<string,unknown>)[key]));
  return{kind:'lesson',changedLessonFields:lessonFields,addedBlocks:added,removedBlocks:removed,changedBlocks:changed};
 }
 const fields=['title','subject','edition','description','scopeNote','objectives','chapters'].filter(key=>JSON.stringify((from as unknown as Record<string,unknown>)[key])!==JSON.stringify((to as unknown as Record<string,unknown>)[key]));
 return{kind:'course',changedCourseFields:fields};
}
type Arguments={id?:string;blockId?:string;afterBlockId?:string;expectedRevision?:number;course?:Course;lesson?:Lesson;block?:Block;review?:Review;revision?:number;fromRevision?:number;toRevision?:number;kind?:string;courseId?:string;package?:unknown};
async function callTool(request:Request,name:string,args:Arguments){const database=db(),author=await isAuthor(request),origin=new URL(request.url).origin;
 const read=async(id:string,kind:'course'|'lesson')=>{const d=await getDocument(database,id);if(d.kind!==kind)throw new AppError(404,'Content kind does not match.');if(author)return d;if(!d.published)throw new AppError(404,'Content is not published.');if(kind==='lesson'){const c=await getDocument(database,d.courseId);if(!c.published||!(c.published as Course).chapters.some(ch=>ch.lessonIds.includes(id)))throw new AppError(404,'Lesson is not published in its course.');}return{...d,draft:d.published,revision:d.publishedRevision,review:d.publishedReview};};
 if(name==='get_authoring_contract')return CONTRACT;
 if(name==='get_authoring_template')return template(args.kind||'');
 if(name==='studio_overview')return{title:'Open Actuary',author,identity:identity(request)?.id??null,guide:origin+'/?view=guide',studio:origin+'/?view=studio',instructions:'Get the authoring contract, read a syllabus-bound course, create bounded draft lessons, inspect actual previews, independently check and review, then publish only when requested. No reference books are needed.',courses:(await listDocuments(database,'course')).filter(c=>author||c.published).map(c=>({id:c.id,title:((author?c.draft:c.published)as Course).title,revision:author?c.revision:c.publishedRevision,publishedRevision:c.publishedRevision}))};
 if(name==='list_courses')return(await listDocuments(database,'course')).filter(c=>author||c.published).map(c=>author?c:{id:c.id,course:c.published,revision:c.publishedRevision});
 if(name==='get_course_map'){
  const courses=(await listDocuments(database,'course')).filter(c=>author||c.published).filter(c=>!args.courseId||c.id===args.courseId);
  if(args.courseId&&!courses.length)throw new AppError(404,'Course not found.');
  return Promise.all(courses.map(async d=>{const course=(author?d.draft:d.published)as Course;const lessons=await listDocuments(database,'lesson',d.id);return{id:d.id,title:course.title,subject:course.subject,edition:course.edition,scopeNote:course.scopeNote,objectives:course.objectives,revision:author?d.revision:d.publishedRevision,publishedRevision:d.publishedRevision,chapters:course.chapters.map(ch=>({id:ch.id,title:ch.title,lessons:ch.lessonIds.map(lessonId=>{const row=lessons.find(l=>l.id===lessonId),lesson=row&&(author?row.draft:row.published)as Lesson|null;return{id:lessonId,title:lesson?.title??'Missing or unpublished lesson',revision:author?row?.revision:row?.publishedRevision,publishedRevision:row?.publishedRevision??null};})}))};}));
 }
 if(name==='get_course')return read(args.id||'','course');
 if(name==='validate_course'){const course=args.course??(await read(args.id||'','course')).draft as Course;return{issues:validateCourse(course),notice:'Structural checks only. Independently verify syllabus scope, mathematics and teaching quality.'};}
 if(name==='get_lesson')return read(args.id||'','lesson');
 if(name==='get_lesson_outline'){const d=await read(args.id||'','lesson');return lessonOutline(d.draft as Lesson,d.revision,d.publishedRevision);}
 if(name==='get_lesson_block'){const d=await read(args.id||'','lesson'),lesson=d.draft as Lesson,block=lesson.blocks.find(b=>b.id===args.blockId);if(!block)throw new AppError(404,'Block not found.');return{lessonId:lesson.id,revision:d.revision,position:lesson.blocks.findIndex(b=>b.id===args.blockId)+1,block};}
 await requireAuthor(request);
 if(name==='save_course'){if(!args.course)throw new AppError(422,'Supply a full course object.');return saveDocument(database,'course',args.course,args.expectedRevision??-1);}
 if(name==='save_lesson'){if(!args.lesson)throw new AppError(422,'Supply a full lesson object.');return saveDocument(database,'lesson',args.lesson,args.expectedRevision??-1);}
 if(['replace_lesson_block','insert_lesson_block','remove_lesson_block'].includes(name)){
  const current=await getDocument(database,args.id||'');if(current.kind!=='lesson')throw new AppError(422,'Choose a lesson.');if(current.revision!==(args.expectedRevision??-1))throw new AppError(409,'This draft changed since you opened it. Reload and merge your changes.',{currentRevision:current.revision});
  const lesson=current.draft as Lesson,blocks=[...lesson.blocks];let changedBlockId=args.blockId;
  if(name==='replace_lesson_block'){
   if(!args.block)throw new AppError(422,'Supply a complete replacement block.');const index=blocks.findIndex(b=>b.id===args.blockId);if(index<0)throw new AppError(404,'Block not found.');if(args.block.id!==args.blockId)throw new AppError(422,'Replacement block id must remain equal to blockId.');blocks[index]=args.block;
  }else if(name==='insert_lesson_block'){
   if(!args.block)throw new AppError(422,'Supply a complete new block.');if(blocks.some(b=>b.id===args.block?.id))throw new AppError(409,'A block with this id already exists.');const index=args.afterBlockId===undefined?blocks.length:blocks.findIndex(b=>b.id===args.afterBlockId)+1;if(index===0)throw new AppError(404,'afterBlockId not found.');blocks.splice(index,0,args.block);changedBlockId=args.block.id;
  }else{const index=blocks.findIndex(b=>b.id===args.blockId);if(index<0)throw new AppError(404,'Block not found.');blocks.splice(index,1);}
  const next={...lesson,blocks};const issues=validateLesson(next,(await getDocument(database,lesson.courseId)).draft as Course);if(issues.some(issue=>issue.severity==='error'))throw new AppError(422,'This block change would make the lesson invalid.',issues);
  const saved=await saveDocument(database,'lesson',next,current.revision,`${name.replaceAll('_',' ')}${changedBlockId?`: ${changedBlockId}`:''}`);return{lessonId:saved.id,revision:saved.revision,changedBlockId,warnings:issues.filter(issue=>issue.severity==='warning'),nextStep:'Re-read get_lesson_outline before the next edit; preview after a coherent teaching change.'};
 }
 if(name==='validate_lesson'){const l=args.lesson||(await getDocument(database,args.id||'')).draft as Lesson;const c=await getDocument(database,l.courseId);return{issues:validateLesson(l,c.draft as Course),notice:'Structure and declared links only. Independently verify meaning, mathematics and interaction behavior.'};}
 if(name==='preview_lesson'){const d=await getDocument(database,args.id||'');if(d.kind!=='lesson')throw new AppError(422,'Choose a lesson.');const l=d.draft as Lesson;return{url:`${origin}/?course=${encodeURIComponent(l.courseId)}&lesson=${encodeURIComponent(l.id)}&draft=1`,revision:d.revision,title:l.title,scope:l.scopeNote,blocks:l.blocks.map(b=>({id:b.id,type:b.type,title:b.title,objectives:b.objectives,purpose:b.purpose,prediction:b.prediction,transfer:b.transfer,checks:b.checks})),issues:validateLesson(l,(await getDocument(database,l.courseId)).draft as Course),browserChecklist:['Read the explanation before the widget.','Try every control, boundary and reset.','Check numeric outputs independently.','Use keyboard and a narrow viewport.','Attempt a question before revealing feedback.','Confirm readable fallback and actual objective transfer.']};}
 if(name==='record_review')return recordReview(database,args.id||'',args.review as Review);
 if(name==='publish_lesson'||name==='publish_course'){const d=await getDocument(database,args.id||'');if(d.kind!==(name==='publish_course'?'course':'lesson'))throw new AppError(422,'Use the publish tool for this content kind.');return publishDocument(database,d.id,args.expectedRevision??-1);}
 if(name==='list_revisions')return history(database,args.id||'');
 if(name==='get_revision_content')return revisionContent(database,args.id||'',args.revision??-1);
 if(name==='diff_revisions'){const from=await revisionContent(database,args.id||'',args.fromRevision??-1),to=await revisionContent(database,args.id||'',args.toRevision??-1);return{id:args.id,fromRevision:from.revision,toRevision:to.revision,changes:diffContent(from.content,to.content)};}
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
