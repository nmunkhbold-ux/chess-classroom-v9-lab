import { Chessboard, COLOR } from 'cm-chessboard/src/Chessboard.js';
import { fenToMap, mapToFen } from '../core/position.js';
import { normalizePosition,validateAnnotation } from './core.js';
import { eraseAt } from './ink.js';
const SVG_NS='http://www.w3.org/2000/svg';
const COLORS={gold:'#ffd072',green:'#6fe0a3',red:'#f07174',blue:'#78caff'};
const sqPoint=(sq,orientation='w')=>{
  const col=sq.charCodeAt(0)-97,row=8-Number(sq[1]);
  return {x:(orientation==='w'?col:7-col)*125+62.5,y:(orientation==='w'?row:7-row)*125+62.5};
};
const svg=(name,attrs={})=>{const e=document.createElementNS(SVG_NS,name);for(const [key,val] of Object.entries(attrs))e.setAttribute(key,String(val));return e;};
export function createBoard(host,{editable=false,onEdit=()=>{}}={}){
  host.classList.add('v10-board-host');
  const board=new Chessboard(host,{position:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1',assetsUrl:`${import.meta.env.BASE_URL}cm-assets/`,style:{cssClass:'default',showCoordinates:true,pieces:{file:'pieces/standard.svg',tileSize:40},animationDuration:380}});
  const overlay=svg('svg',{viewBox:'0 0 1000 1000','class':'v10-draw-overlay'});
  host.append(overlay);
  let orientation='w',tool='move',annotations=[],stroke=null,start=null,color='gold',size=5;
  function resize(){
    const a=host.querySelector('.board .square[data-square="a8"]')?.getBoundingClientRect();
    const h=host.getBoundingClientRect();
    if(!a?.width)return;
    const boardX=orientation==='w'?a.left:host.querySelector('.board .square[data-square="h1"]')?.getBoundingClientRect()?.left||a.left;
    const boardY=orientation==='w'?a.top:host.querySelector('.board .square[data-square="h1"]')?.getBoundingClientRect()?.top||a.top;
    overlay.style.left=`${boardX-h.left}px`;overlay.style.top=`${boardY-h.top}px`;
    overlay.style.width=`${a.width*8}px`;overlay.style.height=`${a.height*8}px`;
  }
  function draw(){
    overlay.replaceChildren();
    for(const raw of annotations){
      const a=validateAnnotation(raw),paint=COLORS[a.color]||COLORS.gold;
      if(a.type==='highlight'){
        const c=sqPoint(a.square,orientation);overlay.append(svg('rect',{x:c.x-62.5,y:c.y-62.5,width:125,height:125,fill:paint,opacity:'.35'}));
      }else if(a.type==='circle'){
        const p=sqPoint(a.square,orientation);overlay.append(svg('circle',{cx:p.x,cy:p.y,r:48,stroke:paint,'stroke-width':a.width+5,fill:'none'}));
      }else if(a.type==='arrow'){
        const p=sqPoint(a.from,orientation),q=sqPoint(a.to,orientation),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1;
        const x=q.x-dx/len*38,y=q.y-dy/len*38;
        overlay.append(svg('line',{x1:p.x,y1:p.y,x2:x,y2:y,stroke:paint,'stroke-width':a.width+8,'stroke-linecap':'round'}));
        const ex=-dy/len*21,ey=dx/len*21,back=dx/len*40,backY=dy/len*40;
        overlay.append(svg('polygon',{points:`${q.x},${q.y} ${q.x-back+ex},${q.y-backY+ey} ${q.x-back-ex},${q.y-backY-ey}`,fill:paint}));
      }else if(a.type==='pen'&&a.points?.length){
        const pts=a.points.map(p=>orientation==='w'?p:{x:1000-p.x,y:1000-p.y});
        overlay.append(svg('polyline',{points:pts.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:paint,'stroke-width':a.width+3,'stroke-linecap':'round','stroke-linejoin':'round'}));
      }
    }
  }
  function squareAt(x,y){const c=Math.floor(x/125),r=Math.floor(y/125);if(c<0||c>7||r<0||r>7)return null;return String.fromCharCode(97+(orientation==='w'?c:7-c))+(orientation==='w'?8-r:r+1);}
  function pointer(event){const rect=overlay.getBoundingClientRect();return {x:Math.max(0,Math.min(1000,(event.clientX-rect.left)/rect.width*1000)),y:Math.max(0,Math.min(1000,(event.clientY-rect.top)/rect.height*1000))};}
  function commit(){draw();onEdit(annotations.map(a=>structuredClone(a)));}
  overlay.addEventListener('pointerdown',e=>{
    if(!editable||tool==='move'||e.button!==0)return;
    e.preventDefault();overlay.setPointerCapture(e.pointerId);
    const p=pointer(e),square=squareAt(p.x,p.y);
    if(tool==='pen'){stroke={type:'pen',color,width:size,points:[orientation==='w'?p:{x:1000-p.x,y:1000-p.y}]};annotations.push(stroke);draw();}
    else if(tool==='circle'){annotations.push({type:'circle',square,color,width:size});commit();}
    else if(tool==='arrow'){start=square;stroke=p;}
    else if(tool==='erase'){start=p;annotations=eraseAt(annotations,p,orientation,60);commit();}
  });
  overlay.addEventListener('pointermove',e=>{
    if(!editable||e.buttons!==1)return;
    const p=pointer(e);
    if(tool==='pen'&&stroke){stroke.points.push(orientation==='w'?p:{x:1000-p.x,y:1000-p.y});if(stroke.points.length>1200)stroke.points.shift();draw();}
    if(tool==='erase'){annotations=eraseAt(annotations,p,orientation,40);draw();}
  });
  overlay.addEventListener('pointerup',e=>{
    if(!editable||tool==='move')return;
    if(tool==='arrow'&&start){const p=pointer(e),to=squareAt(p.x,p.y);if(to&&to!==start)annotations.push({type:'arrow',from:start,to,color,width:size});}
    if(tool==='pen'||tool==='erase'||tool==='arrow')commit();start=null;stroke=null;
  });
  // Piece setup is click-to-select, then click destination, without interfering with drawing.
  host.addEventListener('pointerdown',e=>{
    if(!editable||tool!=='move')return;
    const square=e.target.closest?.('[data-square]')?.getAttribute('data-square');
    if(square)onEdit(null,{square});
  });
  const ro=new ResizeObserver(resize);ro.observe(host);window.addEventListener('resize',resize);
  setTimeout(resize,50);
  return {
    async setPosition(position,animate=false){await board.setPosition(normalizePosition(position),animate);resize();},
    setAnnotations(items){annotations=items.map(a=>structuredClone(a));draw();},
    getAnnotations(){return annotations.map(a=>structuredClone(a));},
    setTool(next){tool=next;overlay.style.pointerEvents=next==='move'?'none':'auto';overlay.style.touchAction=next==='move'?'auto':'none';},
    setPaint(c,w){color=COLORS[c]?c:'gold';size=Math.max(1,Math.min(20,Number(w)||5));},
    async setOrientation(next){orientation=next==='b'?'b':'w';await board.setOrientation(orientation==='w'?COLOR.white:COLOR.black);resize();draw();},
    destroy(){ro.disconnect();window.removeEventListener('resize',resize);board.destroy?.();}
  };
}
