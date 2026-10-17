import { listProjects,isOwner,save } from '../../../lib/projects';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const admin=new URL(request.url).searchParams.has('admin');
 if(admin&&!isOwner(request))return Response.json({error:'Solo la cuenta propietaria puede administrar.'},{status:403});
 try{return Response.json((await listProjects()).filter(p=>admin||p.published),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'No se pudieron cargar los proyectos. Vuelve a intentarlo.'},{status:503})}
}
export async function POST(request:Request){return save(request)}
