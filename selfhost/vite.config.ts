import {defineConfig} from 'vite';
export default defineConfig({resolve:{dedupe:['react','react-dom']},esbuild:{jsx:'automatic'},build:{outDir:'dist',emptyOutDir:true}});
