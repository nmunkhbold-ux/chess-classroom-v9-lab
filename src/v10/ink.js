// Non-destructive partial stroke eraser; the chessboard underneath is never affected.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const segmentDistance=(p,a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;
 const t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;
 return distance(p,{x:a.x+dx*t,y:a.y+dy*t});
};
const center=(sq,orientation='w')=>{const col=sq.charCodeAt(0)-97,row=8-Number(sq[1]);return {x:(orientation==='w'?col:7-col)*125+62.5,y:(orientation==='w'?row:7-row)*125+62.5};};
export function eraseAt(annotations,p,orientation='w',radius=42){
 const currentSquare=(()=>{const col=Math.floor(p.x/125),row=Math.floor(p.y/125);if(col<0||col>7||row<0||row>7)return '';return String.fromCharCode(97+(orientation==='w'?col:7-col))+(orientation==='w'?8-row:row+1)})();
 return annotations.flatMap(a=>{
   if(a.type==='pen'){
     const pieces=[];let run=[];
     for(const raw of a.points){
       const pt=orientation==='w'?raw:{x:1000-raw.x,y:1000-raw.y};
       if(distance(pt,p)<radius){if(run.length)pieces.push({...a,points:run});run=[];}
       else run.push(raw);
     }
     if(run.length)pieces.push({...a,points:run});return pieces;
   }
   if(a.type==='arrow')return segmentDistance(p,center(a.from,orientation),center(a.to,orientation))<radius?[]:[a];
   if(a.type==='circle')return Math.abs(distance(p,center(a.square,orientation))-48)<radius?[]:[a];
   if(a.type==='highlight')return a.square===currentSquare?[]:[a];
   return [a];
 });
}
