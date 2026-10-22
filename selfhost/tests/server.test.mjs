import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createApp} from '../server.mjs';import {passwordHash} from '../auth.mjs';
test('auth, persistence, CRUD, drafts, version conflicts, CSRF and exports',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'bitacora-test-'));const config={dbPath:join(dir,'db.sqlite'),origin:'http://blog.test',passwordHash:await passwordHash('Testing-a-long-password-123')};const app=createApp(config);await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const port=app.server.address().port;
 const request=(path,{method='GET',body,cookie,origin='http://blog.test',headers={}}={})=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path,method,headers:{...(body===undefined?{}:{'content-length':Buffer.byteLength(JSON.stringify(body))}),host:'blog.test',origin,'content-type':'application/json',...(cookie?{cookie}:{}),...headers}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text,json:()=>JSON.parse(text)}))});req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body))});
 try{
  assert.equal((await request('/api/session')).json().owner,false);
  assert.equal((await request('/api/projects?admin=1',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'rubenalexandercanojimenez@gmail.com'}})).status,403);
  assert.equal((await request('/api/projects',{method:'POST',body:{}})).status,403);
  assert.equal((await request('/api/login',{method:'POST',body:{password:'wrong'}})).status,401);
  assert.equal((await request('/api/login',{method:'POST',origin:'http://evil.test',body:{password:'Testing-a-long-password-123'}})).status,403);
  const login=await request('/api/login',{method:'POST',body:{password:'Testing-a-long-password-123'}});assert.equal(login.status,200);const cookie=login.headers['set-cookie'][0].split(';')[0];assert(login.headers['set-cookie'][0].includes('HttpOnly'));assert(login.headers['set-cookie'][0].includes('SameSite=Strict'));
  const input={title:'Test project',summary:'summary',category:'Web',content:'## Hello',published:false};
  const saved=await request('/api/projects',{method:'POST',cookie,body:input});assert.equal(saved.status,201);const p=saved.json();assert.equal((await request('/api/projects')).json().length,0);assert.equal((await request('/api/projects?admin=1',{cookie})).json().length,1);
  assert.equal((await request('/api/projects/'+p.id,{method:'PUT',cookie,body:{...input,revision:0}})).status,409);
  assert.equal((await request('/api/projects/'+p.id,{method:'PUT',cookie,body:{...input,published:true,revision:p.revision}})).status,200);assert.equal((await request('/api/projects')).json().length,1);
  const dump=await request('/api/export',{cookie});assert.equal(dump.status,200);assert(dump.text.includes('Test project'));assert(!dump.text.includes('INSERT OR REPLACE INTO sessions'));assert.equal((await request('/api/export')).status,403);
  const latest=(await request('/api/projects')).json()[0];assert.equal((await request('/api/projects/'+p.id,{method:'DELETE',cookie,body:{revision:latest.revision}})).status,200);assert.equal((await request('/api/projects')).json().length,0);assert.equal((await request('/api/projects/'+p.id,{method:'PUT',cookie,body:{...input,revision:latest.revision}})).status,409);
  assert.equal((await request('/api/logout',{method:'POST',cookie,body:{}})).status,200);assert.equal((await request('/api/session',{cookie})).json().owner,false);
  app.db.close();const reopened=createApp(config);assert.equal(reopened.db.prepare('SELECT deleted FROM projects WHERE id=?').get(p.id).deleted,1);assert.equal(reopened.db.prepare('SELECT content FROM projects WHERE id=?').get(p.id).content,'');reopened.db.close();
 }finally{await new Promise(r=>app.server.close(r));try{app.db.close()}catch{}await rm(dir,{recursive:true,force:true})}
});
