import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createServer} from 'vite';
const watchdog=setTimeout(()=>{console.error('V10 simplified browser timeout');process.exit(124)},45000);
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:4195,strictPort:true}});
await server.listen();
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
async function square(name){const el=await page.$(`.cm-chessboard .board .square[data-square="${name}"]`);assert.ok(el,`board square ${name}`);const r=await el.boundingBox();assert.ok(r&&r.width>8);return {x:r.x+r.width/2,y:r.y+r.height/2};}
async function click(name){const p=await square(name);await page.mouse.click(p.x,p.y);}
try {
 await page.setViewport({width:1600,height:900,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4195/v10-simple.html',{waitUntil:'domcontentloaded',timeout:15000});
 await page.waitForSelector('.cm-chessboard .board .square[data-square="g1"]',{timeout:12000});
 await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')));
 assert.equal(await page.$('#recording-stage'),null);
 assert.equal(await page.$('#scene-notes'),null);
 const widths=await page.evaluate(()=>{const x=document.querySelector('.presentation').getBoundingClientRect(),a=document.querySelector('.lesson-area').getBoundingClientRect(),b=document.querySelector('.camera-area').getBoundingClientRect();return {total:x.width,board:a.width,camera:b.width,boardHost:document.querySelector('#teaching-board').getBoundingClientRect().height}});
 assert.ok(widths.camera/widths.total>.32&&widths.camera/widths.total<.36,'teacher camera occupies right third');
 assert.ok(widths.boardHost>350,'chessboard visible');
 console.log('PASS one tab, left board and right camera region');
 await click('g1');await click('f3');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')).steps[0].position.includes('5N2'));
 console.log('PASS move pieces without a separate recording window');
 await page.keyboard.press('u');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')).steps[0].position.includes('RNBQKBNR'));
 console.log('PASS Undo keyboard shortcut');
 await page.keyboard.press('d');
 await page.waitForFunction(()=>document.querySelector('[data-tool="pen"]').classList.contains('active'));
 const pt=await square('d4');await page.mouse.move(pt.x,pt.y);await page.mouse.down();await page.mouse.move(pt.x+45,pt.y+10,{steps:5});await page.mouse.up();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')).steps[0].annotations.length>0);
 console.log('PASS drawing directly on board using D shortcut');
 await page.keyboard.press('m');await page.keyboard.press('s');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')).steps.length===2);
 await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')).active===0);
 await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('chess-classroom-v10-simple-v1')).active===1);
 console.log('PASS Save step and navigate via shortcuts');
 await page.keyboard.press('h');await page.waitForFunction(()=>document.querySelector('.simple-app').classList.contains('controls-hidden'));
 await page.keyboard.press('h');await page.waitForFunction(()=>!document.querySelector('.simple-app').classList.contains('controls-hidden'));
 console.log('PASS recording toolbar hides and restores on one tab');
 await page.keyboard.press('f');await page.waitForFunction(()=>!!document.fullscreenElement,{timeout:3500});
 assert.ok(await page.$('#teaching-board'));await page.keyboard.press('a');await page.waitForFunction(()=>document.querySelector('[data-tool="arrow"]').classList.contains('active'));
 await page.keyboard.press('Escape');console.log('PASS keyboard drawing tools work in fullscreen');
 assert.deepEqual(errors,[]);console.log('PASS simplified V10 end-to-end');
} catch(error){console.error('FAILED:',error.stack||error,errors);try{await page.screenshot({path:'v10-simple-browser-failure.png',fullPage:true});}catch{}process.exitCode=1;}
finally{await page.close();await browser.close();await server.close();clearTimeout(watchdog);}
