import './style.css';
import 'cm-chessboard/assets/chessboard.css';
import 'cm-chessboard/assets/extensions/markers/markers.css';
import 'cm-chessboard/assets/extensions/arrows/arrows.css';
import { Chessboard, INPUT_EVENT_TYPE, COLOR, POINTER_EVENTS } from 'cm-chessboard/src/Chessboard.js';
import { RightClickAnnotator } from 'cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';
import { Chess } from 'chess.js';
import { fenToMap, mapToFen, putPiece, freeMove, demoPosition, validateLesson } from './core/position.js';

const $ = (id) => document.getElementById(id);
const base = import.meta.env.BASE_URL;
$('club-logo').src = `${base}club.png`;
$('aum-logo').src = `${base}aum.png`;

const translations = {
  subtitle:'Шатрын сургалтын студи', fullscreen:'Бүтэн дэлгэц · F', interactiveBoard:'ШАТРЫН ИНТЕРАКТИВ САМБАР',
  annotateHelp:'Баруун товчоор дугуйлна · Баруун товчоор чирж сум зурна', undo:'← Буцаах', redo:'Сэргээх →',
  flip:'Самбар эргүүлэх', clearMarks:'Тэмдэглэгээ арилгах', teachingMode:'СУРГАЛТЫН ГОРИМ',
  fullGame:'Бүтэн тоглолт',pieceLesson:'Дүрсний хичээл',boardEditor:'Самбар засварлах',
  gameTools:'ӨРГИЙН УДИРДЛАГА',newGame:'Шинэ өрөг',importPgn:'PGN нээх',savePgn:'PGN хадгалах',
  loadFen:'FEN оруулах', lessonSetup:'ДҮРСНИЙ ЖИШЭЭ',piece:'Дүрс',color:'Өнгө',
  startLesson:'Жишээ эхлүүлэх',emptyBoard:'Хоосон самбар',editorSetup:'САМБАР БЭЛТГЭХ',
  editAction:'Үйлдэл',clearBoard:'Самбар цэвэрлэх',copyToLesson:'Хичээлд ашиглах',
  editorHint:'Дүрс нэмэх, арилгах бол нүдийг дарна. Чөлөөтэй нүүлгэх бол “Нүүх”-ийг сонгоно.',
  lessonNotes:'ХИЧЭЭЛИЙН ТАЙЛБАР',titlePlaceholder:'Хичээлийн гарчиг',notesPlaceholder:'Багшийн тэмдэглэл, ярих зүйл',
  saveLesson:'Хичээл хадгалах',openLesson:'Хичээл нээх',autosave:'Энэ хөтөч дээр өөрчлөлт хадгалагдана. Хичээлийн өмнө JSON нөөц файл татна уу.',
  recording:'БИЧЛЭГ',webcamLeft:'Камер зүүн',webcamRight:'Камер баруун',boardOnly:'Зөвхөн самбар',
  footer:'ТУРШИЛТЫН ХУВИЛБАР · ҮНДСЭН САЙТ БИШ'
};
const modeDescriptions = {
  en: {
    game:'Legal chess with checkmate, castling and PGN. Drag or click pieces to play.',
    lesson:'Move a demonstration piece freely. You can add any blockers in Board Editor.',
    editor:'Add, remove and move pieces anywhere, even when the position is not a legal chess game.'
  },
  mn: {
    game:'Шатар тоглох дүрмийг мөрдөнө. Нүүдэл, сэлгээ, мат, PGN ажиллана.',
    lesson:'Нэг дүрсний нүүдлийг чөлөөтэй үзүүлнэ. Самбар засварлах горимд бусад дүрс нэмнэ.',
    editor:'Дүрмээс үл хамааран хүссэн байрлалаа бүрдүүлж, дүрс чөлөөтэй нүүлгэнэ.'
  }
};
const pieceNames = {p:['Pawn','Хүү'],n:['Knight','Морь'],b:['Bishop','Тэмээ'],r:['Rook','Тэрэг'],q:['Queen','Бэрс'],k:['King','Ноён']};
const styles = ['game','lesson','editor'];
let language = 'en';
let mode = 'game';
let camera = 'none';
let game = new Chess();
let redoStack = [];
let lessonMap = demoPosition();
let editorMap = fenToMap(game.fen());
let timeline = [{...lessonMap}], timeIndex = 0;
let editorTimeline = [{...editorMap}], editorIndex = 0;
const saveKey = 'chess-classroom-v9-lab-01';

