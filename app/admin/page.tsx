import {notFound} from 'next/navigation';
import {isOwnerEmail} from '../../lib/owner';
import {getChatGPTUser,requireChatGPTUser} from '../chatgpt-auth';
import {ProjectEditor} from '../../components/project-editor';
export const dynamic='force-dynamic';
export default async function Admin(){await requireChatGPTUser('/admin');const user=await getChatGPTUser();if(!isOwnerEmail(user?.email))notFound();return <ProjectEditor/>}
