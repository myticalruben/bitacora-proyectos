import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import {resolve,sep} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash,randomBytes,randomUUID} from 'node:crypto';import {openDatabase,exportSQL} from './database.mjs';import {validHash,verifyPassword} from './auth.mjs';
const digest=value=>createHash('sha256').update(value).digest('hex');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
export function createApp({dbPath,origin,passwordHash,dist=resolve(fileURLToPath(new URL('./dist',import.meta.url)))}){
 if(!validHash(passwordHash))throw Error('ADMIN_PASSWORD_HASH no es un hash válido. Ejecuta npm run password.');
 const publicURL=new URL(origin);if(!['http:','https:'].includes(publicURL.protocol)||publicURL.origin!==origin)throw Error('APP_ORIGIN debe ser un origen exacto sin barra final.');
 const db=openDatabase(dbPath);const secure=publicURL.protocol==='https:';const cookieName=secure?'__Host-bitacora':'bitacora_session';
 const cookie=(token,maxAge)=>`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`;
 const authenticated=req=>{const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);return !!raw&&/^[a-f0-9]{64}$/.test(raw)&&!!db.prepare('SELECT 1 FROM sessions WHERE hash=? AND expires>?').get(digest(raw+passwordHash),Date.now())};
 const server=http.createServer(async(req,res)=>{
  const send=(code,value,extra={})=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY',...extra});res.end(typeof value==='string'?value:JSON.stringify(value))};
  const fail=(code,message)=>send(code,{error:message});
  try{
   const url=new URL(req.url,'http://internal');const path=url.pathname;const owner=authenticated(req);
   if(req.headers.host!==publicURL.host)return fail(421,'Host no permitido.');
   if(path==='/api/health'&&req.method==='GET')return send(200,{ok:true});
   if(path==='/api/session'&&req.method==='GET')return send(200,{owner});
   const writing=['POST','PUT','DELETE'].includes(req.method);
   if(writing){if(req.headers.origin!==origin)return fail(403,'Origen no permitido.');if(!req.headers['content-type']?.startsWith('application/json'))return fail(415,'Se requiere JSON.');}
   const body=async()=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>700000)throw Object.assign(Error('Documento demasiado grande.'),{status:413});chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(Error('JSON inválido.'),{status:400})}};
   if(path==='/api/login'&&req.method==='POST'){
    const input=await body();const now=Date.now();db.prepare('DELETE FROM sessions WHERE expires<=?').run(now);db.prepare('DELETE FROM login_attempts WHERE reset_at<=?').run(now);
    // Never trust X-Forwarded-For from arbitrary clients. Conservative global limiter also protects tunnels/proxies.
    const key='admin';const attempts=db.prepare('SELECT * FROM login_attempts WHERE ip=?').get(key);if(attempts&&attempts.count>=8)return fail(429,'Demasiados intentos. Espera 15 minutos.');
    db.prepare('INSERT INTO login_attempts VALUES (?,1,?) ON CONFLICT(ip) DO UPDATE SET count=count+1').run(key,now+900000);
    if(!await verifyPassword(input?.password,passwordHash))return fail(401,'Contraseña incorrecta.');
    db.prepare('DELETE FROM login_attempts WHERE ip=?').run(key);const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES (?,?)').run(digest(token+passwordHash),now+28800000);return send(200,{ok:true},{'Set-Cookie':cookie(token,28800)});
   }
   if(path==='/api/logout'&&req.method==='POST'){if(!owner)return fail(403,'No autorizado.');const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(token)db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(token+passwordHash));return send(200,{ok:true},{'Set-Cookie':cookie('',0)})}
   if(path==='/api/export'&&req.method==='GET'){if(!owner)return fail(403,'No autorizado.');return send(200,exportSQL(db),{'Content-Type':'application/sql; charset=utf-8','Content-Disposition':'attachment; filename="bitacora-backup.sql"'})}
   if(path==='/api/projects'&&req.method==='GET'){const admin=url.searchParams.has('admin');if(admin&&!owner)return fail(403,'No autorizado.');return send(200,db.prepare('SELECT * FROM projects WHERE deleted=0'+(admin?'':' AND published=1')+' ORDER BY updated_at DESC').all())}
   const match=path.match(/^\/api\/projects\/([a-z0-9-]{1,100})$/);
   if((path==='/api/projects'&&req.method==='POST')||(match&&['PUT','DELETE'].includes(req.method))){
    if(!owner)return fail(403,'No autorizado.');const input=await body();if(!input||typeof input!=='object')return fail(400,'Datos inválidos.');
    const now=new Date().toISOString();
    if(match){if(!Number.isInteger(input.revision)||input.revision<0)return fail(400,'Revisión inválida.');const current=db.prepare('SELECT * FROM projects WHERE id=? AND deleted=0').get(match[1]);if(!current||current.revision!==input.revision)return fail(409,'El proyecto cambió o fue eliminado. Recarga antes de continuar.');
     if(req.method==='DELETE'){db.prepare("UPDATE projects SET title='',summary='',category='',content='',published=0,deleted=1,revision=revision+1,updated_at=? WHERE id=?").run(now,match[1]);return send(200,{deleted:true})}
    }
    for(const [key,max] of [['title',140],['summary',600],['category',60],['content',150000]])if(typeof input[key]!=='string'||input[key].length>max||(key!=='summary'&&!input[key].trim()))return fail(400,'Revisa el título, categoría y documentación.');
    if(typeof input.published!=='boolean')return fail(400,'Estado inválido.');
    const args=[input.title.trim(),input.summary.trim(),input.category.trim(),input.content,input.published?1:0,now];let id;
    if(match){id=match[1];db.prepare('UPDATE projects SET title=?,summary=?,category=?,content=?,published=?,updated_at=?,revision=revision+1 WHERE id=?').run(...args,id)}else{id=randomUUID();db.prepare('INSERT INTO projects(title,summary,category,content,published,updated_at,id) VALUES (?,?,?,?,?,?,?)').run(...args,id)}
    return send(match?200:201,db.prepare('SELECT * FROM projects WHERE id=?').get(id));
   }
   if(path.startsWith('/api/'))return fail(404,'No encontrado.');if(!['GET','HEAD'].includes(req.method))return fail(405,'Método no permitido.');
   let file=resolve(dist,'.'+decodeURIComponent(path));if(!file.startsWith(resolve(dist)+sep))file=resolve(dist,'index.html');
   const isAsset=path.startsWith('/assets/');try{if(!(await stat(file)).isFile())throw Error()}catch{if(isAsset)return fail(404,'Archivo no encontrado.');file=resolve(dist,'index.html')}
   const extension=file.slice(file.lastIndexOf('.'));res.writeHead(200,{'Content-Type':mime[extension]||'application/octet-stream','Cache-Control':isAsset?'public, max-age=31536000, immutable':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'"});res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch(e){if(!res.headersSent)fail(e.status||500,e.status?e.message:'No se pudo completar la operación.');else res.end()}
 });server.requestTimeout=15000;server.headersTimeout=10000;return {server,db};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {server,db}=createApp({dbPath:process.env.DATABASE_PATH||'./data/bitacora.sqlite',origin:process.env.APP_ORIGIN||'',passwordHash:process.env.ADMIN_PASSWORD_HASH});const port=Number(process.env.PORT||3000);server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Bitácora escuchando en ${port}`));const stop=()=>server.close(()=>{db.close();process.exit(0)});process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
