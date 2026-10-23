const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const ts=require('typescript');const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
test('Home renders its hero, project list, and biography',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../../app/page.tsx'),'utf8');const exports={};const sandbox={exports,require:name=>name==='../components/project-list'?{ProjectList:()=>React.createElement('div',{'data-project-list':true})}:require(name)};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,sandbox);
 const html=renderToStaticMarkup(React.createElement(exports.default));assert(html.includes('Aprender.'));assert(html.includes('Construir.'));assert(html.includes('Compartir.'));assert(html.includes('data-project-list'));assert(html.includes('id="sobre-mi"'));
});
