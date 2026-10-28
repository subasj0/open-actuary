'use client';
import katex from 'katex';
import {Fragment} from 'react';
export function Equation({tex,display=false}:{tex:string;display?:boolean}){try{return <span className={display?'equation':'inline-math'} dangerouslySetInnerHTML={{__html:katex.renderToString(tex,{displayMode:display,throwOnError:true,trust:false,output:'htmlAndMathml',strict:'warn'})}}/>;}catch{return <code className="math-fallback">{tex}</code>;}}
export function Inline({text}:{text:string}){return <>{text.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('$')&&part.endsWith('$')?<Equation key={i} tex={part.slice(1,-1)}/>:part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:<Fragment key={i}>{part}</Fragment>)}</>;}
export function RichText({text,className=''}:{text:string;className?:string}){return <div className={`rich-text ${className}`}>{text.split(/\n\n+/).filter(Boolean).map((p,i)=><p key={i}><Inline text={p}/></p>)}</div>;}
