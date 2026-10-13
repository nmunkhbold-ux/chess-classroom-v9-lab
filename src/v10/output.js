import './v10.css';
import 'cm-chessboard/assets/chessboard.css';
import {createBoard} from './board.js';
import {frameFor} from './core.js';
import {makeSync} from './sync.js';
const $=id=>document.getElementById(id);
const board=createBoard($('video-board'));
let current=null,token=0;
let lastRevision=-1;
const sleep=t=>new Promise(done=>setTimeout(done,t));
async function render(packet){
 if(!packet?.scene||packet.type!=='state')return;
 current=packet;const serial=++token;
 const scene=packet.scene,frame=frameFor(scene,packet.step);
 $('recording-stage').dataset.template=scene.template;
 $('video-title').textContent=scene.title||'Chess Classroom';
 $('video-subtitle').textContent=scene.subtitle||'';
 $('video-chapter').textContent=scene.chapter||'';
 $('video-explanation').replaceChildren(...frame.texts.map(t=>{const p=document.createElement('p');p.textContent=t;return p;}));
 await board.setOrientation(scene.orientation);
 if(serial!==token)return;
 await board.setPosition(frame.position,false);
 if(serial!==token)return;
 board.setAnnotations(frame.annotations);
 $('output-connection').hidden=true;
}
async function animate(packet){
 if(!packet?.scene||!Array.isArray(packet.frames))return;
 const serial=++token,scene=packet.scene;
 const opening=frameFor(scene,Math.max(0,packet.step-1));
 $('recording-stage').dataset.template=scene.template;
 $('video-title').textContent=scene.title||'Chess Classroom';$('video-subtitle').textContent=scene.subtitle||'';
 $('video-chapter').textContent=scene.chapter||'';
 await board.setOrientation(scene.orientation);
 await board.setPosition(opening.position,false);
 board.setAnnotations(opening.annotations);
 for(const fen of packet.frames.slice(0,24)){
   if(serial!==token)return;
   await board.setPosition(fen,true);
   await sleep(530);
 }
 if(serial!==token)return;
 const end=frameFor(scene,packet.step);await board.setPosition(end.position,false);board.setAnnotations(end.annotations);
 $('output-connection').hidden=true;
}
const sync=makeSync(packet=>{
 if(packet?.type==='state'){
   if(packet.revision&&packet.revision===lastRevision&&packet.sentAt===current?.sentAt)return;
   lastRevision=packet.revision;render(packet).catch(console.error);
 }
 if(packet?.type==='animate')animate(packet).catch(console.error);
 if(packet?.type==='request')sync.send({type:'ready'});
});
const previous=sync.saved();if(previous?.type==='state')render(previous).catch(console.error);
sync.send({type:'hello'});
window.addEventListener('pageshow',()=>sync.request());
