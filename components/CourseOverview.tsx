'use client';
import {useState} from 'react';
import type {Course,Progress} from '../lib/learning/types';
import {Icon} from './Icon';

type Summary={id:string;title:string;revision:number;publishedRevision:number|null;reviewLevel:string};
type Route={view?:string;course?:string;lesson?:string;draft?:string};
export default function CourseOverview({course,lessons,draft,record,navigate}:{course:Course;lessons:Summary[];draft:boolean;record:(lesson:Summary)=>Progress;navigate:(route:Route)=>void}){
 const [filter,setFilter]=useState('all');
 const ordered=course.chapters.flatMap(ch=>ch.lessonIds).map(id=>lessons.find(l=>l.id===id)).filter((l):l is Summary=>!!l);
 const completed=ordered.filter(l=>record(l).completed).length,saved=ordered.filter(l=>record(l).bookmarked).length;
 const next=ordered.find(l=>!record(l).completed),target=next||ordered[0];
 const href=(id:string)=>'/?'+new URLSearchParams({course:course.id,lesson:id,...(draft?{draft:'1'}:{})}).toString();
 const open=(e:React.MouseEvent<HTMLAnchorElement>,route:Route)=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();navigate(route);}};
 const matches=(l:Summary)=>filter==='all'||(filter==='saved'?record(l).bookmarked:!record(l).completed);
 return <main id="main-content" className="course-overview course-refresh">
  <a href="/?view=library" onClick={e=>open(e,{view:'library'})} className="back-link">← Learning library</a>
  {draft&&<div className="draft-banner">Draft course preview · visible only to the author</div>}
  <header className="course-hero"><span className="eyebrow">{course.subject}</span><h1>{course.title}</h1><p className="lead">{course.description}</p><p className="course-edition">{course.edition}</p>{target&&<a href={href(target.id)} className="btn primary" onClick={e=>open(e,{course:course.id,lesson:target.id,...(draft?{draft:'1'}:{})})}>{completed===ordered.length?'Revisit this course':completed?'Continue learning':'Start learning'}<Icon name="arrow" size={18}/></a>}</header>
  <div className="course-overview-grid"><section aria-labelledby="path-heading"><div className="path-heading"><h2 id="path-heading">Your learning path</h2><span>{ordered.length} {draft?'draft':'published'} {ordered.length===1?'lesson':'lessons'}</span></div>
   {!!ordered.length&&<><div className="course-progress"><div><strong>{completed} of {ordered.length} read</strong><span>Reading record on this device</span></div><progress value={completed} max={ordered.length} aria-label="Lessons marked as read"/></div><div className="path-filters" role="group" aria-label="Filter lessons">{[['all','All lessons'],['unread','Unread'],['saved',`Saved (${saved})`]].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div></>}
   {course.chapters.map((ch,i)=>{const visible=ch.lessonIds.map(id=>ordered.find(l=>l.id===id)).filter((l):l is Summary=>!!l&&matches(l));return visible.length?<div className="overview-chapter" key={ch.id}><h3>Chapter {i+1} · {ch.title}</h3>{visible.map(l=>{const p=record(l);return <a key={l.id} href={href(l.id)} className={`overview-lesson ${p.completed?'is-read':''}`} onClick={e=>open(e,{course:course.id,lesson:l.id,...(draft?{draft:'1'}:{})})}><span className="overview-number">{p.completed?<Icon name="check" size={22}/>:String(ordered.indexOf(l)+1).padStart(2,'0')}</span><div><h4>{l.title}</h4><span>{p.completed?'Marked as read':'Read, explore, practise'}{p.bookmarked?' · Saved for later':''}</span></div><Icon name="arrow" size={18}/></a>;})}</div>:null;})}
   {!ordered.some(matches)&&<div className="empty-state"><h3>{!ordered.length?'Lessons are being prepared.':filter==='saved'?'No saved lessons yet.':'You’ve read every lesson.'}</h3><p>{filter==='saved'?'Choose “Save for later” while reading to keep a lesson here.':!ordered.length?'Published lessons will appear in this learning path.':'Revisit an example or try a practice question again.'}</p>{!!ordered.length&&<button className="btn" onClick={()=>setFilter('all')}>Show all lessons</button>}</div>}
  </section><aside><div className="course-scope-card"><span className="eyebrow">BEFORE YOU BEGIN</span><h2>Scope & syllabus</h2><p>{course.scopeNote}</p><details><summary>View {course.objectives.length} syllabus objectives</summary><ul className="scope-list">{course.objectives.map(o=><li key={o.id}><span>{o.id}</span>{o.description}</li>)}</ul></details></div><div className="course-study-tip"><h3>Make the lesson yours</h3><p>Save useful lessons and keep notes as you read. Marking a lesson as read tracks your reading, not assessed mastery.</p></div></aside></div>
 </main>;
}
