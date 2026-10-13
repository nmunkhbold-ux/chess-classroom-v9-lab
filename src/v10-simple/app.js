import './style.css';
import 'cm-chessboard/assets/chessboard.css';
import {createBoard} from '../v10/board.js';
import {normalizePosition,DEFAULT_FEN} from '../v10/core.js';
import {fenToMap} from '../core/position.js';
import {demonstrationMoves} from '../core/teaching.js';
import {makeStep,newTeachingLesson,duplicateStep,validateTeachingLesson,stepAfterMove,STORAGE_KEY,MAX_STEPS} from './logic.js';
const $=id=>document.getElementById(id);
const copy=x=>JSON.parse(JSON.stringify(x));
const translations={
 en:{lesson:'Lesson steps',help:'Help',fullscreen:'Fullscreen',hint:'Click a piece, then where to move it. Use shortcuts to draw.',camera:'Teacher camera area — add your camera in OBS',move:'Move',arrow:'Arrow',circle:'Circle',draw:'Draw',erase:'Erase',setup:'Teaching setup',lessonName:'Lesson name',steps:'Saved steps',saveStep:'Save new step',stepName:'Current step title',duplicate:'Duplicate',delete:'Delete step',position:'Board setup',start:'Starting position',empty:'Empty board',piece:'Choose piece to place',place:'Piece placement',drawing:'Drawing options',color:'Color',size:'Size',clearInk:'Clear annotations',files:'Lesson backup',export:'Export JSON',import:'Import JSON',saveNote:'Everything saves automatically in this browser. Export a JSON backup before clearing browser data.',shortcuts:'Keyboard shortcuts',recordNotice:'OBS captures this same window. Press H to hide the toolbar. Add your camera over the clear right-hand area in OBS.',gotIt:'Got it',saved:'● Saved locally',saveFail:'● Unable to save locally',free:'Free Teaching',kicker:'CHESS LESSON',max:'Maximum 80 steps per lesson.',remove:'Delete this saved step?',importFail:'Could not import lesson: ',placementOn:'Piece placement: ON',placementOff:'Piece placement: OFF',step:'Step'},
 mn:{lesson:'Хичээлийн алхмууд',help:'Тусламж',fullscreen:'Дэлгэц дүүргэх',hint:'Нүүх дүрсээ сонгоод очих нүдийг дарна уу. Зурахдаа товчлол ашиглана.',camera:'Багшийн дүрс байрлах зай — OBS дээр камераа нэмнэ',move:'Нүүх',arrow:'Сум',circle:'Дугуй',draw:'Зурах',erase:'Баллуур',setup:'Хичээлийн тохиргоо',lessonName:'Хичээлийн нэр',steps:'Хадгалсан алхмууд',saveStep:'Алхам хадгалах',stepName:'Алхмын нэр',duplicate:'Хувилах',delete:'Алхам устгах',position:'Өрөг засах',start:'Эхний өрөг',empty:'Хоосон хөлөг',piece:'Байрлуулах дүрс',place:'Дүрс байрлуулах',drawing:'Зурах тохиргоо',color:'Өнгө',size:'Хэмжээ',clearInk:'Зургийг арилгах',files:'Хичээл хадгалах',export:'JSON татах',import:'JSON оруулах',saveNote:'Хичээл энэ хөтөч дээр автоматаар хадгалагдана. Хөтчийн мэдээллээ цэвэрлэхээс өмнө JSON татаж хадгална уу.',shortcuts:'Гарын товчлолууд',recordNotice:'OBS энэ нэг цонхыг бичнэ. H товчоор удирдлагыг нууна. Багшийн камерыг баруун талын хоосон хэсэгт OBS-оор байрлуулна.',gotIt:'Ойлголоо',saved:'● Хадгалсан',saveFail:'● Хадгалах боломжгүй',free:'Чөлөөт хичээл',kicker:'ШАТРЫН ХИЧЭЭЛ',max:'Хичээл дээд тал нь 80 алхамтай.',remove:'Энэ алхмыг устгах уу?',importFail:'Хичээлийг нээж чадсангүй: ',placementOn:'Дүрс байрлуулах: АСААЛТТАЙ',placementOff:'Дүрс байрлуулах: УНТРААЛТТАЙ',step:'Алхам'}
};
let lesson;
try {lesson=validateTeachingLesson(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));} catch {lesson=newTeachingLesson('mn');}
let activeTool='move',sourceSquare=null,showHints=false,placeMode=false,controlsVisible=true;
let undoStack=[],redoStack=[],revision=0;
const current=()=>lesson.steps[lesson.active];
const t=k=>translations[lesson.language]?.[k]||translations.en[k]||k;
function persist(){try {localStorage.setItem(STORAGE_KEY,JSON.stringify(lesson));$('save-badge').textContent=t('saved');$('save-badge').classList.remove('error');}catch {$('save-badge').textContent=t('saveFail');$('save-badge').classList.add('error');}}
function pushUndo(){undoStack.push({index:lesson.active,step:copy(current())});if(undoStack.length>100)undoStack.shift();redoStack=[];}
function snapshot(){return {index:lesson.active,step:copy(current())};}
function restore(which){const from=which==='undo'?undoStack:redoStack;const to=which==='undo'?redoStack:undoStack;if(!from.length)return;const prior=from.pop();to.push(snapshot());lesson.active=prior.index;lesson.steps[prior.index]=prior.step;sourceSquare=null;showHints=false;render();persist();}
function hintsAnnotations(){if(!showHints||!sourceSquare)return [];
 const map=fenToMap(current().position),legal=demonstrationMoves(map,sourceSquare);
 return [...legal.moves.map(square=>({type:'highlight',square,color:'green',width:4})),...legal.captures.map(square=>({type:'highlight',square,color:'red',width:5}))];
}
const board=createBoard($('teaching-board'),{editable:true,onEdit:(annotations,click)=>{
 if(annotations){pushUndo();current().annotations=annotations;persist();return;}
 if(!click?.square)return;
 const target=click.square;
 if(placeMode){pushUndo();lesson.steps[lesson.active]=stepAfterMove(current(),null,target,$('piece-selector').value);sourceSquare=null;showHints=false;renderBoard();persist();return;}
 const map=fenToMap(current().position);
 if(sourceSquare&&sourceSquare!==target){pushUndo();lesson.steps[lesson.active]=stepAfterMove(current(),sourceSquare,target);sourceSquare=null;showHints=false;renderBoard();persist();return;}
 if(sourceSquare===target){sourceSquare=null;showHints=false;board.setAnnotations(current().annotations);return;}
 sourceSquare=map[target]?target:null;
 if(sourceSquare)showHints=true;
 board.setAnnotations([...current().annotations,...hintsAnnotations()]);
 }});