const board = new Chessboard($('chessboard'), {
  position: game.fen(),
  assetsUrl: `${base}cm-assets/`,
  style: {cssClass:'default', showCoordinates:true, pieces:{file:'pieces/standard.svg', tileSize:40}, animationDuration:180},
  extensions: [{class:RightClickAnnotator}]
});
board.enableSquareSelect(POINTER_EVENTS.pointerdown, ({square,event}) => {
  if (mode !== 'editor' || $('setup-tool').value === 'move' || !square || event?.button === 2) return;
  const selected = $('setup-tool').value === 'erase' ? null : getPalettePiece();
  applyFreeChange(putPiece(editorMap, square, selected));
});
board.enableMoveInput((event) => {
  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
    if (mode === 'game') {
      const p=game.get(event.squareFrom);
      return Boolean(p && p.color === game.turn());
    }
    if (mode === 'editor' && $('setup-tool').value !== 'move') return false;
    const map=mode === 'editor' ? editorMap : lessonMap;
    return Boolean(map[event.squareFrom]);
  }
  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
    const from = event.squareFrom, to = event.squareTo;
    if (mode === 'game') {
      try {
        const move = game.move({from,to,promotion:'q'});
        if (!move) return false;
        redoStack=[];
        onPositionChanged();
        return true;
      } catch { status(language === 'mn' ? 'Боломжгүй нүүдэл' : 'Illegal move'); return false; }
    }
    if (mode === 'editor') applyFreeChange(freeMove(editorMap, from,to));
    else applyFreeChange(freeMove(lessonMap,from,to));
    return true;
  }
  return undefined;
});

