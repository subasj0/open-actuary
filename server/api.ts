import { CONTRACT } from '../lib/learning/authoring-contract';
import {db,errorResponse,identity,isAuthor,json,readJson,requireAuthor} from '../lib/learning/access';
import {AppError,exportCourse,getDocument,getProgress,history,importCourse,listDocuments,lessonSummaries,searchPublished,publishDocument,recordReview,restore,saveDocument,seedPilot,setProgress,unpublish} from '../lib/learning/store';
import {validateLesson} from '../lib/learning/validate';
import type {Course,Lesson,Progress,Review} from '../lib/learning/types';
export const dynamic='force-dynamic';
async function handle(request:Request){try{
 const url=new URL(request.url),parts=url.pathname.replace(/^\/api\//,'').split('/').map(decodeURIComponent),action=parts[0],id=parts[1];const write=request.method!=='GET';
 if(write&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw new AppError(403,'Use a same-origin authoring request.');
 if(action==='session'&&!write)return json({user:identity(request),author:await isAuthor(request)});
 if(action==='contract'&&!write)return json(CONTRACT);
 if(action==='health')return json({ok:true,formatVersion:1});
 const database=db();
 if(action==='courses'&&!write){const author=url.searchParams.get('draft')==='1';if(author)await requireAuthor(request);const courses=await listDocuments(database,'course');return json(courses.filter(c=>author||c.published).map(c=>author?c:{id:c.id,course:c.published,revision:c.publishedRevision,review:c.publishedReview}));}
 if(action==='course'&&!write){const c=await getDocument(database,id);if(c.kind!=='course')throw new AppError(404,'Course not found.');const draft=url.searchParams.get('draft')==='1';if(draft)await requireAuthor(request);else if(!c.published)throw new AppError(404,'Course is not published.');const all=await lessonSummaries(database,id,draft);const content=(draft?c.draft:c.published)as Course;const ids=new Set(content.chapters.flatMap(ch=>ch.lessonIds));return json({document:draft?c:{...c,draft:c.published,review:c.publishedReview,revision:c.publishedRevision},lessons:all.filter(l=>ids.has(l.id))});}
 if(action==='lesson'&&!write){const l=await getDocument(database,id);if(l.kind!=='lesson')throw new AppError(404,'Lesson not found.');if(url.searchParams.get('draft')==='1'){await requireAuthor(request);return json(l);}const c=await getDocument(database,l.courseId);if(!l.published||!c.published||!(c.published as Course).chapters.some(ch=>ch.lessonIds.includes(id)))throw new AppError(404,'This lesson is not published in the course.');return json({id:l.id,courseId:l.courseId,kind:'lesson',revision:l.publishedRevision,publishedRevision:l.publishedRevision,draft:l.published,published:l.published,review:l.publishedReview,updatedAt:l.updatedAt});}
 if(action==='progress'){const user=identity(request);if(!user)throw new AppError(401,'Sign in to sync your learning record.');if(!write)return json(await getProgress(database,user.id,id));const p=await readJson(request)as Progress;return json(await setProgress(database,user.id,id,p));}
 if(action==='search'&&!write){const q=(url.searchParams.get('q')||'').trim().toLowerCase();if(q.length<2)return json([]);const courses=await listDocuments(database,'course');const visible=new Set(courses.filter(c=>c.published).flatMap(c=>(c.published as Course).chapters.flatMap(ch=>ch.lessonIds)));return json(await searchPublished(database,q,visible));}
 await requireAuthor(request);
 if(action==='initialize'&&write)return json(await seedPilot(database));
 if(action==='save-course'&&write){const p=await readJson(request)as {course:Course;expectedRevision:number};return json(await saveDocument(database,'course',p.course,p.expectedRevision));}
 if(action==='save-lesson'&&write){const p=await readJson(request)as {lesson:Lesson;expectedRevision:number};return json(await saveDocument(database,'lesson',p.lesson,p.expectedRevision));}
 if(action==='validate'&&!write){const l=await getDocument(database,id);return json({issues:validateLesson(l.draft,(await getDocument(database,l.courseId)).draft as Course),revision:l.revision,notice:'Structural checks cannot certify mathematical or educational correctness.'});}
 if(action==='review'&&write)return json(await recordReview(database,id,await readJson(request)as Review));
 if(action==='publish'&&write){const p=await readJson(request)as {expectedRevision:number};return json(await publishDocument(database,id,p.expectedRevision));}
 if(action==='unpublish'&&write){const p=await readJson(request)as {expectedRevision:number};return json(await unpublish(database,id,p.expectedRevision));}
 if(action==='revisions'&&!write)return json(await history(database,id));
 if(action==='restore'&&write){const p=await readJson(request)as {revision:number;expectedRevision:number};return json(await restore(database,id,p.revision,p.expectedRevision));}
 if(action==='export'&&!write)return json(await exportCourse(database,id));
 if(action==='import'&&write)return json(await importCourse(database,await readJson(request)));
 throw new AppError(404,'Unknown operation.');
 }catch(error){return errorResponse(error);}}
export const GET=handle;export const POST=handle;
