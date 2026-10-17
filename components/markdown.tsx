import {Fragment,type ReactNode} from 'react';
export function headings(text:string){let fenced=false;const result:{id:string;title:string}[]=[];for(const line of text.split('\n')){if(line.startsWith('```')){fenced=!fenced;continue}if(!fenced&&/^#{1,3}\s+/.test(line))result.push({id:'seccion-'+result.length,title:line.replace(/^#{1,3}\s+/, '')})}return result}

function inline(text:string):ReactNode[]{
 const parts:ReactNode[]=[];const pattern=/(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;let last=0,match;
 while((match=pattern.exec(text))){parts.push(text.slice(last,match.index));const key=match.index;if(match[2])parts.push(<strong key={key}>{match[2]}</strong>);else if(match[3])parts.push(<code className="inline-code" key={key}>{match[3]}</code>);else parts.push(<a key={key} href={match[5]} target="_blank" rel="noopener noreferrer">{match[4]} ↗</a>);last=pattern.lastIndex}parts.push(text.slice(last));return parts;
}
export function Markdown({text}:{text:string}){
 const output:ReactNode[]=[];let code:string[]|null=null;let heading=0;let list: string[]=[];
 const flush=()=>{if(list.length){output.push(<ul key={'list-'+output.length}>{list.map((line,i)=><li key={i}>{inline(line)}</li>)}</ul>);list=[]}};
 for(const line of text.split('\n')){
  if(line.startsWith('```')){flush();if(code){output.push(<pre key={'code-'+output.length}><code>{code.join('\n')}</code></pre>);code=null}else code=[];continue}
  if(code){code.push(line);continue}
  const bullet=line.match(/^[-*]\s+(.+)$/);if(bullet){list.push(bullet[1]);continue}flush();
  const h=line.match(/^(#{1,3})\s+(.+)$/);if(h){const Tag=('h'+h[1].length) as 'h1'|'h2'|'h3';output.push(<Tag id={'seccion-'+heading++} key={'h-'+output.length}>{inline(h[2])}</Tag>)}else if(line.trim())output.push(<p key={'p-'+output.length}>{inline(line)}</p>);
 }
 flush();if(code)output.push(<pre key="trailing-code"><code>{code.join('\n')}</code></pre>);
 return <>{output.map((node,i)=><Fragment key={i}>{node}</Fragment>)}</>;
}
