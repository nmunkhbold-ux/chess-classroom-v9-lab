/**
 * Lightweight, resolution-independent, editable drawing layer for Chess Classroom.
 * Freehand paths are normalized to a 1000-unit board; flip rotates both the ink and chessboard.
 * Pointer input is enabled only for Pen and Eraser, leaving cm-chessboard free to handle moves.
 */
import { ARROW_TYPE as DRAW_ARROW, MARKER_TYPE as DRAW_MARKER } from 'cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';

const NS = 'http://www.w3.org/2000/svg';
const PALETTE = Object.freeze({success:'#3ba66b',info:'#328dc8',danger:'#e34e55',warning:'#eda735'});
const MAX_STROKES = 250;
const MAX_POINTS = 2500;
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const distance = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const copy = data=>JSON.parse(JSON.stringify(data));
const projectToSegment=(p,a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy;
  const t=denom?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/denom,0,1):0;
  return distance(p,{x:a.x+dx*t,y:a.y+dy*t});
};
const squareCenter=square=>({x:(square.charCodeAt(0)-97)*125+62.5,y:(8-Number(square[1]))*125+62.5});
const strokePath=points=>{
  if(!points.length)return '';
  const first=points[0];
  if(points.length===1)return `M ${first.x} ${first.y} l 0.01 0.01`;
  let path=`M ${first.x} ${first.y}`;
  for(let i=1;i<points.length;i++)path+=` L ${points[i].x} ${points[i].y}`;
  return path;
};
const safeStrokes=value=>(Array.isArray(value)?value:[]).slice(-MAX_STROKES).flatMap(raw=>{
  if(!raw||!Array.isArray(raw.points)||!raw.points.length)return [];
  const points=raw.points.slice(0,MAX_POINTS).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y))
    .map(p=>({x:Math.round(clamp(p.x,0,1000)*10)/10,y:Math.round(clamp(p.y,0,1000)*10)/10}));
  if(!points.length)return [];
  return [{points,width:clamp(Number(raw.width)||7,2,35),color:Object.values(PALETTE).includes(raw.color)?raw.color:PALETTE.success}];
});
function cutStroke(stroke,at,radius){
  const threshold=radius+stroke.width/2;
  const sampled=[stroke.points[0]];
  for(let i=1;i<stroke.points.length;i++){
    const a=stroke.points[i-1],b=stroke.points[i],steps=Math.max(1,Math.ceil(distance(a,b)/3));
    for(let j=1;j<=steps;j++)sampled.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps});
  }
  let removed=false,current=[],pieces=[];
  function finish(){if(current.length){if(current.length===1)current.push({...current[0]});pieces.push({...stroke,points:current});current=[];}}
  for(const p of sampled){
    if(distance(p,at)<=threshold){removed=true;finish();}
    else current.push(p);
  }
  finish();
  return removed?pieces:[stroke];
}

