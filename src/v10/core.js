// V10 lesson schema and deterministic presentation state. Pure, browser-independent code.
import { fenToMap, mapToFen } from '../core/position.js';

export const VERSION = 10;
export const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
export const TEMPLATES = ['intro','board-presenter','board-only','exercise','answer','summary'];
export const REVEAL_TYPES = ['highlight','arrow','circle','text','move','clear'];
const randomId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clone = x => JSON.parse(JSON.stringify(x));
const cap = (v,n=200) => String(v??'').slice(0,n);

export function newScene(kind='board-presenter',n=1){
  return { id:randomId(), template:TEMPLATES.includes(kind)?kind:'board-presenter', title:`Scene ${n}`,subtitle:'',chapter:'',
    position:DEFAULT_FEN,orientation:'w',notes:'',duration:0,annotations:[],reveals:[] };
}
export function newLesson(language='mn'){
  const scene=newScene('intro',1);
  scene.title=language==='mn'?'Шатрын хичээл':'Chess Lesson';
  scene.subtitle=language==='mn'?'Өнөөдрийн хичээл':'Today’s lesson';
  return {version:VERSION,id:randomId(),title:scene.title,language:language==='en'?'en':'mn',course:'ГЭГЭЭН АРВАЙ ШАТРЫН КЛУБ',updatedAt:new Date().toISOString(),scenes:[scene]};
}
const pieceRe=/^[pnbrqkPNBRQK]$/;
export function normalizePosition(input){const map=fenToMap(input||DEFAULT_FEN);return `${mapToFen(map).split(' ')[0]} w - - 0 1`;}
export function validateLesson(obj){
  if(!obj||typeof obj!=='object'||obj.version!==10||!Array.isArray(obj.scenes)||obj.scenes.length<1||obj.scenes.length>120)throw Error('Unsupported lesson format or scene count');
  const seen=new Set();
  const lesson={version:VERSION,id:cap(obj.id||randomId(),80),title:cap(obj.title),language:obj.language==='en'?'en':'mn',course:cap(obj.course,180),updatedAt:cap(obj.updatedAt,40),scenes:[]};
  for(const entry of obj.scenes){
    if(!entry||typeof entry!=='object')throw Error('Invalid scene');
    const id=cap(entry.id||randomId(),80);
    if(seen.has(id))throw Error('Duplicate scene IDs'); seen.add(id);
    if(!TEMPLATES.includes(entry.template))throw Error('Unknown recording template');
    const scene={id,template:entry.template,title:cap(entry.title),subtitle:cap(entry.subtitle,300),chapter:cap(entry.chapter),
      position:normalizePosition(entry.position),orientation:entry.orientation==='b'?'b':'w',notes:cap(entry.notes,12000),
      duration:Math.max(0,Math.min(3600,Number(entry.duration)||0)),annotations:[],reveals:[]};
    if(Array.isArray(entry.annotations)){
      if(entry.annotations.length>300)throw Error('Too many annotations');
      scene.annotations=entry.annotations.map(validateAnnotation);
    }
    if(Array.isArray(entry.reveals)){
      if(entry.reveals.length>50)throw Error('Too many reveal steps');
      scene.reveals=entry.reveals.map((r)=>{
        if(!REVEAL_TYPES.includes(r?.type))throw Error('Unknown reveal action');
        return {id:cap(r.id||randomId(),80),type:r.type,value:cap(r.value,600),label:cap(r.label,150)};
      });
    }
    lesson.scenes.push(scene);
  }
  return lesson;
}
export function validateAnnotation(a){
  if(!a||!['pen','arrow','circle','highlight'].includes(a.type))throw Error('Unknown annotation');
  const out={type:a.type,color:['gold','green','red','blue'].includes(a.color)?a.color:'gold',width:Math.max(1,Math.min(25,Number(a.width)||5))};
  if(a.type==='pen'){
    if(!Array.isArray(a.points)||a.points.length>1200)throw Error('Invalid pen stroke');
    out.points=a.points.map(p=>({x:Math.max(0,Math.min(1000,Number(p.x)||0)),y:Math.max(0,Math.min(1000,Number(p.y)||0))}));
  }else if(a.type==='highlight'||a.type==='circle'){
    if(!/^[a-h][1-8]$/.test(a.square))throw Error('Invalid annotation square');out.square=a.square;
  }else{
    if(!/^[a-h][1-8]$/.test(a.from)||!/^[a-h][1-8]$/.test(a.to))throw Error('Invalid arrow squares');out.from=a.from;out.to=a.to;
  }
  return out;
}
export function copyScene(scene){return {...clone(scene),id:randomId(),title:`${scene.title} (copy)`};}
export function moveSequence(value){
  const moves=String(value||'').replace(/,/g,' ').split(/\s+/).filter(Boolean);
  if(moves.length>24)throw Error('Maximum 24 moves per demonstration');
  return moves.map(v=>{const m=v.match(/^([a-h][1-8])[-:]?([a-h][1-8])([qrbn])?$/i);if(!m)throw Error(`Invalid move: ${v}`);return {from:m[1].toLowerCase(),to:m[2].toLowerCase(),promotion:m[3]?.toLowerCase()};});
}
function applyMove(map,move){
  const piece=map[move.from];if(!piece)throw Error(`No piece on ${move.from}`);
  const next={...map},side=piece===piece.toUpperCase()?'w':'b';
  const isPawn=piece.toLowerCase()==='p',isKing=piece.toLowerCase()==='k';
  const fromFile=move.from.charCodeAt(0),toFile=move.to.charCodeAt(0);
  // Visual demonstrations support castling and en-passant without enforcing legality.
  if(isKing&&Math.abs(toFile-fromFile)===2&&move.from[1]===move.to[1]){
    const kingside=toFile>fromFile,rank=move.from[1];
    const rookFrom=(kingside?'h':'a')+rank,rookTo=(kingside?'f':'d')+rank;
    const rook=next[rookFrom];if(rook&&rook.toLowerCase()==='r'){
      delete next[rookFrom];next[rookTo]=rook;
    }
  }
  if(isPawn&&fromFile!==toFile&&!next[move.to]){
    const captured=move.to[0]+move.from[1];
    if(next[captured]?.toLowerCase()==='p'&&(next[captured]===next[captured].toUpperCase())!==(side==='w'))delete next[captured];
  }
  delete next[move.from];
  const promotion=isPawn&&(move.to[1]==='8'||move.to[1]==='1')?(move.promotion||'q'):move.promotion;
  next[move.to]=promotion?(side==='w'?promotion.toUpperCase():promotion):piece;
  return next;
}
export function framesForMoveSequence(initialPosition,value){let map=fenToMap(initialPosition);return moveSequence(value).map(move=>{map=applyMove(map,move);return normalizePosition(mapToFen(map));});}
export function frameFor(scene,step=0){
  const reveals=Array.isArray(scene.reveals)?scene.reveals:[];
  const applied=Math.max(0,Math.min(reveals.length,Number(step)||0));
  let position=normalizePosition(scene.position),annotations=clone(scene.annotations||[]),texts=[];
  for(const reveal of reveals.slice(0,applied)){
    if(reveal.type==='clear'){annotations=[];texts=[];continue;}
    if(reveal.type==='text'){texts.push(cap(reveal.value,500));continue;}
    if(reveal.type==='move'){
      const frames=framesForMoveSequence(position,reveal.value);
      if(frames.length)position=frames.at(-1);
      continue;
    }
    const color='gold';
    if(reveal.type==='highlight'){
      const squares=String(reveal.value).split(/[\s,]+/).filter(Boolean);
      for(const square of squares)if(/^[a-h][1-8]$/.test(square))annotations.push({type:'highlight',square,color,width:4});
    }
    if(reveal.type==='circle'){
      const square=String(reveal.value).trim();if(/^[a-h][1-8]$/.test(square))annotations.push({type:'circle',square,color,width:5});
    }
    if(reveal.type==='arrow'){
      const parts=String(reveal.value).match(/[a-h][1-8]/g)||[];
      if(parts.length>=2)annotations.push({type:'arrow',from:parts[0],to:parts[1],color,width:5});
    }
  }
  return {position,annotations,texts,step:applied};
}
export function migrateV9(source){
  if(!source||typeof source!=='object')throw Error('Invalid V9 lesson');
  if(source.version===10)return validateLesson(source);
  if(source.version!==1)throw Error('Only V9 lesson version 1 is supported');
  const lesson=newLesson(source.language);
  lesson.title=cap(source.title||'Imported lesson');
  const chapters=Array.isArray(source.chapters)&&source.chapters.length?source.chapters:[source];
  lesson.scenes=chapters.slice(0,120).map((ch,i)=>{
    const scene=newScene('board-only',i+1);
    scene.title=cap(ch.title||`Scene ${i+1}`);
    scene.notes=cap(ch.notes,12000);
    scene.position=normalizePosition(ch.position||source.position||DEFAULT_FEN);
    // V9 right-click annotations use an unrelated schema; don't guess how to transform them.
    if(Array.isArray(ch.freehand)&&ch.freehand.length)scene.notes += '\n[Imported V9 freehand requires manual recreation]';
    return scene;
  });
  return validateLesson(lesson);
}
