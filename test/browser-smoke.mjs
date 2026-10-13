import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const server = await createServer({configFile:false,root:process.cwd(),base:'/',server:{host:'127.0.0.1',port:4192,strictPort:true}});
await server.listen();
const browser = await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',r=>{if(r.status()>=400&&r.url().includes('cm-assets'))errors.push(`${r.status()} ${r.url()}`)});
async function square(name){
  const s=await page.$(`.cm-chessboard .board .square[data-square="${name}"]`);
  assert.ok(s,`Square ${name} must be drawn`);
  const r=await s.boundingBox();assert.ok(r&&r.width>1,`Square ${name} must have visible bounds`);
  return {x:r.x+r.width/2,y:r.y+r.height/2};
}
async function clickSquare(name){const p=await square(name);await page.mouse.click(p.x,p.y)}
async function expectFenStarts(part,message){await page.waitForFunction(x=>document.querySelector('#fen-input')?.value.startsWith(x),{timeout:2500},part); console.log('PASS',message)}
try {
  await page.setViewport({width:1480,height:960,deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4192/',{waitUntil:'networkidle0'});
  await page.waitForSelector('.cm-chessboard .square[data-square="e2"]');
  assert.equal(await page.$eval('.cm-chessboard .pieces g[data-square="e2"]',e=>e.getAttribute('data-piece')),'wp');
  console.log('PASS board and SVG pieces');
  // Clean Classroom is intentionally board-first and hides rarely used controls.
  assert.ok(await page.$eval('#advanced-tools',e=>!e.open));
  assert.ok(await page.$eval('#teaching-panel',e=>e.getBoundingClientRect().width < 355));
  assert.equal(await page.$('[data-mode="game"].selected')!==null,true);
  console.log('PASS compact classroom layout');
  await page.evaluate(()=>{window.__clickLog=[];for(const evt of ['pointerdown','mousedown','mouseup','click'])document.addEventListener(evt,e=>{window.__clickLog.push([e.type,e.target?.getAttribute?.('data-square'),e.clientX,e.clientY]);},true);});
  await clickSquare('e2');
  await page.waitForFunction(()=>document.querySelectorAll('.markers .marker').length>0,{timeout:2500});
  console.log('PASS game move highlights');
  await clickSquare('e4');
  await expectFenStarts('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b','click-to-move e2-e4');
  await page.click('#undo');
  await expectFenStarts('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w','undo');
  await page.click('#redo');
  await expectFenStarts('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b','redo');
  await page.click('[data-annotation-tool="arrow"]');
  await clickSquare('e2');await clickSquare('e4');
  await page.waitForFunction(()=>document.querySelectorAll('.arrows .arrow').length>0,{timeout:2500});
  console.log('PASS arrow drawing');
  await page.click('[data-annotation-tool="circle"]');await clickSquare('d4');
  await page.waitForFunction(()=>document.querySelectorAll('.markers .marker').length>0,{timeout:2500});
  console.log('PASS circle drawing');
  await page.click('#clear-arrows');
  await page.click('[data-annotation-tool="move"]');
  await page.click('[data-mode="lesson"]');
  await page.click('#example-blockers');
  await page.waitForSelector('.cm-chessboard .pieces g[data-square="d4"]',{timeout:2500});
  console.log('PASS lesson blockers');
  await page.click('#advanced-tools > summary');
  assert.ok(await page.$eval('#advanced-tools',e=>e.open));
  await page.select('#lesson-tool','opponent');
  await clickSquare('f5');
  await page.waitForSelector('.cm-chessboard .pieces g[data-square="f5"]',{timeout:2500});
  console.log('PASS add opposing piece in lesson');
  await page.select('#lesson-tool','move');
  await page.click('#advanced-tools > summary');
  await clickSquare('d4');
  assert.ok((await page.$eval('#hint-info',e=>e.textContent)).includes('d4'));
  console.log('PASS lesson move hints');
  await page.click('#add-slide');
  assert.equal(await page.$$('#lesson-slides button').then(x=>x.length),1);
  console.log('PASS lesson slide');
  await page.click('[data-mode="editor"]');
  await page.select('#setup-tool','place');
  await clickSquare('b4');
  await page.waitForSelector('.cm-chessboard .pieces g[data-square="b4"]',{timeout:2500});
  console.log('PASS editor setup');
  await page.click('#language');assert.equal(await page.$eval('#language',e=>e.textContent.trim()),'EN');
  console.log('PASS bilingual switching');
  // On smaller devices the teaching panel follows the board, never covers it.
  await page.setViewport({width:700,height:920,deviceScaleFactor:1});
  await page.waitForFunction(()=>{const x=document.querySelector('.board-frame').getBoundingClientRect(),y=document.querySelector('#teaching-panel').getBoundingClientRect();return y.top>x.bottom && x.width<=window.innerWidth;});
  console.log('PASS responsive narrow layout');
  await page.setViewport({width:1480,height:960,deviceScaleFactor:1});
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  console.log('PASS browser smoke suite');
}catch(e){
  console.error('BROWSER TEST FAILURE',e.stack||e, '\nBROWSER ERRORS:',errors.join('; '));
  try {
    const d=await page.evaluate(()=>{
      const s=document.querySelector('.cm-chessboard .board .square[data-square="e2"]');
      const r=s?.getBoundingClientRect();
      const node=r?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;
      return {square:r?.toJSON(),over:node?.outerHTML?.slice(0,300),board:document.querySelector('#chessboard')?.getBoundingClientRect().toJSON(),hint:document.querySelector('#hint-info')?.textContent,boardClass:document.querySelector('.cm-chessboard .board')?.getAttribute('class'),markers:document.querySelectorAll('.markers .marker').length,status:document.querySelector('#status')?.textContent};
    });
    console.error('BOARD DIAGNOSTICS:',JSON.stringify(d));
    console.error('CLICK EVENTS',JSON.stringify(await page.evaluate(()=>window.__clickLog||[])));
    console.error('POINTER STATE',JSON.stringify(await page.evaluate(()=>window.__pointerSpy||null)));
  }catch(err){console.error('Diagnostics error',err.message)}

  await page.screenshot({path:'v9-browser-failure.png',fullPage:true}).catch(()=>{});
  process.exitCode=1;
}finally{await browser.close();await server.close();}
