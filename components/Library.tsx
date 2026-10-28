'use client';
import {useState} from 'react';
import type {Course} from '../lib/learning/types';
import {Icon} from './Icon';

type Listed={id:string;course:Course;revision:number;review:{level:string}|null};
type Route={view?:string;course?:string;q?:string};
type Props={courses:Listed[];browse:boolean;author:boolean;navigate:(route:Route)=>void};
const subjectCode=(subject:string)=>subject.match(/^[A-Z]+\d+/)?.[0]||subject.split(' · ')[0];

export default function Library({courses,browse,author,navigate}:Props){
 const [query,setQuery]=useState(''),[subject,setSubject]=useState('all');
 const subjects=[...new Set(courses.map(item=>subjectCode(item.course.subject)))].sort();
 const filtered=courses.filter(({course})=>(subject==='all'||subjectCode(course.subject)===subject)&&[course.title,course.subject,course.description,...course.objectives.map(o=>o.description)].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const open=(event:React.MouseEvent<HTMLAnchorElement>,route:Route)=>{if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();navigate(route);}};
 return <main id="main-content" className="library library-refresh">
  <section className={`welcome ${browse?'welcome-browse':''}`}>
   <div><span className="eyebrow">THE OPEN ACTUARY LIBRARY</span><h1>{browse?<>Find your next<br/><em>moment of clarity.</em></>:<>Actuarial ideas.<br/><em>Made understandable.</em></>}</h1><p>Build understanding with clear explanations, worked examples and experiments you can explore.</p><div className="welcome-actions"><a href="#courses" className="btn primary">Browse learning materials <Icon name="arrow" size={18}/></a><a href="/?view=guide" onClick={e=>open(e,{view:'guide'})} className="text-link">How to study here</a></div></div>
   <aside className="study-note"><span className="eyebrow">A SMALL ROUTINE. A DEEPER UNDERSTANDING.</span><ol><li><span>01</span><div><strong>Read the reasoning</strong><p>See where a method comes from and when it applies.</p></div></li><li><span>02</span><div><strong>Explore the idea</strong><p>Make a prediction. Change an assumption. Explain the result.</p></div></li><li><span>03</span><div><strong>Try it for yourself</strong><p>Attempt a problem before opening the solution.</p></div></li></ol></aside>
  </section>
  <section className="library-section" id="courses" aria-labelledby="materials-heading">
   <div className="section-title"><div><span className="eyebrow">CHOOSE A LEARNING PATH</span><h2 id="materials-heading">Learning materials</h2></div><span className="library-count">{courses.length} published {courses.length===1?'course':'courses'}</span></div>
   {!!courses.length&&<><div className="library-tools"><label className="course-filter"><Icon name="search" size={19}/><span className="sr-only">Filter courses</span><input type="search" placeholder="Find a course, subject or topic" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="subject-filter">Subject<select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">All subjects</option>{subjects.map(s=><option key={s}>{s}</option>)}</select></label></div><p className="filter-status" role="status">{filtered.length===courses.length?'Browse all courses below.':`${filtered.length} of ${courses.length} courses match your filters.`}{(query||subject!=='all')&&<button className="text-button" onClick={()=>{setQuery('');setSubject('all');}}>Clear filters</button>}</p></>}
   {filtered.length?<div className="course-cards">{filtered.map(({id,course,review})=><article className="course-card" key={id}>
    <div className="course-card-top"><span className="subject-tag">{subjectCode(course.subject)}</span><span className="badge">{review?.level==='expert-reviewed'?'Outline review recorded':'Pilot course'}</span></div>
    <h3><a href={'/?course='+encodeURIComponent(id)} onClick={e=>open(e,{course:id})}>{course.title}</a></h3><p>{course.description}</p>
    <div className="course-card-footer"><span>{course.chapters.length} {course.chapters.length===1?'chapter':'chapters'} · {new Set(course.chapters.flatMap(ch=>ch.lessonIds)).size} {new Set(course.chapters.flatMap(ch=>ch.lessonIds)).size===1?'lesson':'lessons'} in outline</span><a href={'/?course='+encodeURIComponent(id)} onClick={e=>open(e,{course:id})}>View course <Icon name="arrow" size={18}/></a></div>
   </article>)}</div>:<div className="empty-state"><Icon name={courses.length?'search':'book'} size={30}/><h3>{courses.length?'No courses match those filters.':'New learning paths are on their way.'}</h3><p>{courses.length?'Try another topic or search inside published lessons below.':'Published courses will appear here as they become available.'}</p>{courses.length?<button className="btn" onClick={()=>{setQuery('');setSubject('all');}}>Show all courses</button>:author&&<a href="/?view=studio" className="btn primary" onClick={e=>open(e,{view:'studio'})}>Open author studio</a>}</div>}
   <div className="lesson-search-callout"><div><h3>Looking for a specific concept?</h3><p>Search inside published lessons for an explanation or a worked example.</p></div><form role="search" aria-label="Search lesson content" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);navigate({view:'search',q:String(data.get('concept')||'').trim()});}}><label className="sr-only" htmlFor="concept-search">Concept to find</label><input id="concept-search" name="concept" type="search" required minLength={2} placeholder="e.g. variance or Markov"/><button className="btn" type="submit">Search lessons <Icon name="arrow" size={16}/></button></form></div>
   {!!courses.length&&<p className="library-scope"><Icon name="book" size={17}/><span>Each course lists its syllabus scope and review status. Pilot courses cover selected topics; check the course outline for exam-year coverage.</span></p>}
  </section>
 </main>;
}
