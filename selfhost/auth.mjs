import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export async function passwordHash(password){if(typeof password!=='string'||password.length<14||password.length>256)throw Error('Usa entre 14 y 256 caracteres.');const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return `scrypt:${salt}:${hash.toString('hex')}`}
export function validHash(hash){return /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash||'')}
export async function verifyPassword(password,encoded){if(!validHash(encoded)||typeof password!=='string'||password.length>256)return false;const [,salt,expected]=encoded.split(':');const actual=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return timingSafeEqual(actual,Buffer.from(expected,'hex'))}
