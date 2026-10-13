import './v10.css';
import 'cm-chessboard/assets/chessboard.css';
import {fenToMap,mapToFen} from '../core/position.js';
import {newLesson,newScene,copyScene,validateLesson,normalizePosition,frameFor,framesForMoveSequence,migrateV9} from './core.js';
import {createBoard} from './board.js';
import {makeSync,LESSON_KEY} from './sync.js';
import {makeSampleLesson} from './sample.js';
const $=id=>document.getElementById(id);
const dictionaries={
  en:{storyboard:'Scene storyboard',sceneSettings:'Scene settings',lessonTitle:'Lesson title'},
  mn:{storyboard:'Хичээлийн хэсгүүд',sceneSettings:'Хэсгийн тохиргоо',lessonTitle:'Хичээлийн нэр'}
};
let lesson;
try{const raw=localStorage.getItem(LESSON_KEY);lesson=raw?validateLesson(JSON.parse(raw)):newLesson();}catch{lesson=newLesson();}
let index=0,step=0,chosenReveal=-1,placeMode=false,sourceSquare=null,revision=0,syncConnected=false;
let lastSeen=0,teleprompterRunning=false,lastScrollAt=0;
const scene=()=>lesson.scenes[index];
const messages={en:{saved:'● Saved in browser',error:'● Save failed',connected:'● Recording Output connected',waiting:'Output not open',confirm:'Start a new lesson? Unsaved work will be lost unless exported.'},
  mn:{saved:'● Хөтөч дээр хадгалсан',error:'● Хадгалах боломжгүй',connected:'● Бичлэгийн цонх холбогдсон',waiting:'Бичлэгийн цонх нээлтгүй',confirm:'Шинэ хичээл эхлүүлэх үү? Экспортлоогүй өөрчлөлтүүд алдагдана.'}};