function getPalettePiece() {
  const kind = $('setup-piece').value;
  return $('setup-color').value === 'w' ? kind.toUpperCase() : kind;
}
function positionForMode() {
  return mode === 'game' ? game.fen() : mapToFen(mode==='lesson'?lessonMap:editorMap);
}
function refreshBoard(animate=false) {
  // Keep the authoritative state in Chess.js (game) or the teaching map (lesson/editor).
  requestAnimationFrame(()=>board.setPosition(positionForMode(), animate));
}
function onPositionChanged() {
  renderStatus();
  showGameHistory();
  refreshBoard(true);
  saveLocally();
}
function applyFreeChange(map) {
  if(mode==='editor'){
    editorMap=map;
    editorTimeline=editorTimeline.slice(0,editorIndex+1);
    editorTimeline.push({...map});editorIndex++;
  } else {
    lessonMap=map;
    timeline=timeline.slice(0,timeIndex+1);
    timeline.push({...map});timeIndex++;
  }
  onPositionChanged();
}
function renderStatus() {
  if(mode==='game') {
    let message=game.turn()==='w'?'White to move':'Black to move';
    if(game.isCheckmate()) message=language==='mn'?'Мат': 'Checkmate';
    else if(game.isDraw()) message=language==='mn'?'Тэнцээ':'Draw';
    else if(game.isCheck()) message=language==='mn'?'Шалаа':'Check';
    $('turn-label').textContent=language==='mn'?(game.turn()==='w'?'Цагаан нүүнэ':'Хар нүүнэ'):message;
    status(message);
  }else {
    $('turn-label').textContent=language==='mn'?'Чөлөөт нүүдэл':'Free movement';
    status(language==='mn'?'Самбарт дүрс байрлуулж, нүүлгэж болно':'Set up or move any piece');
  }
  $('mode-help').textContent=modeDescriptions[language][mode];
}
function status(msg){$('status').textContent=msg;}
function showGameHistory(){
  $('game-history').replaceChildren();
  game.history().forEach((san,i)=>{
    const chip=document.createElement('span');chip.className='move';
    chip.textContent=(i%2===0?`${Math.floor(i/2)+1}. `:'')+san;
    $('game-history').append(chip);
  });
  $('fen-input').value=game.fen();
}
function setMode(next){
  if(!styles.includes(next))return;
  mode=next;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
  ['game','lesson','editor'].forEach(x=>$(`${x}-tools`).classList.toggle('hidden',x!==mode));
  renderStatus();showGameHistory();refreshBoard();saveLocally();
}
function localizedOption(select, values){
  for(const option of select.options){
    if(values[option.value])option.textContent=values[option.value][language==='mn'?1:0];
  }
}
function setLanguage(next){
  language=next==='mn'?'mn':'en';
  document.documentElement.lang=language;
  $('language').textContent=language==='mn'?'EN':'МН';
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.dataset.i18n;
    if(language==='mn')el.textContent=translations[key]||el.dataset.enLabel||el.textContent;
    else if(el.dataset.enLabel)el.textContent=el.dataset.enLabel;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key=el.dataset.i18nPlaceholder;
    el.placeholder=language==='mn'?translations[key]:el.dataset.enPlaceholder;
  });
  localizedOption($('lesson-piece'),pieceNames);localizedOption($('setup-piece'),pieceNames);
  const colors={w:['White','Цагаан'],b:['Black','Хар']};
  localizedOption($('lesson-color'),colors);localizedOption($('setup-color'),colors);
  const editOptions={move:['Move pieces','Нүүх'],place:['Place selected piece','Дүрс байрлуулах'],erase:['Remove pieces','Дүрс арилгах']};
  localizedOption($('setup-tool'),editOptions);
  renderStatus();saveLocally();
}
// Save initial English UI labels for reversible translations.
document.querySelectorAll('[data-i18n]').forEach(el=>el.dataset.enLabel=el.textContent);
document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.dataset.enPlaceholder=el.placeholder);

function downloadable(name,content,type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),600);
}
function lessonExport(){
  return {version:1,mode,position:positionForMode(),title:$('lesson-title').value,notes:$('notes').value,
    pgn:game.pgn(),gameFen:game.fen(),lessonFen:mapToFen(lessonMap),editorFen:mapToFen(editorMap),
    language,annotations:board.getAnnotations?.()||{arrows:[],markers:[]}};
}
function saveLocally(){try{localStorage.setItem(saveKey,JSON.stringify(lessonExport()));}catch{}}
function loadLesson(input){
  validateLesson(input);
  if(input.pgn){try{game.loadPgn(input.pgn);}catch{}}
  else if(input.mode==='game'){try{game=new Chess(input.gameFen||input.position);}catch{game=new Chess();}}
  if(input.lessonFen)lessonMap=fenToMap(input.lessonFen);
  if(input.editorFen)editorMap=fenToMap(input.editorFen);
  if(input.mode==='lesson')lessonMap=fenToMap(input.position);
  if(input.mode==='editor')editorMap=fenToMap(input.position);
  timeline=[{...lessonMap}];timeIndex=0;editorTimeline=[{...editorMap}];editorIndex=0;
  $('lesson-title').value=input.title||'';$('notes').value=input.notes||'';
  redoStack=[];
  setMode(input.mode);
  board.setAnnotations?.(input.annotations||{arrows:[],markers:[]});
  setLanguage(input.language||'en');
  onPositionChanged();
}

