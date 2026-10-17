export type Project = {id:string;title:string;summary:string;category:string;content:string;published:number;revision:number;updated_at:string};
export type ProjectInput = Pick<Project,'title'|'summary'|'category'|'content'> & {published:boolean;revision:number};
