import type { Metadata } from 'next';import {SiteShell} from '../components/site-shell';import './globals.css';
export const metadata: Metadata={title:'Rubén Alexander — Bitácora de proyectos',description:'Proyectos, documentación y aprendizajes de Rubén Alexander.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><SiteShell>{children}</SiteShell></body></html>}