$('language').addEventListener('click',()=>setLanguage(language==='en'?'mn':'en'));
document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
$('undo').addEventListener('click',()=>{
  if(mode==='game'){
    const move=game.undo();if(move)redoStack.push(move);
  }else if(mode==='lesson'&&timeIndex>0){timeIndex--;lessonMap={...timeline[timeIndex]};}
  else if(mode==='editor'&&editorIndex>0){editorIndex--;editorMap={...editorTimeline[editorIndex]};}
  onPositionChanged();
});
$('redo').addEventListener('click',()=>{
  if(mode==='game'){
    const move=redoStack.pop();if(move)game.move({from:move.from,to:move.to,promotion:move.promotion});
  }else if(mode==='lesson'&&timeIndex<timeline.length-1){timeIndex++;lessonMap={...timeline[timeIndex]};}
  else if(mode==='editor'&&editorIndex<editorTimeline.length-1){editorIndex++;editorMap={...editorTimeline[editorIndex]};}
  onPositionChanged();
});
$('flip').addEventListener('click',()=>{
  board.setOrientation(board.getOrientation()===COLOR.white?COLOR.black:COLOR.white,true);
});
$('clear-arrows').addEventListener('click',()=>{board.removeArrows?.();board.removeMarkers?.();saveLocally();});
$('new-game').addEventListener('click',()=>{if(!confirm(language==='mn'?'Шинэ өрөг эхлүүлэх үү?':'Start a new game?'))return;game=new Chess();redoStack=[];onPositionChanged();});
$('load-fen').addEventListener('click',()=>{try{game=new Chess($('fen-input').value.trim());redoStack=[];onPositionChanged();}catch(e){alert(e.message)}});
$('import-pgn').addEventListener('click',()=>$('pgn-file').click());
$('pgn-file').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{const next=new Chess();next.loadPgn(await f.text());game=next;redoStack=[];onPositionChanged();}
  catch(err){alert(`${language==='mn'?'PGN алдаа':'Invalid PGN'}: ${err.message}`)}
  e.target.value='';
});
$('export-pgn').addEventListener('click',()=>downloadable('chess-classroom-game.pgn',game.pgn(),'text/plain'));
function makeDemo(){
  const kind=$('lesson-piece').value;
  const piece=$('lesson-color').value==='w'?kind.toUpperCase():kind;
  lessonMap=demoPosition(piece, kind==='p'?'d4':'d4');
  timeline=[{...lessonMap}];timeIndex=0;
  setMode('lesson');
}
$('start-lesson').addEventListener('click',makeDemo);
$('empty-lesson').addEventListener('click',()=>{lessonMap={};timeline=[{}];timeIndex=0;onPositionChanged();});
$('empty-editor').addEventListener('click',()=>{editorMap={};editorTimeline=[{}];editorIndex=0;onPositionChanged();});
$('copy-to-lesson').addEventListener('click',()=>{lessonMap={...editorMap};timeline=[{...lessonMap}];timeIndex=0;setMode('lesson')});
$('save-json').addEventListener('click',()=>downloadable('chess-classroom-v9-lesson.json',JSON.stringify(lessonExport(),null,2),'application/json'));
$('open-json').addEventListener('click',()=>$('lesson-file').click());
$('lesson-file').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{loadLesson(JSON.parse(await f.text()));}catch(err){alert(`${language==='mn'?'Файл нээхэд алдаа гарлаа':'Cannot open lesson'}: ${err.message}`)}
  e.target.value='';
});
$('lesson-title').addEventListener('input',saveLocally);$('notes').addEventListener('input',saveLocally);
$('fullscreen').addEventListener('click',()=>document.documentElement.requestFullscreen?.());
for(const el of document.querySelectorAll('[data-camera]')){
  el.addEventListener('click',()=>{
    camera=el.dataset.camera;document.body.classList.remove('camera-left','camera-right');
    if(camera!=='none')document.body.classList.add('camera-'+camera);
    saveLocally();
  });
}
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  if(e.key.toLowerCase()==='f'){
    e.preventDefault();
    if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();
  }
  if(e.key.toLowerCase()==='m'){
    $('teaching-panel').classList.toggle('fullscreen-open');
  }
  if(e.key==='ArrowLeft'){$('undo').click();e.preventDefault();}
  if(e.key==='ArrowRight'){$('redo').click();e.preventDefault();}
});
try{const raw=localStorage.getItem(saveKey);if(raw)loadLesson(JSON.parse(raw));}catch(e){console.warn('Saved lesson could not be restored',e)}
setMode(mode);setLanguage(language);showGameHistory();