const lang=()=>lesson.language==='en'?'en':'mn';
function alertError(e){alert(e?.message||String(e));}
const sync=makeSync(payload=>{
  if(payload?.type==='hello'||payload?.type==='ready'){
    syncConnected=true;lastSeen=Date.now();$('sync-status').textContent=messages[lang()].connected;
    if(payload.type==='hello')sendState();
  }
  if(payload?.type==='request')sendState();
});
const board=createBoard($('studio-board'),{editable:true,onEdit:(annotations,click)=>{
  if(annotations){scene().annotations=annotations;persist();sendState();return;}
  if(!click?.square)return;
  const map=fenToMap(scene().position),square=click.square;
  if(placeMode){const piece=$('piece').value;if(piece==='.')delete map[square];else map[square]=piece;scene().position=normalizePosition(mapToFen(map));refreshVisual();persist();sendState();return;}
  if(sourceSquare){const from=sourceSquare;sourceSquare=null;if(map[from]&&from!==square){map[square]=map[from];delete map[from];scene().position=normalizePosition(mapToFen(map));refreshVisual();persist();sendState();}}
  else sourceSquare=square;
}});
const query=()=>new URL('./v10-output.html',window.location.href).href;
function download(name,data){const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function persist(){lesson.updatedAt=new Date().toISOString();try{localStorage.setItem(LESSON_KEY,JSON.stringify(lesson));$('saved-state').textContent=messages[lang()].saved;$('saved-state').classList.remove('error');}catch{$('saved-state').textContent=messages[lang()].error;$('saved-state').classList.add('error');}}
function payload(){return {type:'state',lessonId:lesson.id,revision:++revision,scene:structuredClone(scene()),step,course:lesson.course,language:lesson.language};}
function sendState(){sync.send(payload());}
function showCounts(){$('scene-counter').textContent=`${index+1} / ${lesson.scenes.length}`;$('reveal-counter').textContent=`Reveal ${step} / ${scene().reveals.length}`;}
function sceneList(){
 const host=$('scene-list');host.replaceChildren();
 lesson.scenes.forEach((s,i)=>{
   const button=document.createElement('button');button.type='button';button.className='scene-card'+(i===index?' selected':'');button.draggable=true;button.dataset.index=i;
   const number=document.createElement('span');number.className='scene-no';number.textContent=String(i+1).padStart(2,'0');
   const copy=document.createElement('span');copy.className='scene-copy';const h=document.createElement('strong');h.textContent=s.title||`Scene ${i+1}`;
   const sub=document.createElement('small');sub.textContent=s.template.replaceAll('-',' ')+' · '+s.reveals.length+' reveals';copy.append(h,sub);
   button.append(number,copy);button.addEventListener('click',()=>goScene(i));
   button.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',String(i)));
   button.addEventListener('dragover',e=>e.preventDefault());
   button.addEventListener('drop',e=>{e.preventDefault();const from=Number(e.dataTransfer.getData('text/plain')),to=i;if(!Number.isInteger(from)||from<0||from>=lesson.scenes.length||from===to)return;
     const [item]=lesson.scenes.splice(from,1);lesson.scenes.splice(to,0,item);index=to;goScene(to);persist();});
   host.append(button);
 });
}
function renderRevealList(){
 const host=$('reveal-list');host.replaceChildren();
 scene().reveals.forEach((r,i)=>{
   const button=document.createElement('button');button.className='reveal-card'+(i===chosenReveal?' active':'');
   button.textContent=`${i+1}. ${r.label||r.type}: ${r.value.slice(0,50)}`;
   button.addEventListener('click',()=>{chosenReveal=i;step=i+1;renderRevealList();renderRevealEditor();refreshVisual();showCounts();sendState();});host.append(button);
 });
}
function renderRevealEditor(){
 const r=scene().reveals[chosenReveal];$('reveal-type').value=r?.type||'highlight';$('reveal-value').value=r?.value||'';$('reveal-label').value=r?.label||'';
 $('update-reveal').disabled=chosenReveal<0;$('remove-reveal').disabled=chosenReveal<0;
}
function renderScene(){
 const s=scene();$('active-scene-title').textContent=s.title||'Untitled scene';$('scene-title').value=s.title;
 $('scene-subtitle').value=s.subtitle;$('scene-chapter').value=s.chapter;$('template').value=s.template;$('fen').value=s.position;
 $('scene-notes').value=s.notes;$('teleprompter-view').textContent=s.notes;
 $('lesson-title').value=lesson.title;$('lesson-course').value=lesson.course;
 $('teleprompter-view').hidden=true;teleprompterRunning=false;
 showCounts();sceneList();renderRevealList();renderRevealEditor();refreshVisual();
}
async function refreshVisual(){
 const view=frameFor(scene(),step);
 await board.setPosition(view.position,false);
 board.setAnnotations(view.annotations);await board.setOrientation(scene().orientation);
 $('fen').value=scene().position;
}
function goScene(i){if(i<0||i>=lesson.scenes.length)return;index=i;step=0;chosenReveal=-1;sourceSquare=null;renderScene();persist();sendState();}
function goReveal(offset){step=Math.min(scene().reveals.length,Math.max(0,step+offset));chosenReveal=step?step-1:-1;showCounts();renderRevealList();renderRevealEditor();refreshVisual();sendState();}
function syncLessonFields(){lesson.title=$('lesson-title').value;lesson.course=$('lesson-course').value;persist();sendState();}
function syncSceneFields(){const s=scene();s.title=$('scene-title').value;s.subtitle=$('scene-subtitle').value;s.chapter=$('scene-chapter').value;s.template=$('template').value;
 $('active-scene-title').textContent=s.title;sceneList();persist();sendState();}
$('lesson-title').addEventListener('input',syncLessonFields);$('lesson-course').addEventListener('input',syncLessonFields);
for(const key of ['scene-title','scene-subtitle','scene-chapter','template'])$(key).addEventListener('input',syncSceneFields);
$('scene-notes').addEventListener('input',()=>{scene().notes=$('scene-notes').value;$('teleprompter-view').textContent=scene().notes;persist();});
$('add-scene').addEventListener('click',()=>{if(lesson.scenes.length>=120)return alert('Maximum 120 scenes');lesson.scenes.push(newScene('board-presenter',lesson.scenes.length+1));goScene(lesson.scenes.length-1);});
$('duplicate-scene').addEventListener('click',()=>{if(lesson.scenes.length>=120)return alert('Maximum 120 scenes');lesson.scenes.splice(index+1,0,copyScene(scene()));goScene(index+1);});
$('delete-scene').addEventListener('click',()=>{if(lesson.scenes.length<=1)return alert('Keep at least one scene');if(!confirm('Delete this scene?'))return;lesson.scenes.splice(index,1);goScene(Math.min(index,lesson.scenes.length-1));});
$('previous-scene').addEventListener('click',()=>goScene(index-1));$('next-scene').addEventListener('click',()=>goScene(index+1));
$('next-reveal').addEventListener('click',()=>goReveal(1));$('previous-reveal').addEventListener('click',()=>goReveal(-1));
$('restart-scene').addEventListener('click',()=>{step=0;chosenReveal=-1;refreshVisual();renderRevealList();renderRevealEditor();showCounts();sendState();});
$('add-reveal').addEventListener('click',()=>{if(scene().reveals.length>=50)return alert('Maximum 50 reveals');
 const reveal={id:crypto.randomUUID(),type:'highlight',label:'Highlight squares',value:'d4'};
 scene().reveals.push(reveal);chosenReveal=scene().reveals.length-1;step=chosenReveal+1;renderRevealList();renderRevealEditor();showCounts();persist();sendState();});
$('update-reveal').addEventListener('click',()=>{if(chosenReveal<0)return;const r=scene().reveals[chosenReveal];r.type=$('reveal-type').value;r.value=$('reveal-value').value;r.label=$('reveal-label').value;
 try{frameFor(scene(),chosenReveal+1)}catch(e){return alertError(e);}renderRevealList();refreshVisual();persist();sendState();});
$('remove-reveal').addEventListener('click',()=>{if(chosenReveal<0)return;scene().reveals.splice(chosenReveal,1);chosenReveal=-1;step=Math.min(step,scene().reveals.length);renderRevealList();renderRevealEditor();refreshVisual();showCounts();persist();sendState();});
$('load-fen').addEventListener('click',()=>{try{scene().position=normalizePosition($('fen').value);step=0;refreshVisual();persist();sendState();}catch(e){alertError(e);}});
$('empty-board').addEventListener('click',()=>{scene().position=normalizePosition('8/8/8/8/8/8/8/8');refreshVisual();persist();sendState();});
$('place-mode').addEventListener('click',()=>{placeMode=!placeMode;sourceSquare=null;$('place-mode').classList.toggle('active',placeMode);$('place-mode').textContent=placeMode?'Placement ON':'Place piece';});
$('flip-board').addEventListener('click',()=>{scene().orientation=scene().orientation==='w'?'b':'w';refreshVisual();persist();sendState();});
$('clear-annotations').addEventListener('click',()=>{scene().annotations=[];board.setAnnotations([]);persist();sendState();});
document.querySelectorAll('[data-draw]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-draw]').forEach(b=>b.classList.toggle('active',b===button));board.setTool(button.dataset.draw);placeMode=false;$('place-mode').classList.remove('active');
}));
$('ink-color').addEventListener('change',()=>board.setPaint($('ink-color').value,$('ink-size').value));
$('ink-size').addEventListener('input',()=>board.setPaint($('ink-color').value,$('ink-size').value));
$('new-lesson').addEventListener('click',()=>{if(!confirm(messages[lang()].confirm))return;lesson=newLesson(lesson.language);goScene(0);});
$('sample-lesson').addEventListener('click',()=>{if(!confirm('Load an eight-scene knight lesson? Export your current lesson first.'))return;lesson=makeSampleLesson();goScene(0);});
$('export-lesson').addEventListener('click',()=>download('chess-classroom-v10-lesson.json',JSON.stringify(lesson,null,2)));
$('import-lesson').addEventListener('click',()=>$('lesson-file').click());
$('lesson-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;
 try{if(file.size>3_000_000)throw Error('Maximum lesson file: 3 MB');const data=JSON.parse(await file.text());lesson=data.version===10?validateLesson(data):migrateV9(data);goScene(0);}catch(e){alertError(e);}event.target.value='';});
