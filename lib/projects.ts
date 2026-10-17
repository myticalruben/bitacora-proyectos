import {isOwnerEmail} from './owner';
import { env } from 'cloudflare:workers';
import { seeds } from './seeds';
export type Project = typeof seeds[number] & { deleted?: number };
function database(){if(!env.DB)throw Error("Base de datos no disponible");return env.DB;}
export async function listProjects(): Promise<Project[]> {
 const result = await database().prepare('SELECT * FROM projects ORDER BY updated_at DESC').all<Project>();
 const merged = new Map<string, Project>(seeds.map(p => [p.id, p]));
 for (const p of result.results) merged.set(p.id, p);
 return [...merged.values()].filter(p=>!p.deleted).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
}
export function isOwner(request: Request) {
 return !!request.headers.get('oai-authenticated-user-id') && isOwnerEmail(request.headers.get('oai-authenticated-user-email'));
}
export function writeAllowed(request: Request) {
 return isOwner(request) && request.headers.get('origin') === new URL(request.url).origin && request.headers.get('content-type')?.startsWith('application/json');
}
export function validate(value: unknown) {
 const v = value as Record<string,unknown>;
 if(!v || typeof v !== 'object') throw Error('Datos inválidos.');
 for(const [key,max] of [['title',140],['summary',600],['category',60],['content',150000]] as const) {
  if(typeof v[key] !== 'string' || (v[key] as string).length>max || (key !== 'summary' && !(v[key] as string).trim())) throw Error('Revisa los campos: título, categoría y documentación son obligatorios.');
 }
 if(typeof v.published !== 'boolean') throw Error('Estado inválido.');
 return { title:(v.title as string).trim(),summary:(v.summary as string).trim(),category:(v.category as string).trim(),content:v.content as string,published:v.published?1:0 };
}
export async function save(request: Request,id?:string) {
 if(!writeAllowed(request))return Response.json({error:'No autorizado. Inicia sesión con la cuenta propietaria.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>700000)return Response.json({error:'Documento demasiado grande.'},{status:413});
 try {
  const raw = await request.text();if(raw.length>200000)return Response.json({error:'Documento demasiado grande.'},{status:413});
  const body=JSON.parse(raw);const p=validate(body);const now=new Date().toISOString();
  if(id) {
   if(!/^[a-z0-9-]{1,100}$/.test(id) || !Number.isInteger(body.revision) || body.revision<0)return Response.json({error:'Versión inválida.'},{status:400});
   const row=await database().prepare(`INSERT INTO projects (id,title,summary,category,content,published,revision,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE ?=0 OR EXISTS(SELECT 1 FROM projects WHERE id=?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,summary=excluded.summary,category=excluded.category,content=excluded.content,published=excluded.published,revision=projects.revision+1,updated_at=excluded.updated_at WHERE projects.revision=? AND projects.deleted=0 RETURNING *`).bind(id,p.title,p.summary,p.category,p.content,p.published,body.revision+1,now,body.revision,id,body.revision).first<Project>();
   if(!row)return Response.json({error:'Este proyecto cambió en otra pestaña. Recarga antes de guardar para evitar sobrescribirlo.'},{status:409});
   return Response.json(row,{headers:{'Cache-Control':'no-store'}});
  }
  const newId=p.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)+'-'+crypto.randomUUID().slice(0,8);
  const row=await database().prepare('INSERT INTO projects (id,title,summary,category,content,published,revision,updated_at) VALUES (?,?,?,?,?,?,1,?) RETURNING *').bind(newId,p.title,p.summary,p.category,p.content,p.published,now).first<Project>();
  return Response.json(row,{status:201,headers:{'Cache-Control':'no-store'}});
 } catch(e) { if(e instanceof Error && /campos|inválido|Datos/.test(e.message))return Response.json({error:e.message},{status:400});return Response.json({error:'No se pudo guardar. Tu texto sigue en el editor; vuelve a intentarlo.'},{status:500}); }
}

export async function remove(request:Request,id:string){
 if(!writeAllowed(request))return Response.json({error:'No autorizado.'},{status:403});
 try{
  const raw=await request.text();if(raw.length>1000)return Response.json({error:'Solicitud inválida.'},{status:400});
  const body=JSON.parse(raw);
  if(!/^[a-z0-9-]{1,100}$/.test(id)||!Number.isInteger(body.revision)||body.revision<0)return Response.json({error:'Versión inválida.'},{status:400});
  const seed=seeds.some(p=>p.id===id);
  const row=await database().prepare(`INSERT INTO projects (id,title,summary,category,content,published,revision,updated_at,deleted) SELECT ?,'','','','',0,?,?,1 WHERE (?=0 AND ?=1) OR EXISTS(SELECT 1 FROM projects WHERE id=?) ON CONFLICT(id) DO UPDATE SET title='',summary='',category='',content='',published=0,revision=projects.revision+1,updated_at=excluded.updated_at,deleted=1 WHERE projects.revision=? AND projects.deleted=0 RETURNING id`).bind(id,body.revision+1,new Date().toISOString(),body.revision,seed?1:0,id,body.revision).first();
  if(!row)return Response.json({error:'El proyecto cambió o ya se eliminó. Recarga el panel antes de continuar.'},{status:409});
  return Response.json({deleted:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'No se pudo eliminar el proyecto. Vuelve a intentarlo.'},{status:500});}
}
