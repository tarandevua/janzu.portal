// UI browser verification using the real component with a deterministic action fixture.
// SQL integration tests separately exercise the real authorization and mutations.
// PLAYWRIGHT_MODULE may point to a bundled playwright package; no production credentials used.
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = process.cwd();
const out = path.join(os.tmpdir(), 'task601-browser');
await mkdir(out, { recursive: true });
const fixture = `import React from 'react'; import {createRoot} from 'react-dom/client';
import {HistoricalWorkspace} from './features/historical-members/components/historical-workspace';
import en from './messages/en.json'; import es from './messages/es.json';
const locale=new URLSearchParams(location.search).get('locale')==='es'?'es':'en';
const d=(locale==='es'?es:en).historicalMembers;
const claim={id:'16010000-0000-4000-8000-000000000001',member_user_id:'16010000-0000-4000-8000-000000000002',source:'Historical school roster',source_key:'recognition-17',kind:'facilitator',details:{period:'2020',location:'Madrid',teachingInstructor:'Senior Instructor',cohort:'2020-A',evidence:[{source:'School',reference:'restricted:archive-17',type:'primary'}]},status:'pending_information',revision:1,reviewer_user_id:'reviewer',senior_decision:null,senior_total:null,approved_total:0,decided_by:null,created_at:'2020-01-01T00:00:00Z',updated_at:'2026-09-07T10:00:00Z'};
createRoot(document.getElementById('root')).render(<HistoricalWorkspace locale={locale} copy={d} claims={[claim]} events={[]} actor='reviewer' admin={true} page={1} hasNext={false} focused={false}/>);`;
await build({ stdin: { contents: fixture, resolveDir: root, loader: 'tsx' }, outfile: path.join(out,'app.js'), bundle: true, platform: 'browser', jsx: 'automatic', define: {'process.env.NODE_ENV':'"production"'}, plugins: [{name:'fixture-boundaries',setup(b){
  b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
  b.onResolve({filter:/^@\/features\/historical-members\/actions$/},()=>({path:'action',namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',resolveDir:root,contents:args.path==='link'?`import React from '${root}/node_modules/react/index.js'; export default function Link(p){return React.createElement('a',p,p.children)}`:`export async function historicalMemberAction(locale, previous, form){await new Promise(r=>setTimeout(r,30)); if(form.get('action')==='preview')return {status:'preview',report:{committed:false,rows:[{index:1,code:'ready'}]}}; if(form.get('action')==='commit')return {status:'saved',report:{committed:true,rows:[{index:1,code:'ready',claimId:'16010000-0000-4000-8000-000000000001'}]}}; return {status:'denied'};}` }));
}}] });
// Use the repository Tailwind configuration for the real component's responsive styles.
const { execFileSync } = await import('node:child_process');
execFileSync(process.execPath,[path.join(root,'node_modules/tailwindcss/lib/cli.js'),'-i',path.join(root,'app/globals.css'),'-o',path.join(out,'style.css')],{cwd:root,stdio:'pipe'});
const server = createServer(async(req,res)=>{try{
 const file=req.url.startsWith('/app.js')?'app.js':req.url.startsWith('/style.css')?'style.css':null;
 res.setHeader('Content-Type',file==='app.js'?'text/javascript':file==='style.css'?'text/css':'text/html');
 res.end(file?await readFile(path.join(out,file)):'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
}catch{res.statusCode=500;res.end('Fixture failed');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try {
 for(const locale of ['en','es']) for(const width of [1280,390]) {
  const page=await browser.newPage({viewport:{width,height:900}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const copy=JSON.parse(await readFile(path.join(root,`messages/${locale}.json`),'utf8')).historicalMembers;
  await page.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}`);
  const draft=page.getByLabel(copy.importJson);await draft.fill('[{}]');
  const commit=page.getByRole('button',{name:copy.commit,exact:true});assert.equal(await commit.isDisabled(),true);
  await page.getByRole('button',{name:copy.preview,exact:true}).click();await page.getByText(copy.results.preview,{exact:true}).waitFor();assert.equal(await commit.isEnabled(),true);
  await draft.fill('[{"changed":true}]');assert.equal(await commit.isDisabled(),true);
  await page.getByRole('button',{name:copy.preview,exact:true}).click();await page.getByText(copy.results.preview,{exact:true}).waitFor();
  await commit.click();await page.getByText(copy.results.saved,{exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:copy.guide}).getAttribute('href'),`/${locale}/dashboard/knowledge-base/certification/historical-members`);
  await page.getByText(copy.evidence,{exact:true}).click();
  await page.getByLabel(copy.reason,{exact:true}).fill('Independent fixture review');
  await page.getByRole('button',{name:copy.review,exact:true}).click();await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('alert').textContent(),copy.results.denied);
  await page.keyboard.press('Tab');assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,`${locale} ${width}: overflow`);
  await page.screenshot({path:path.join(out,`${locale}-${width}.png`),fullPage:true});assert.deepEqual(errors,[]);await page.close();
 }
 if(process.env.TASK601_PORTAL_URL){
  for(const locale of ['en','es']){
   const page=await browser.newPage();await page.goto(`${process.env.TASK601_PORTAL_URL}/${locale}/dashboard/historical-members`);await page.waitForURL(`**/${locale}/login**`);await page.close();
  }
 }
 await writeFile(path.join(out,'result.txt'),'PASS: EN/ES 1280px and 390px; preview gating, draft invalidation, commit result, exact guide link, authorization error, keyboard focus, no overflow or JS errors.\n');
 console.log(`Browser verification passed; artifacts: ${out}`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