$('language-toggle').addEventListener('click',()=>{lesson.language=lesson.language==='en'?'mn':'en';document.documentElement.lang=lang();
 document.querySelectorAll('[data-i18n]').forEach(e=>{const value=dictionaries[lang()][e.dataset.i18n];if(value)e.textContent=value;});persist();sendState();});
$('open-output').addEventListener('click',()=>{window.open(query(),'chess-classroom-v10-recording','width=1440,height=820,resizable=yes');sendState();});
$('play-animation').addEventListener('click',async()=>{
 let action=scene().reveals[step-1];if(!action||action.type!=='move')action=scene().reveals.find(r=>r.type==='move');
 if(!action)return alert('Add a Move reveal step (e.g. d4f5) before animating.');
 try{const i=scene().reveals.indexOf(action);const from=frameFor(scene(),i).position,frames=framesForMoveSequence(from,action.value);
   await board.setPosition(from);sync.send({type:'animate',scene:structuredClone(scene()),frames,step:i+1,course:lesson.course,language:lesson.language});
   for(const fen of frames){await board.setPosition(fen,true);await new Promise(ok=>setTimeout(ok,530));}
   step=i+1;showCounts();refreshVisual();sendState();
 }catch(e){alertError(e);}
});
$('teleprompter').addEventListener('click',()=>{$('teleprompter-view').hidden=!$('teleprompter-view').hidden;});
$('teleprompter-start').addEventListener('click',()=>{teleprompterRunning=true;lastScrollAt=0;requestAnimationFrame(scrollPrompter);});
$('teleprompter-stop').addEventListener('click',()=>teleprompterRunning=false);
function scrollPrompter(time){if(!teleprompterRunning)return;if(lastScrollAt){const dt=Math.min((time-lastScrollAt)/1000,.1);$('teleprompter-view').scrollTop+=dt*Number($('scroll-speed').value)*10;}
 lastScrollAt=time;requestAnimationFrame(scrollPrompter);}
// Do not hijack keyboard input while preparing a script or editing a title.
document.addEventListener('keydown',event=>{
 if(event.target.matches('input,textarea,select,[contenteditable]')||event.ctrlKey||event.metaKey||event.altKey)return;
 if(event.key==='ArrowRight'){event.preventDefault();goScene(index+1);}
 if(event.key==='ArrowLeft'){event.preventDefault();goScene(index-1);}
 if(event.key===' '){event.preventDefault();goReveal(event.shiftKey?-1:1);}
 if(event.key.toLowerCase()==='r'){event.preventDefault();$('restart-scene').click();}
 if(event.key.toLowerCase()==='p'){event.preventDefault();$('play-animation').click();}
});
board.setTool('move');board.setPaint('gold',5);renderScene();sendState();persist();
