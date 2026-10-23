import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDatabase} from '../database.mjs';

export function addPortfolioProjects(db,projects){
 if(!Array.isArray(projects))throw Error('Se esperaba una lista de proyectos.');
 for(const p of projects){
  if(!p||!/^github-[a-z0-9-]{1,80}$/.test(p.id)||typeof p.published!=='boolean')throw Error('Proyecto inválido.');
  for(const [key,max] of [['title',140],['summary',600],['category',60],['content',150000]])if(typeof p[key]!=='string'||p[key].length>max||!p[key].trim())throw Error('Campo inválido: '+key);
 }
 const result={inserted:[],skipped:[]};
 db.exec('BEGIN IMMEDIATE');
 try{
  const exists=db.prepare('SELECT id FROM projects WHERE id=? OR lower(title)=lower(?) LIMIT 1');
  const insert=db.prepare('INSERT INTO projects (id,title,summary,category,content,published,revision,updated_at,deleted) VALUES (?,?,?,?,?,?,1,?,0)');
  for(const p of projects){
   // Include deleted rows: a manual re-run must not restore a removed project.
   if(exists.get(p.id,p.title)){result.skipped.push(p.id);continue}
   insert.run(p.id,p.title,p.summary,p.category,p.content,p.published?1:0,new Date().toISOString());result.inserted.push(p.id);
  }
  db.exec('COMMIT');return result;
 }catch(e){db.exec('ROLLBACK');throw e}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const projects=JSON.parse(readFileSync(new URL('../content/portfolio-projects.json',import.meta.url),'utf8'));
 const db=openDatabase(process.env.DATABASE_PATH||resolve('data/bitacora.sqlite'));
 try{const result=addPortfolioProjects(db,projects);console.log(`Añadidos: ${result.inserted.length}. Existentes conservados: ${result.skipped.length}.`);for(const id of result.inserted)console.log('  /proyectos/'+id+'.html')}finally{db.close()}
}
