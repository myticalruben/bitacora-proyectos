import {getChatGPTUser} from '../chatgpt-auth';
import {isOwnerEmail} from '../../lib/owner';
export const dynamic='force-dynamic';
import {notFound} from 'next/navigation';
import {ProjectList} from '../../components/project-list';import {ProjectDocument} from '../../components/project-document';
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;const value=path.join('/');if(value==='proyectos.html'||value==='proyectos')return <><div className="pagehead"><a href="/">← Volver a la bitácora</a><h1>Archivo de <em>proyectos.</em></h1><p className="intro">Lo que voy construyendo, documentado paso a paso.</p></div><ProjectList/></>;const match=value.match(/^proyectos\/([a-z0-9-]{1,100})\.html$/);if(match){const user=await getChatGPTUser();return <ProjectDocument id={match[1]} canManage={isOwnerEmail(user?.email)}/>;}notFound()}
