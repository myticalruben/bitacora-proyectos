import {DatabaseSync} from 'node:sqlite';import {mkdirSync} from 'node:fs';import {dirname} from 'node:path';
export const columns=['id','title','summary','category','content','published','revision','updated_at','deleted'];
export function openDatabase(path){mkdirSync(dirname(path),{recursive:true,mode:0o700});const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,title TEXT NOT NULL,summary TEXT NOT NULL,category TEXT NOT NULL,content TEXT NOT NULL,published INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts(ip TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);`);return db}
export function exportSQL(db){const quote=v=>typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";return '-- Copia de proyectos (sin sesiones ni contraseñas)\nBEGIN TRANSACTION;\n'+db.prepare('SELECT * FROM projects').all().map(p=>`INSERT OR REPLACE INTO projects (${columns.join(',')}) VALUES (${columns.map(k=>quote(p[k])).join(',')});`).join('\n')+'\nCOMMIT;\n'}
