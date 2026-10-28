import type { Block, Course, Issue, Lesson, Review } from './types';
const idPattern=/^[a-z][a-z0-9-]{1,79}$/;
const blockTypes=new Set(['prose','heading','callout','math','table','worked','question','lab','widget','image']);
const arr=(x:unknown):unknown[]=>Array.isArray(x)?x:[];
const str=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0;
export function validateCourse(input:unknown):Issue[]{
 const issues:Issue[]=[];const error=(path:string,message:string)=>issues.push({severity:'error',path,message});
 if(!input||typeof input!=='object')return[{severity:'error',path:'course',message:'A course must be an object.'}];
 const c=input as Course;
 if(!idPattern.test(c.id||''))error('id','Use a lowercase slug, 2–80 characters.');
 for(const key of ['title','subject','edition','description','scopeNote'] as const)if(!str(c[key]))error(key,`${key} is required.`);
 if(!Array.isArray(c.objectives)||!c.objectives.length)error('objectives','Declare at least one syllabus objective.');
 const ids=new Set<string>();for(const [i,o]of arr(c.objectives).entries()){if(!o||typeof o!=='object'){error(`objectives.${i}`,'An objective needs an id and description.');continue;}const v=o as Course['objectives'][number];if(!str(v.id)||!str(v.description))error(`objectives.${i}`,'An objective needs an id and description.');if(ids.has(v.id))error(`objectives.${i}`,'Duplicate objective ID.');ids.add(v.id);}
 const chapters=new Set<string>(),lessons=new Set<string>();
 if(!Array.isArray(c.chapters))error('chapters','Chapters must be an array.');
 for(const [i,row]of arr(c.chapters).entries()){if(!row||typeof row!=='object'){error(`chapters.${i}`,'Invalid chapter.');continue;}const ch=row as Course['chapters'][number];if(!idPattern.test(ch.id||'')||!str(ch.title)||!Array.isArray(ch.lessonIds))error(`chapters.${i}`,'A chapter requires id, title, and lessonIds.');if(chapters.has(ch.id))error(`chapters.${i}`,'Duplicate chapter ID.');chapters.add(ch.id);for(const id of arr(ch.lessonIds)){if(typeof id!=='string'||!idPattern.test(id))error(`chapters.${i}`,'Invalid lesson ID.');if(lessons.has(id as string))error(`chapters.${i}`,'A lesson may appear only once in the course outline.');lessons.add(id as string);}}
 return issues;
}
export function validateLesson(input:unknown,course?:Course):Issue[]{
 const issues:Issue[]=[];const error=(path:string,message:string)=>issues.push({severity:'error',path,message});const warn=(path:string,message:string)=>issues.push({severity:'warning',path,message});
 if(!input||typeof input!=='object')return[{severity:'error',path:'lesson',message:'A lesson must be an object.'}];const l=input as Lesson;
 for(const key of ['id','courseId']as const)if(!idPattern.test(l[key]||''))error(key,'Use a lowercase slug, 2–80 characters.');
 for(const key of ['title','subtitle','scopeNote','provenance']as const)if(!str(l[key]))error(key,`${key} is required.`);
 if(!Number.isFinite(l.minutes)||l.minutes<=0||l.minutes>600)error('minutes','Provide a positive editorial reading-time estimate, at most 600.');
 for(const key of ['prerequisites','outcomes','objectiveIds','summary','technicalNotes','coverage']as const)if(!Array.isArray(l[key]))error(key,`${key} must be an array.`);
 for(const key of ['prerequisites','outcomes','objectiveIds','summary','technicalNotes']as const)if(!arr(l[key]).length||arr(l[key]).some(v=>!str(v)))error(key,`Provide at least one non-empty ${key} entry.`);
 if(course&&l.courseId!==course.id)error('courseId','Lesson belongs to a different course.');
 const objectives=new Set(arr(l.objectiveIds));if(course)for(const o of objectives)if(!course.objectives.some(x=>x.id===o))error('objectiveIds',`Unknown course objective ${o}.`);
 if(arr(l.blocks).length>300)error('blocks','Split material into learning units of at most 300 blocks.');
 if(!Array.isArray(l.blocks)||!l.blocks.length)error('blocks','Provide teaching blocks.');
 const seen=new Map<string,Block>(),positions=new Map<string,number>();
 for(const [i,row]of arr(l.blocks).entries()){
 const path=`blocks.${i}`;if(!row||typeof row!=='object'){error(path,'A block must be an object.');continue;}const b=row as Block;
 if(!idPattern.test(b.id||''))error(path+'.id','Block needs a stable lowercase slug.');if(seen.has(b.id))error(path+'.id','Duplicate block ID.');seen.set(b.id,b);positions.set(b.id,i);
 if(!blockTypes.has(b.type))error(path+'.type','Unsupported block type.');
 for(const key of ['title','text','tex','explanation','prompt','solution','purpose','prediction','debrief','fallback','transfer','html','src','alt','unit']as const)if(b[key]!==undefined&&typeof b[key]!=='string')error(path+'.'+key,'This field must be text.');
 for(const key of ['objectives','headers','options','feedback','hints','taughtIn','checks']as const)if(b[key]!==undefined&&(!Array.isArray(b[key])||arr(b[key]).some(x=>typeof x!=='string')))error(path+'.'+key,'This field must be an array of text values.');
 for(const o of arr(b.objectives))if(!objectives.has(o))error(path+'.objectives',`Block objective ${o} is not declared by this lesson.`);
 if(['prose','heading','callout'].includes(b.type)&&!str(b.text))error(path+'.text','Text is required.');
 if(b.type==='heading'&&b.level!==2&&b.level!==3)error(path+'.level','Heading level must be 2 or 3.');
 if(b.type==='math'&&(!str(b.tex)||!str(b.explanation)))error(path,'An equation needs TeX and a plain-language explanation.');
 if(b.type==='table'&&(!arr(b.headers).length||!arr(b.rows).length||arr(b.rows).some(r=>!Array.isArray(r)||r.length!==b.headers?.length||r.some(x=>typeof x!=='string'))))error(path,'Table rows must match its non-empty headers.');
 if(b.type==='worked'&&(!str(b.title)||!arr(b.steps).length||arr(b.steps).some(s=>!s||typeof s!=='object'||!str((s as {text?:string}).text)||!str((s as {title?:string}).title)||((s as {why?:unknown}).why!==undefined&&typeof (s as {why?:unknown}).why!=='string'))))error(path,'A worked example needs titled, explained steps.');
 if(b.type==='question'){
 if(!str(b.prompt)||!str(b.solution))error(path,'A question needs a prompt and separate explained solution.');
 if(!['choice','numeric','written'].includes(b.questionKind||''))error(path+'.questionKind','Choose choice, numeric or written.');
 if(b.questionKind==='choice'&&(!Array.isArray(b.options)||b.options.length<2||!Number.isInteger(b.correct)||(b.correct??-1)<0||(b.correct??0)>=(b.options?.length??0)||!Array.isArray(b.feedback)||b.feedback.length!==b.options.length))error(path,'Choice questions need at least two options, a valid correct index and feedback per option.');
 if(b.questionKind==='numeric'&&(!Number.isFinite(b.answer)||!Number.isFinite(b.tolerance)||b.tolerance!<0))error(path,'Numeric questions need a finite answer and non-negative tolerance.');
 if(b.questionKind==='written'&&(!arr(b.rubric).length||arr(b.rubric).some(r=>!r||typeof r!=='object'||!str((r as {text?:string}).text)||!Number.isFinite((r as {marks?:number}).marks)||((r as {marks:number}).marks)<=0)))error(path,'Written questions need positive-mark criteria.');
 if(!arr(b.taughtIn).length)error(path+'.taughtIn','Map the assessment to earlier teaching or an explicit prerequisite.');
 }
 if(b.type==='lab'||b.type==='widget'){
 for(const key of ['title','purpose','prediction','debrief','fallback','transfer']as const)if(!str(b[key]))error(path+'.'+key,`An interaction requires ${key}.`);
 if(b.type==='lab'&&!['sampling','coverage','testing'].includes(b.labKind||''))error(path+'.labKind','Choose a supported lab, or a custom widget.');
 if(b.type==='widget'){if(!str(b.html))error(path+'.html','Supply a self-contained HTML document.');if((b.html?.length??0)>100000)error(path+'.html','Custom widgets are limited to 100KB; keep experiences focused.');if(!arr(b.checks).length)error(path+'.checks','Describe behavior checks to perform in the browser.');if(!Number.isFinite(b.height)||b.height!<240||b.height!>1000)error(path+'.height','Choose a height from 240 to 1000.');}
 }
 if(b.type==='image'&&(!str(b.alt)||!str(b.src)||!/^https:\/\/|^data:image\/(png|jpeg|webp);base64,/.test(b.src||'')))error(path,'Images need an alt description and HTTPS or a self-contained raster data URL.');
 }
 for(const [i,row]of arr(l.blocks).entries()){
 if(!row||typeof row!=='object')continue;const b=row as Block;const refs=[...arr(b.taughtIn),...arr(b.rubric).flatMap(r=>r&&typeof r==='object'?arr((r as {taughtIn?:string[]}).taughtIn):[])];
 for(const ref of refs){if(typeof ref!=='string'){error(`blocks.${i}.taughtIn`,'Teaching references must be strings.');continue;}if(ref.startsWith('prerequisite:')){const index=Number(ref.split(':')[1]);if(!Number.isInteger(index)||index<0||index>=arr(l.prerequisites).length)error(`blocks.${i}.taughtIn`,'Unknown prerequisite index.');}else if(!seen.has(ref)||(positions.get(ref)??Infinity)>=i||seen.get(ref)?.type==='question')error(`blocks.${i}.taughtIn`,`Assessment must reference earlier teaching: ${ref}.`);}
 if(b.type==='question'&&b.questionKind==='written')for(const [j,r]of arr(b.rubric).entries())if(!r||typeof r!=='object'||!arr((r as {taughtIn?:string[]}).taughtIn).length)error(`blocks.${i}.rubric.${j}`,'Each written criterion needs its own teaching/prerequisite link.');
 }
 for(const o of objectives){const row=arr(l.coverage).find(r=>r&&typeof r==='object'&&(r as {objective?:string}).objective===o)as Lesson['coverage'][number]|undefined;
 if(!row){error('coverage',`Missing coverage record for ${o}.`);continue;}
 if(!arr(row.teaching).length||!arr(row.practice).length)error('coverage',`${o} needs teaching and independent practice.`);
 for(const ref of arr(row.teaching)){const b=seen.get(ref as string);if(!b||b.type==='question'||!arr(b.objectives).includes(o))error('coverage',`Teaching ${ref} must exist and tag objective ${o}.`);}
 for(const ref of arr(row.practice)){const b=seen.get(ref as string);if(!b||b.type!=='question'||!arr(b.objectives).includes(o))error('coverage',`Practice ${ref} must be a question tagged ${o}.`);}
 }
 if(!arr(l.blocks).some(b=>b&&typeof b==='object'&&(b as Block).type==='worked'))warn('blocks','No worked example; explain why it is unnecessary in the review.');
 if(!arr(l.blocks).some(b=>b&&typeof b==='object'&&['lab','widget'].includes((b as Block).type)))warn('blocks','This is a reading-only lesson. That is appropriate when interaction offers no learning benefit.');
 return issues;
}
export function validateReview(r:unknown,revision:number):string[]{
 if(!r||typeof r!=='object')return['A review record is required.'];const v=r as Review;const errors:string[]=[];
 if(v.revision!==revision)errors.push('Review must match the current draft revision.');if(!str(v.reviewer))errors.push('Name the reviewer or review process.');if(!['pilot','expert-reviewed'].includes(v.level))errors.push('Choose pilot or expert-reviewed.');
 for(const key of ['technical','pedagogy','interaction','accessibility','originality']as const)if(!str(v.checks?.[key])||v.checks[key].trim().length<20)errors.push(`Record concrete ${key} review evidence (at least 20 characters).`);
 if(!Array.isArray(v.unresolved)||v.unresolved.length)errors.push('Resolve blocking concerns before publishing; unresolved must be an empty array.');return errors;
}