async function renderBoard(){const change=++revision;const s=current();await board.setOrientation(s.orientation);if(change!==revision)return;await board.setPosition(s.position,false);if(change!==revision)return;board.setAnnotations([...s.annotations,...hintsAnnotations()]);}
function renderSteps(){const host=$('saved-steps');host.replaceChildren();lesson.steps.forEach((s,i)=>{
 const btn=document.createElement('button');btn.className='saved-step'+(i===lesson.active?' selected':'');btn.setAttribute('aria-current',i===lesson.active?'step':'false');
 const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.textContent=s.title||`${t('step')} ${i+1}`;btn.append(number,name);
 btn.addEventListener('click',()=>navigate(i));host.append(btn);
 });}
function render(){const s=current();$('topic-title').textContent=s.title||lesson.title;$('lesson-kicker').textContent=t('kicker');$('step-count').textContent=`${String(lesson.active+1).padStart(2,'0')} / ${String(lesson.steps.length).padStart(2,'0')}`;$('lesson-name').value=lesson.title;$('step-name').value=s.title;
 $('prev-step').disabled=lesson.active===0;$('next-step').disabled=lesson.active===lesson.steps.length-1;$('remove-step').disabled=lesson.steps.length===1;renderSteps();renderBoard();}
function navigate(idx){if(idx<0||idx>=lesson.steps.length)return;lesson.active=idx;sourceSquare=null;showHints=false;undoStack=[];redoStack=[];persist();render();}
function setTool(tool){if(!['move','arrow','circle','pen','erase'].includes(tool))return;activeTool=tool;sourceSquare=null;showHints=false;placeMode=false;board.setTool(tool);board.setAnnotations(current().annotations);document.querySelectorAll('[data-tool]').forEach(el=>el.classList.toggle('active',el.dataset.tool===tool));updatePlacement();}
function updatePlacement(){$('place-mode').textContent=placeMode?t('placementOn'):t('placementOff');$('place-mode').setAttribute('aria-pressed',String(placeMode));$('place-mode').classList.toggle('selected',placeMode);}
function changePosition(pos){pushUndo();current().position=normalizePosition(pos);current().annotations=[];sourceSquare=null;showHints=false;renderBoard();persist();}
function translate(){document.documentElement.lang=lesson.language;document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});$('locale').textContent=lesson.language==='en'?'EN / МН':'EN / МН';$('guidance').textContent=t('hint');$('save-badge').textContent=t('saved');updatePlacement();render();}
function togglePanel(force){const panel=$('setup-panel');const next=typeof force==='boolean'?force:panel.hidden;panel.hidden=!next;$('steps-toggle').setAttribute('aria-expanded',String(next));if(next)renderSteps();}
function toggleControls(force){controlsVisible=typeof force==='boolean'?force:!controlsVisible;$('simple-app').classList.toggle('controls-hidden',!controlsVisible);$('hide-ui').setAttribute('aria-pressed',String(!controlsVisible));}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(error){alert(error.message);}}
function addStep(duplicate=false){if(lesson.steps.length>=MAX_STEPS){alert(t('max'));return;}const s=duplicate?duplicateStep(current()):makeStep(`${t('step')} ${lesson.steps.length+1}`,current().position);s.orientation=current().orientation;s.annotations=copy(current().annotations);lesson.steps.splice(lesson.active+1,0,s);navigate(lesson.active+1);}
function download(){const json=JSON.stringify({...lesson,active:lesson.active},null,2);const blob=new Blob([json],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`chess-lesson-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function shortcuts(){const shortcuts=[['F','Fullscreen'],['M',t('move')],['A',t('arrow')],['C',t('circle')],['D',t('draw')],['E',t('erase')],['U','Undo'],['Shift + U','Redo'],['B','Flip board'],['H','Show / hide controls'],['Space','Possible moves'],['← / →','Saved teaching steps'],['S','Save new step'],['P',t('setup')],['?','Keyboard shortcuts']];const host=$('shortcut-list');host.replaceChildren();for(const [key,name] of shortcuts){const row=document.createElement('div'),kbd=document.createElement('kbd'),txt=document.createElement('span');row.className='shortcut-row';kbd.textContent=key;txt.textContent=name;row.append(kbd,txt);host.append(row);}}
for(const el of document.querySelectorAll('[data-tool]'))el.addEventListener('click',()=>setTool(el.dataset.tool));
$('undo').addEventListener('click',()=>restore('undo'));
$('redo').addEventListener('click',()=>restore('redo'));
$('flip').addEventListener('click',async()=>{pushUndo();current().orientation=current().orientation==='w'?'b':'w';await renderBoard();persist();});
$('hints').addEventListener('click',()=>{if(activeTool!=='move')setTool('move');showHints=!showHints;board.setAnnotations([...current().annotations,...hintsAnnotations()]);$('hints').classList.toggle('selected',showHints);});
$('prev-step').addEventListener('click',()=>navigate(lesson.active-1));$('next-step').addEventListener('click',()=>navigate(lesson.active+1));
$('tools-toggle').addEventListener('click',()=>togglePanel());$('steps-toggle').addEventListener('click',()=>togglePanel());$('close-panel').addEventListener('click',()=>togglePanel(false));
$('hide-ui').addEventListener('click',()=>toggleControls(false));$('restore-controls').addEventListener('click',()=>toggleControls(true));
$('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>{$('fullscreen').classList.toggle('is-fullscreen',!!document.fullscreenElement);});
$('locale').addEventListener('click',()=>{lesson.language=lesson.language==='mn'?'en':'mn';persist();translate();});
$('new-step').addEventListener('click',()=>addStep(false));$('duplicate-step').addEventListener('click',()=>addStep(true));
$('remove-step').addEventListener('click',()=>{if(lesson.steps.length===1)return;if(!confirm(t('remove')))return;lesson.steps.splice(lesson.active,1);navigate(Math.min(lesson.active,lesson.steps.length-1));});
$('lesson-name').addEventListener('input',e=>{lesson.title=e.target.value.slice(0,120);persist();});
$('step-name').addEventListener('input',e=>{current().title=e.target.value.slice(0,120);$('topic-title').textContent=current().title;renderSteps();persist();});
$('start-position').addEventListener('click',()=>changePosition(DEFAULT_FEN));$('empty-position').addEventListener('click',()=>changePosition('8/8/8/8/8/8/8/8 w - - 0 1'));
$('place-mode').addEventListener('click',()=>{setTool('move');placeMode=!placeMode;updatePlacement();});
$('ink-color').addEventListener('change',()=>board.setPaint($('ink-color').value,$('ink-width').value));$('ink-width').addEventListener('input',()=>board.setPaint($('ink-color').value,$('ink-width').value));
$('clear-ink').addEventListener('click',()=>{if(!current().annotations.length)return;pushUndo();current().annotations=[];board.setAnnotations([]);persist();});
$('export').addEventListener('click',download);$('import').addEventListener('click',()=>$('file-input').click());
$('file-input').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2_000_000)throw Error('File too large');const data=validateTeachingLesson(JSON.parse(await file.text()));lesson=data;sourceSquare=null;undoStack=[];redoStack=[];setTool('move');translate();persist();render();}catch(error){alert(t('importFail')+error.message);}finally{e.target.value='';}});
$('help').addEventListener('click',()=>{shortcuts();$('shortcuts-dialog').showModal();});$('close-help').addEventListener('click',()=>$('shortcuts-dialog').close());
document.addEventListener('keydown',e=>{
 const target=e.target;
 if(target instanceof HTMLElement&&(target.closest('input,textarea,select,[contenteditable="true"]')))return;
 if($('shortcuts-dialog').open){if(e.key==='Escape')$('shortcuts-dialog').close();return;}
 if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
 const key=e.key.toLowerCase();const map={m:'move',a:'arrow',c:'circle',d:'pen',e:'erase'};
 if(map[key])setTool(map[key]);
 else if(key==='f')fullscreen();else if(key==='h')toggleControls();else if(key==='b')$('flip').click();
 else if(key==='u')restore(e.shiftKey?'redo':'undo');else if(key==='arrowleft'){e.preventDefault();navigate(lesson.active-1);}else if(key==='arrowright'){e.preventDefault();navigate(lesson.active+1);}
 else if(key==='s')addStep();else if(key==='p')togglePanel();else if(key===' '){e.preventDefault();$('hints').click();}
 else if(key==='?'||(key==='/'&&e.shiftKey))$('help').click();
});
window.addEventListener('beforeunload',persist);
board.setTool('move');board.setPaint('gold',5);translate();persist();
