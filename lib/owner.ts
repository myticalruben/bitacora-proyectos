import {env} from 'cloudflare:workers';
export function isOwnerEmail(email:string|null|undefined){
 const configured=(env as unknown as {OWNER_EMAIL?:string}).OWNER_EMAIL||'rubenalexandercanojimenez@gmail.com';
 return !!email&&email.toLowerCase()===configured.toLowerCase();
}
