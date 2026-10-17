export async function api<T>(url:string,options?:RequestInit):Promise<T>{
 const response=await fetch(url,{cache:'no-store',...options});
 let data;try{data=await response.json()}catch{throw Error('Respuesta inesperada. Recarga e inicia sesión si es necesario.')}
 if(!response.ok){const error=data as {error?:string};throw Error(error?.error||'No se pudo completar la operación.');}
 return data as T;
}
export function jsonRequest(method:string,body:unknown):RequestInit{return {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}}
