// Small, validated, single-window teaching lesson format. No private notes, telemetry, or servers.
import {normalizePosition,validateAnnotation,DEFAULT_FEN} from '../v10/core.js';
import {fenToMap,mapToFen,freeMove,putPiece} from '../core/position.js';
const uid=()=>globalThis.crypto?.randomUUID?.()||`step-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const STORAGE_KEY='chess-classroom-v10-simple-v1';
export const MAX_STEPS=80;
const clone=value=>JSON.parse(JSON.stringify(value));
const cap=(value,max=120)=>String(value??'').slice(0,max);
export function makeStep(title='Free Teaching',position=DEFAULT_FEN){return {id:uid(),title:cap(title),position:normalizePosition(position),orientation:'w',annotations:[]};}
export function newTeachingLesson(language='mn'){
 return {format:'chess-classroom-simple',version:1,title:language==='mn'?'Шатрын хичээл':'Chess Lesson',language:language==='en'?'en':'mn',steps:[makeStep(language==='mn'?'Чөлөөт хичээл':'Free Teaching')],active:0};
}
export function duplicateStep(step){const next=clone(step);next.id=uid();next.title=cap(step.title+' (copy)');return next;}
export function validateTeachingLesson(raw){
 if(!raw||typeof raw!=='object')throw Error('Invalid lesson file');
 // Optional import of prior V10 scene exports; narration and presenter settings intentionally omitted.
 if(raw.version===10&&Array.isArray(raw.scenes)){
   raw={format:'chess-classroom-simple',version:1,title:raw.title,language:raw.language,
     steps:raw.scenes.map(scene=>({title:scene.title,position:scene.position,orientation:scene.orientation,annotations:scene.annotations})),active:0};
 }
 if(raw.format!=='chess-classroom-simple'||raw.version!==1||!Array.isArray(raw.steps)||raw.steps.length<1||raw.steps.length>MAX_STEPS)throw Error('Unsupported lesson format');
 const ids=new Set();
 const steps=raw.steps.map((s,index)=>{
   if(!s||typeof s!=='object')throw Error(`Invalid step ${index+1}`);
   const id=typeof s.id==='string'&&s.id.length<=100?s.id:uid();
   if(ids.has(id))throw Error('Duplicate step identifiers');ids.add(id);
   if(!Array.isArray(s.annotations)||s.annotations.length>300)throw Error('Too many annotations');
   return {id,title:cap(s.title,120),position:normalizePosition(s.position),orientation:s.orientation==='b'?'b':'w',annotations:s.annotations.map(validateAnnotation)};
 });
 const active=Math.max(0,Math.min(steps.length-1,Number.isInteger(raw.active)?raw.active:0));
 return {format:'chess-classroom-simple',version:1,title:cap(raw.title),language:raw.language==='en'?'en':'mn',steps,active};
}
export function stepAfterMove(step,from,to,place=null){
 const map=fenToMap(step.position);
 const changed=place!==null?putPiece(map,to,place==='.'?null:place):freeMove(map,from,to);
 return {...step,position:normalizePosition(mapToFen(changed))};
}
