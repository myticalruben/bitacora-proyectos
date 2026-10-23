import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {openDatabase} from '../database.mjs';import {addPortfolioProjects} from '../scripts/add-portfolio-projects.mjs';
const projects=JSON.parse(readFileSync(new URL('../content/portfolio-projects.json',import.meta.url),'utf8'));
test('adds both portfolio projects, preserving edits, deletions and unrelated data',()=>{
 const db=openDatabase(':memory:');try{
  db.prepare('INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?)').run('existing','Mi proyecto','Resumen','Web','Documento',0,7,'2026-01-01',0);
  assert.equal(addPortfolioProjects(db,projects).inserted.length,2);
  for(const p of projects){const row=db.prepare('SELECT * FROM projects WHERE id=?').get(p.id);assert.equal(row.published,1);assert(row.content.includes('https://github.com/myticalruben/'));assert.equal(row.revision,1)}
  db.prepare('UPDATE projects SET content=?,revision=8 WHERE id=?').run('Edición manual',projects[0].id);
  db.prepare("UPDATE projects SET deleted=1,content='' WHERE id=?").run(projects[1].id);
  const result=addPortfolioProjects(db,projects);assert.equal(result.inserted.length,0);assert.equal(result.skipped.length,2);
  assert.equal(db.prepare('SELECT content FROM projects WHERE id=?').get(projects[0].id).content,'Edición manual');
  assert.equal(db.prepare('SELECT deleted FROM projects WHERE id=?').get(projects[1].id).deleted,1);
  assert.equal(db.prepare('SELECT revision FROM projects WHERE id=?').get('existing').revision,7);
  assert.throws(()=>addPortfolioProjects(db,[{...projects[0],title:''}]));
 }finally{db.close()}
});
