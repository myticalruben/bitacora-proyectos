'use client';
import {useEffect,useState} from 'react';
import type {Project} from '../lib/types';
import {api} from '../lib/api';
export function ProjectRows({projects}:{projects:Project[]}){return <>{projects.map((p,i)=><a className="project-row" href={'/proyectos/'+encodeURIComponent(p.id)+'.html'} key={p.id}><span className="number">{String(i+1).padStart(2,'0')}</span><div><div className="eyebrow">{p.category}</div><h2>{p.title}</h2><p>{p.summary}</p></div><span aria-hidden="true">↗</span></a>)}</>}
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function ProjectList({featured=false}:{featured?:boolean}){
 const [projects,setProjects]=useState<Project[]>([]);const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');api<Project[]>('/api/projects').then(p=>{if(active)setProjects(p)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[retry]);
 const filtered=projects.filter(p=>normalize(p.title+' '+p.summary+' '+p.category).includes(normalize(query)));
 return <>{!featured&&<><label htmlFor="search" className="eyebrow">Buscar proyectos</label><input className="search" id="search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre, tema o tecnología…"/></>}{loading?<p className="empty" role="status">Cargando proyectos…</p>:error?<div role="alert"><p>{error}</p><button className="btn" onClick={()=>setRetry(n=>n+1)}>Reintentar</button></div>:filtered.length?<ProjectRows projects={featured?filtered.slice(0,3):filtered}/>:<p className="empty">{query?'No se encontraron proyectos.':'Todavía no hay proyectos publicados.'}</p>}</>;
}