export function installFreehand({board,onChange,getColor,getAnnotations,restoreAnnotations}){
  const host=board.context;
  const layer=document.createElementNS(NS,'svg');
  layer.setAttribute('id','ink-layer');layer.setAttribute('class','ink-layer');
  layer.setAttribute('viewBox','0 0 1000 1000');layer.setAttribute('preserveAspectRatio','none');
  layer.setAttribute('aria-label','Freehand drawing surface');
  const artwork=document.createElementNS(NS,'g');layer.append(artwork);
  const cursor=document.createElementNS(NS,'circle');cursor.classList.add('eraser-preview');
  cursor.setAttribute('visibility','hidden');layer.append(cursor);
  host.append(layer);
  let strokes=[],tool='move',active=null,previous=null;
  const undoStack=[];
  const sizeInput=document.getElementById('brush-size');
  const options=document.getElementById('ink-options');
  const colorInput=document.getElementById('quick-ink-color');
  const hint=document.getElementById('hint-info');
  let width=Number(sizeInput?.value)||6;
  function emit(){onChange?.();}
  function brushRadius(){return 10+width*3;}
  function coord(event){
    const rect=host.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return null;
    let p={x:clamp((event.clientX-rect.left)/rect.width*1000,0,1000),y:clamp((event.clientY-rect.top)/rect.height*1000,0,1000)};
    if(board.getOrientation()==='b')p={x:1000-p.x,y:1000-p.y};
    return {x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10};
  }
  function render(){
    artwork.replaceChildren();
    if(board.getOrientation()==='b')artwork.setAttribute('transform','rotate(180 500 500)');
    else artwork.removeAttribute('transform');
    for(const stroke of strokes){
      const path=document.createElementNS(NS,'path');
      path.classList.add('ink-stroke');path.setAttribute('d',strokePath(stroke.points));
      path.setAttribute('stroke',stroke.color);path.setAttribute('stroke-width',String(stroke.width));
      artwork.append(path);
    }
  }
  function snapshot(){
    undoStack.push({strokes:copy(strokes),annotations:getAnnotations?.()||{arrows:[],markers:[]}});
    if(undoStack.length>30)undoStack.shift();
    const undoButton=document.getElementById('undo-ink');if(undoButton)undoButton.disabled=false;
  }
  function undo(){
    const previousState=undoStack.pop();if(!previousState)return;
    strokes=safeStrokes(previousState.strokes);render();
    restoreAnnotations?.(previousState.annotations);
    const undoButton=document.getElementById('undo-ink');if(undoButton)undoButton.disabled=undoStack.length===0;
    emit();
  }
  function eraseAt(p){
    let changed=false;
    const next=[];
    for(const stroke of strokes){
      const kept=cutStroke(stroke,p,brushRadius());
      if(kept.length!==1||kept[0]!==stroke)changed=true;
      next.push(...kept);
    }
    if(changed)strokes=next.slice(-MAX_STROKES);
    for(const arrow of [...(board.getArrows?.()||[])]){
      if(projectToSegment(p,squareCenter(arrow.from),squareCenter(arrow.to))<=brushRadius()+16){
        board.removeArrows(arrow.type,arrow.from,arrow.to);changed=true;
      }
    }
    const drawingClasses=new Set(Object.values(DRAW_MARKER).map(t=>t.class));
    for(const marker of [...(board.getMarkers?.()||[])]){
      if(drawingClasses.has(marker.type?.class)&&distance(p,squareCenter(marker.square))<=brushRadius()+55){
        board.removeMarkers(marker.type,marker.square);changed=true;
      }
    }
    return changed;
  }
  function pointerDown(e){
    if(e.button!==0 || (tool!=='pen'&&tool!=='erase'))return;
    const p=coord(e);if(!p)return;
    e.preventDefault();e.stopPropagation();
    snapshot();
    active=e.pointerId;previous=p;
    layer.setPointerCapture(e.pointerId);
    if(tool==='pen'){
      strokes.push({points:[p],width:clamp(width*1.65,3,32),color:PALETTE[getColor()]||PALETTE.success});
      if(strokes.length>MAX_STROKES)strokes.shift();
    }else eraseAt(p);
    updateCursor(e,p);render();
  }
  function updateCursor(e,p){
    if(tool!=='erase'||e.pointerType==='touch'){cursor.setAttribute('visibility','hidden');return;}
    cursor.setAttribute('visibility','visible');cursor.setAttribute('cx',String(p.x));cursor.setAttribute('cy',String(p.y));
    cursor.setAttribute('r',String(brushRadius()));
    cursor.setAttribute('transform',board.getOrientation()==='b'?'rotate(180 500 500)':'');
  }
  function pointerMove(e){
    if(tool!=='pen'&&tool!=='erase')return;
    const p=coord(e);if(!p)return;
    if(active===e.pointerId){
      e.preventDefault();
      if(tool==='pen'){
        const stroke=strokes[strokes.length-1];
        if(stroke&&distance(p,previous)>=1.25&&stroke.points.length<MAX_POINTS){stroke.points.push(p);previous=p;render();}
      }else{
        const count=Math.max(1,Math.ceil(distance(previous,p)/Math.max(5,brushRadius()/2)));
        let changed=false;
        for(let i=1;i<=count;i++){
          const q={x:previous.x+(p.x-previous.x)*i/count,y:previous.y+(p.y-previous.y)*i/count};
          changed=eraseAt(q)||changed;
        }
        previous=p;
        if(changed)render();
      }
    }
    updateCursor(e,p);
  }
  function pointerUp(e){
    if(active!==e.pointerId)return;
    e.preventDefault();
    active=null;previous=null;
    if(layer.hasPointerCapture?.(e.pointerId))layer.releasePointerCapture(e.pointerId);
    render();emit();
  }
  layer.addEventListener('pointerdown',pointerDown);
  layer.addEventListener('pointermove',pointerMove);
  layer.addEventListener('pointerup',pointerUp);
  layer.addEventListener('pointercancel',pointerUp);
  layer.addEventListener('pointerleave',()=>{if(active===null)cursor.setAttribute('visibility','hidden');});
  sizeInput?.addEventListener('input',()=>{width=clamp(Number(sizeInput.value)||6,2,20);});
  colorInput?.addEventListener('change',()=>{const main=document.getElementById('annotation-color');if(main)main.value=colorInput.value;emit();});
  function setTool(value){
    tool=value;
    layer.style.pointerEvents=(tool==='pen'||tool==='erase')?'auto':'none';
    layer.style.cursor=tool==='pen'?'crosshair':tool==='erase'?'none':'auto';
    if(options)options.hidden=!(tool==='pen'||tool==='erase');
    if(colorInput)colorInput.hidden=tool==='erase';
    cursor.setAttribute('visibility','hidden');
  }
  function getStrokes(){return copy(strokes);}
  function restoreStrokes(input){strokes=safeStrokes(input);undoStack.length=0;const b=document.getElementById('undo-ink');if(b)b.disabled=true;render();}
  function clear(){strokes=[];render();emit();}
  render();setTool('move');
  return {setTool,getStrokes,restoreStrokes,clear,undo,snapshot,redraw:render};
}
