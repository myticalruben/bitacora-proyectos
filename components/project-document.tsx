'use client';
import {useEffect,useState} from 'react';
import {api} from '../lib/api';import type {Project} from '../lib/types';import {Markdown,headings} from './markdown';
export function ProjectDocument({id}:{id:string}){
 const [project,setProject]=useState<Project|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{let active=true;api<Project[]>('/api/projects').then(p=>{if(active){const found=p.find(p=>p.id===id)||null;setProject(found);if(found)document.title=found.title+' · Rubén Alexander'}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id]);
 if(loading)return <p className="empty" role="status">Cargando proyecto…</p>;if(error)return <p role="alert">{error}</p>;if(!project)return <div className="pagehead"><h1>Proyecto no disponible</h1><p>Puede estar guardado como borrador o haberse eliminado.</p><a href="/proyectos.html">← Todos los proyectos</a></div>;
 return <><div className="pagehead"><a href="/proyectos.html">← Todos los proyectos</a><p className="eyebrow">{project.category}</p><h1>{project.title}</h1><p className="intro">{project.summary}</p><a href={'/admin?project='+encodeURIComponent(id)}>Editar documentación ↗</a></div><nav className="toc-links" aria-label="Índice">{headings(project.content).map(h=><a key={h.id} href={'#'+h.id}>{h.title}</a>)}</nav><article className="documentation"><Markdown text={project.content}/></article></>;
}
