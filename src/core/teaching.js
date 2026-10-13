// Chess geometry for demonstrations. Unlike chess.js these hints don't check for check,
// pins or checkmate; deliberately supports partial positions with no kings.
import { assertSquare, demoPosition } from './position.js';
const files='abcdefgh';
const inside=(x,y)=>x>=0&&x<8&&y>=1&&y<=8;
const key=(x,y)=>files[x]+y;
const sideOf=(piece)=>piece===piece.toUpperCase()?'w':'b';

export function demonstrationMoves(map, from) {
  assertSquare(from);
  const piece=map[from];
  if(!piece)return {moves:[],captures:[]};
  const x=files.indexOf(from[0]),y=Number(from[1]),side=sideOf(piece);
  const moves=[],captures=[];
  const visit=(dx,dy,slide=false)=>{
    let nx=x+dx,ny=y+dy;
    while(inside(nx,ny)){
      const to=key(nx,ny),target=map[to];
      if(target){if(sideOf(target)!==side)captures.push(to);return;}
      moves.push(to);
      if(!slide)return;
      nx+=dx;ny+=dy;
    }
  };
  const kind=piece.toLowerCase();
  if(kind==='p'){
    const dy=side==='w'?1:-1,one=key(x,y+dy);
    if(inside(x,y+dy)&&!map[one]){
      moves.push(one);
      if(y===(side==='w'?2:7)&&!map[key(x,y+2*dy)])moves.push(key(x,y+2*dy));
    }
    for(const dx of [-1,1]){
      if(inside(x+dx,y+dy)){
        const to=key(x+dx,y+dy),target=map[to];
        if(target&&sideOf(target)!==side)captures.push(to);
      }
    }
  }else if(kind==='n'){
    for(const [dx,dy] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]])visit(dx,dy);
  }else if(kind==='k'){
    for(const dx of [-1,0,1])for(const dy of [-1,0,1])if(dx||dy)visit(dx,dy);
  }else{
    const directions=[];
    if('bq'.includes(kind))directions.push([1,1],[-1,1],[1,-1],[-1,-1]);
    if('rq'.includes(kind))directions.push([1,0],[-1,0],[0,1],[0,-1]);
    for(const [dx,dy]of directions)visit(dx,dy,true);
  }
  return {moves,captures};
}

// V8-style examples: empty board, blocked directions, and capture targets.
export function lessonExample(piece='N',example='open',square='d4'){
  const map=demoPosition(piece,square);
  if(example==='open')return map;
  const side=sideOf(piece),own=side==='w'?'P':'p',other=side==='w'?'p':'P';
  const offsets=piece.toLowerCase()==='n'?[[1,2],[-2,1],[-1,-2]]:piece.toLowerCase()==='p'?[[0,1],[1,1],[-1,1]]:[[0,1],[1,1],[-1,0]];
  const direction=piece.toLowerCase()==='p'&&side==='b'?-1:1;
  const x=files.indexOf(square[0]),y=Number(square[1]);
  for(let i=0;i<offsets.length;i++){
    const [dx,rawDy]=offsets[i],dy=piece.toLowerCase()==='p'?rawDy*direction:rawDy;
    const nx=x+dx,ny=y+dy;
    if(!inside(nx,ny))continue;
    if(example==='blockers')map[key(nx,ny)]=own;
    else if(example==='captures' && !(piece.toLowerCase()==='p'&&dx===0))map[key(nx,ny)]=other;
  }
  return map;
}
