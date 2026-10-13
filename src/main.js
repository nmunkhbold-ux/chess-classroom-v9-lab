import './style.css';
import 'cm-chessboard/assets/chessboard.css';
import 'cm-chessboard/assets/extensions/markers/markers.css';
import 'cm-chessboard/assets/extensions/arrows/arrows.css';
import { Chessboard, INPUT_EVENT_TYPE, COLOR, POINTER_EVENTS } from 'cm-chessboard/src/Chessboard.js';
import { RightClickAnnotator, ARROW_TYPE as DRAW_ARROW, MARKER_TYPE as DRAW_MARKER } from 'cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';
import { Markers, MARKER_TYPE } from 'cm-chessboard/src/extensions/markers/Markers.js';
import { Chess } from 'chess.js';
import { installFreehand } from './freehand.js';
import { fenToMap, mapToFen, putPiece, freeMove, demoPosition, validateLesson } from './core/position.js';
import { demonstrationMoves, lessonExample } from './core/teaching.js';

const $ = (id) => document.getElementById(id);
const base = import.meta.env.BASE_URL;
document.querySelectorAll('img[alt="Chess club logo"]').forEach(img => { img.src = `${base}club.png`; });
document.querySelectorAll('img[alt="AUM logo"]').forEach(img => { img.src = `${base}aum.png`; });

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
  boardTools:'САМБАРЫН ХЭРЭГСЛҮҮД', moveTool:'♙ Нүүх',arrowTool:'➤ Сум',circleTool:'◯ Дугуй',penTool:'✎ Чөлөөт зураг',eraseTool:'⌫ Арилгах',showMoves:'Нүүдэл харуулах',
  firstMove:'|◀ Эхэнд',previousMove:'◀ Өмнөх',nextMove:'Дараах ▶',lastMove:'Сүүлд ▶|',
  examplePositions:'ЖИШЭЭ БАЙРЛАЛУУД',openExample:'Хоосон',blockersExample:'Саад',capturesExample:'Дүрс идэх',
  lessonPlacement:'ХИЧЭЭЛИЙН САМБАРТ ДҮРС НЭМЭХ',lessonAction:'Үйлдэл',blockerPiece:'Байрлуулах дүрс',
  lessonMovesHelp:'Дүрсийг сонгоод боломжтой нүүдлийг харна. Самбарт өөрийн болон эсрэг талын дүрс нэмж болно.',
  lessonChapters:'ХИЧЭЭЛИЙН СЛАЙДУУД',chapterInfo:'Байрлал, тайлбарыг хадгалж, хичээлийн явцад слайд хооронд шилжинэ.',
  addSlide:'+ Слайд хадгалах',deleteSlide:'Сонгосныг устгах',previousSlide:'◀ Өмнөх слайд',nextSlide:'Дараах слайд ▶',
  studioEyebrow:'ШАТРЫН СУРГАЛТЫН СТУДИ · V9 LAB',previewBadge:'Туршилтын хувилбар',
  playLabel:'Өрөг',teachLabel:'Заах',setupLabel:'Засах',moveHistory:'Нүүдлүүд',
  advancedLabel:'Нэмэлт хэрэгслүүд',gameFiles:'ӨРГИЙН ФАЙЛУУД',lessonFiles:'ХИЧЭЭЛИЙН ФАЙЛУУД',
  annotationColorLabel:'ТЭМДЭГЛЭГЭЭНИЙ ӨНГӨ',recordingHelp:'F — бүтэн дэлгэц · M — хэрэгслүүдийг харуулах/нуух',
  toolsLabel:'Хэрэгслүүд',teachHint:'Самбарын дүрсийг сонгоход боломжит нүүдлүүд харагдана.',
  footer:'V9 LAB · ТУРШИЛТЫН ХУВИЛБАР'
};
const modeDescriptions = {
  en: {
    game:'Play a game or step through the moves.',
    lesson:'Demonstrate moves, blockers and captures.',
    editor:'Build any position for your next lesson.'
  },
  mn: {
    game:'Өрөг тоглох эсвэл нүүдлүүдийг тайлбарлах.',
    lesson:'Нүүдэл, саад, дүрс идэхийг үзүүлэх.',
    editor:'Хичээлд ашиглах байрлалаа бэлтгэх.'
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
let showMoveHints = true, hintSource = null, annotationTool = 'move', annotationStart = null;
let chapterSlides = [], selectedSlide = -1;
const HINT_TYPES=[MARKER_TYPE.framePrimary,MARKER_TYPE.dot,MARKER_TYPE.circleDangerFilled];
const saveAnnotationType=type=>({class:type.class,...(type.slice?{slice:type.slice}:{}),...(type.position?{position:type.position}:{})});
const saveKey = 'chess-classroom-v9-lab-01';

const board = new Chessboard($('chessboard'), {
  position: game.fen(),
  assetsUrl: `${base}cm-assets/`,
  style: {cssClass:'default', showCoordinates:true, pieces:{file:'pieces/standard.svg', tileSize:40}, animationDuration:180},
  extensions: [{class:Markers,props:{autoMarkers:null}}, {class:RightClickAnnotator}]
});
const ink=installFreehand({board, onChange:()=>saveLocally(), getColor:()=>$('annotation-color').value,
  getAnnotations:()=>persistentAnnotations(),
  restoreAnnotations:annotations=>{board.setAnnotations?.(hydrateAnnotations(annotations));showHintsForSelection();}});
// Direct pointer selection is reserved for annotations and setup modes.
// Normal moves and their hints must be handled by cm-chessboard's own
// move-input state machine, not a competing square-select event handler.
board.context.addEventListener('pointerdown', event => {
  if(event.button !== 0) return;
  const square=event.target.closest?.('[data-square]')?.getAttribute('data-square');
  if(!square) return;
  // Hint selection is visual-only; move validation remains in cm-chessboard.
  if(annotationTool==='move' && !(mode==='editor' && $('setup-tool').value!=='move') && !(mode==='lesson' && $('lesson-tool').value!=='move')){
    const piece=mode==='game'?game.get(square):(mode==='editor'?editorMap:lessonMap)[square];
    if(piece && (mode!=='game' || piece.color===game.turn())){
      hintSource=square;
      showHintsForSelection();
    }
    return;
  }
  if(annotationTool!=='move'){
    handleAnnotationSquare(square);
    return;
  }
  if(mode==='editor' && $('setup-tool').value!=='move'){
    const action=$('setup-tool').value;
    applyFreeChange(putPiece(editorMap,square,action==='erase'?null:getPalettePiece()));
  }else if(mode==='lesson' && $('lesson-tool').value!=='move'){
    const action=$('lesson-tool').value;
    const own=$('lesson-color').value;
    const color=action==='own'?own:own==='w'?'b':'w';
    const kind=$('lesson-blocker-piece').value;
    applyFreeChange(putPiece(lessonMap,square,action==='erase'?null:color==='w'?kind.toUpperCase():kind));
  }
});
board.enableMoveInput((event) => {
  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
    if(annotationTool!=='move')return false;
    if (mode === 'editor' && $('setup-tool').value !== 'move') return false;
    if (mode === 'lesson' && $('lesson-tool').value !== 'move') return false;
    const movable=mode==='game'
      ? Boolean(game.get(event.squareFrom) && game.get(event.squareFrom).color===game.turn())
      : Boolean((mode==='editor'?editorMap:lessonMap)[event.squareFrom]);
    if(movable){hintSource=event.squareFrom;showHintsForSelection();}
    return movable;
  }
  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
    if(annotationTool!=='move')return false;
    const from = event.squareFrom, to = event.squareTo;
    if (mode === 'game') {
      try {
        const move = game.move({from,to,promotion:'q'});
        if (!move) return false;
        redoStack=[];
        // Let cm-chessboard finish its move before synchronizing the board.
        return true;
      } catch { status(language === 'mn' ? 'Боломжгүй нүүдэл' : 'Illegal move'); return false; }
    }
    if (mode === 'lesson') {
      const geometry=demonstrationMoves(lessonMap,from);
      if(![...geometry.moves,...geometry.captures].includes(to)){
        status(language==='mn'?'Энэ дүрс ингэж нүүхгүй':'This piece cannot move there');
        return false;
      }
    }
    applyFreeChange(mode==='editor'?freeMove(editorMap,from,to):freeMove(lessonMap,from,to),false);
    return true;
  }
  if(event.type===INPUT_EVENT_TYPE.moveInputFinished){
    // cm-chessboard also reports unfinished selection/cancel events here.
    // Only an actual accepted move should reset position and hints.
    if(event.legalMove)onPositionChanged();
  }
  return undefined;
});

function forgetHints(){HINT_TYPES.forEach(t=>board.removeMarkers(t));}
function showHintsForSelection(){
  forgetHints();
  if(!showMoveHints||annotationTool!=='move'||!hintSource){$('hint-info').textContent='';return;}
  let moves=[],captures=[];
  if(mode==='game'){
    const p=game.get(hintSource);
    if(!p||p.color!==game.turn()){hintSource=null;return;}
    for(const m of game.moves({square:hintSource,verbose:true})){
      if(m.isCapture?.()||m.isEnPassant?.())captures.push(m.to);
      else moves.push(m.to);
    }
  }else{
    const m=mode==='editor'?editorMap:lessonMap;
    if(!m[hintSource]){hintSource=null;return;}
    ({moves,captures}=demonstrationMoves(m,hintSource));
  }
  board.addMarker(MARKER_TYPE.framePrimary,hintSource);
  for(const to of new Set(moves))board.addMarker(MARKER_TYPE.dot,to);
  for(const to of new Set(captures))board.addMarker(MARKER_TYPE.circleDangerFilled,to);
  $('hint-info').textContent=(language==='mn'?`${hintSource}: ${moves.length} нүүдэл, ${captures.length} идэх боломж`: `${hintSource}: ${moves.length} destinations, ${captures.length} captures`);
}
function selectHintSource(square){
  hintSource=square===hintSource?null:square;
  showHintsForSelection();
}
function changeAnnotationTool(tool){
  board.cancelMoveInput();
  annotationTool=['move','arrow','circle','pen','erase'].includes(tool)?tool:'move';
  ink.setTool(annotationTool);
  annotationStart=null;
  document.querySelectorAll('[data-annotation-tool]').forEach(b=>b.classList.toggle('selected',b.dataset.annotationTool===annotationTool));
  showHintsForSelection();
  $('hint-info').textContent=annotationTool==='arrow'?(language==='mn'?'Сум зурах эхний нүдийг дарна уу':'Click the arrow starting square'):
    annotationTool==='circle'?(language==='mn'?'Дугуйлах нүдийг дарна уу':'Click a square to circle it'):
    annotationTool==='pen'?(language==='mn'?'Хулгана эсвэл үзгээр самбар дээр чөлөөтэй зурна уу':'Drag to draw freely on the board'):
    annotationTool==='erase'?(language==='mn'?'Тэмдэглэгээг арилгахын тулд чирнэ үү':'Drag over markings to erase'):$('hint-info').textContent;
}
function handleAnnotationSquare(square){
  const kind=$('annotation-color').value;
  if(annotationTool==='arrow'){
    if(!annotationStart){annotationStart=square;$('hint-info').textContent=(language==='mn'?'Сумны төгсгөлийг сонгоно уу: ':'Select arrow destination: ')+square;return;}
    if(square!==annotationStart){
      ink.snapshot();
      const type=DRAW_ARROW[kind];
      const exists=board.getArrows(type,annotationStart,square).length>0;
      if(exists)board.removeArrows(type,annotationStart,square);
      else board.addArrow(type,annotationStart,square);
    }
    annotationStart=null;
    $('hint-info').textContent=language==='mn'?'Дараагийн сумны эхлэлийг сонгоно уу':'Click to start another arrow';
  }else if(annotationTool==='circle'){
    ink.snapshot();
    const type=DRAW_MARKER[kind];
    if(board.getMarkers(type,square).length)board.removeMarkers(type,square);
    else board.addMarker(type,square);
  }else if(annotationTool==='erase'){
    // Remove only annotations on or connected to this square, leaving unrelated markings intact.
    for(const a of board.getArrows())if(a.from===square||a.to===square)board.removeArrows(a.type,a.from,a.to);
    for(const m of board.getMarkers())if(m.square===square)board.removeMarkers(m.type,square);
  }
  saveLocally();
}
function changeHintPreference(enabled){showMoveHints=Boolean(enabled);$('show-moves').checked=showMoveHints;showHintsForSelection();saveLocally();}
function hydrateAnnotations(annotations){
  // cm-chessboard compares some marker/arrow types by reference identity.
  // Restore canonical type objects after JSON/localStorage deserialization.
  const a=annotations||{arrows:[],markers:[]};
  const arrowTypes=Object.values(DRAW_ARROW);
  const markerTypes=[...Object.values(DRAW_MARKER),...Object.values(MARKER_TYPE)];
  return {
    arrows:(Array.isArray(a.arrows)?a.arrows:[]).filter(x=>x&&/^[a-h][1-8]$/.test(x.from)&&/^[a-h][1-8]$/.test(x.to))
      .map(x=>({...x,type:arrowTypes.find(t=>t.class===x.type?.class)||DRAW_ARROW.success})),
    markers:(Array.isArray(a.markers)?a.markers:[]).filter(x=>x&&/^[a-h][1-8]$/.test(x.square))
      .map(x=>({...x,type:markerTypes.find(t=>t.class===x.type?.class)||DRAW_MARKER.success}))
  };
}
function persistentAnnotations(){
  const a=board.getAnnotations?.()||{arrows:[],markers:[]};
  return {arrows:a.arrows.map(x=>({from:x.from,to:x.to,type:saveAnnotationType(x.type)})),
    markers:a.markers.filter(x=>!HINT_TYPES.some(t=>t.class===x.type?.class)).map(x=>({square:x.square,type:saveAnnotationType(x.type)}))};
}

function getPalettePiece() {
  const kind = $('setup-piece').value;
  return $('setup-color').value === 'w' ? kind.toUpperCase() : kind;
}
function positionForMode() {
  return mode === 'game' ? game.fen() : mapToFen(mode==='lesson'?lessonMap:editorMap);
}
function refreshBoard() {
  // Synchronize immediately. Queuing requestAnimationFrame writes here can
  // overwrite a newer position after a mode switch or a quick lesson edit.
  board.setPosition(positionForMode(), false);
  showHintsForSelection();
}
function onPositionChanged() {
  hintSource=null;
  renderStatus();
  showGameHistory();
  refreshBoard();
  saveLocally();
}
function applyFreeChange(map,refresh=true) {
  if(mode==='editor'){
    editorMap=map;
    editorTimeline=editorTimeline.slice(0,editorIndex+1);
    editorTimeline.push({...map});editorIndex++;
  } else {
    lessonMap=map;
    timeline=timeline.slice(0,timeIndex+1);
    timeline.push({...map});timeIndex++;
  }
  if(refresh)onPositionChanged();
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
  const played=game.history();
  const future=redoStack.slice().reverse();
  const full=[...played,...future.map(m=>m.san||`${m.from}-${m.to}`)];
  full.forEach((san,i)=>{
    const chip=document.createElement('button');chip.className='move';
    if(i===played.length-1)chip.classList.add('current');
    if(i>=played.length)chip.classList.add('future');
    chip.textContent=(i%2===0?`${Math.floor(i/2)+1}. `:'')+san;
    chip.title=language==='mn'?'Энэ нүүдэл рүү шилжих':'Go to this move';
    chip.addEventListener('click',()=>jumpToGamePly(i+1));
    $('game-history').append(chip);
  });
  const current=played.length,total=full.length;
  $('game-start').disabled=current===0;$('game-prev').disabled=current===0;
  $('game-next').disabled=current===total;$('game-end').disabled=current===total;
  $('fen-input').value=game.fen();
}
function jumpToGamePly(target){
  let current=game.history().length;
  const total=current+redoStack.length;
  target=Math.max(0,Math.min(total,target));
  while(current>target){const m=game.undo();if(m)redoStack.push(m);current--;}
  while(current<target){const m=redoStack.pop();if(!m)break;game.move({from:m.from,to:m.to,promotion:m.promotion});current++;}
  onPositionChanged();
}
function setMode(next){
  if(!styles.includes(next))return;
  board.cancelMoveInput();
  mode=next;
  document.querySelectorAll('button[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
  ['game','lesson','editor'].forEach(x=>$(`${x}-tools`).classList.toggle('hidden',x!==mode));
  document.body.dataset.mode=mode;
  document.querySelectorAll('[data-for-mode]').forEach(el=>{el.hidden=el.dataset.forMode!==mode;});
  hintSource=null;renderStatus();showGameHistory();refreshBoard();saveLocally();
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
  localizedOption($('lesson-piece'),pieceNames);localizedOption($('setup-piece'),pieceNames);localizedOption($('lesson-blocker-piece'),pieceNames);
  const colors={w:['White','Цагаан'],b:['Black','Хар']};
  localizedOption($('lesson-color'),colors);localizedOption($('setup-color'),colors);
  const editOptions={move:['Move pieces','Нүүх'],place:['Place selected piece','Дүрс байрлуулах'],erase:['Remove pieces','Дүрс арилгах']};
  localizedOption($('setup-tool'),editOptions);
  localizedOption($('lesson-tool'),{move:editOptions.move,own:['Add friendly piece','Өөрийн дүрс нэмэх'],opponent:['Add opposing piece','Эсрэг талын дүрс нэмэх'],erase:['Remove a piece','Дүрс арилгах']});
  localizedOption($('annotation-color'),{success:['Green','Ногоон'],info:['Blue','Цэнхэр'],danger:['Red','Улаан'],warning:['Orange','Улбар шар']});
  showHintsForSelection();renderSlides();renderStatus();saveLocally();
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
    language,showMoveHints,chapters:chapterSlides,annotations:persistentAnnotations(),freehand:ink.getStrokes()};
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
  showMoveHints=input.showMoveHints!==false;$('show-moves').checked=showMoveHints;
  chapterSlides=Array.isArray(input.chapters)?input.chapters.slice(0,60).filter(ch=>ch&&['game','lesson','editor'].includes(ch.mode)&&typeof ch.position==='string'&&typeof ch.title==='string'):[];
  selectedSlide=-1;renderSlides();
  setMode(input.mode);
  board.setAnnotations?.(hydrateAnnotations(input.annotations));
  ink.restoreStrokes(input.freehand);
  setLanguage(input.language||'en');
  onPositionChanged();
}

function captureSlide(){
  return {mode,position:positionForMode(),title:$('lesson-title').value.trim()||`${language==='mn'?'Слайд':'Slide'} ${chapterSlides.length+1}`,
    notes:$('notes').value,annotations:persistentAnnotations(),freehand:ink.getStrokes()};
}
function renderSlides(){
  const list=$('lesson-slides');list.replaceChildren();
  $('slide-counter').textContent=language==='mn'?`${chapterSlides.length} слайд`:`${chapterSlides.length} slide${chapterSlides.length===1?'':'s'}`;
  chapterSlides.forEach((ch,i)=>{
    const b=document.createElement('button');b.type='button';
    if(i===selectedSlide)b.classList.add('selected');
    const name=document.createElement('span');name.textContent=`${i+1}. ${ch.title}`;
    const detail=document.createElement('small');detail.textContent=ch.mode==='game'?(language==='mn'?'Өрөг':'Game'):ch.mode==='editor'?(language==='mn'?'Засвар':'Editor'):(language==='mn'?'Хичээл':'Lesson');
    b.append(name,detail);b.addEventListener('click',()=>openSlide(i));list.append(b);
  });
  $('delete-slide').disabled=selectedSlide<0;
  $('slide-prev').disabled=selectedSlide<=0;
  $('slide-next').disabled=selectedSlide>=chapterSlides.length-1;
}
function openSlide(index){
  if(index<0||index>=chapterSlides.length)return;
  const ch=chapterSlides[index];
  try{
    if(ch.mode==='game'){game=new Chess(ch.position);redoStack=[];}
    else if(ch.mode==='lesson'){lessonMap=fenToMap(ch.position);timeline=[{...lessonMap}];timeIndex=0;}
    else{editorMap=fenToMap(ch.position);editorTimeline=[{...editorMap}];editorIndex=0;}
  }catch(e){status(e.message);return;}
  selectedSlide=index;
  $('lesson-title').value=ch.title;$('notes').value=ch.notes||'';
  setMode(ch.mode);
  board.setAnnotations?.(hydrateAnnotations(ch.annotations));
  ink.restoreStrokes(ch.freehand);
  onPositionChanged();renderSlides();
}
$('add-slide').addEventListener('click',()=>{
  if(chapterSlides.length>=60){alert(language==='mn'?'Дээд тал нь 60 слайд хадгална':'Maximum 60 slides');return;}
  chapterSlides.push(captureSlide());selectedSlide=chapterSlides.length-1;renderSlides();saveLocally();
});
$('delete-slide').addEventListener('click',()=>{if(selectedSlide<0)return;chapterSlides.splice(selectedSlide,1);selectedSlide=-1;renderSlides();saveLocally();});
$('slide-prev').addEventListener('click',()=>openSlide(selectedSlide-1));
$('slide-next').addEventListener('click',()=>openSlide(selectedSlide+1));
$('game-start').addEventListener('click',()=>jumpToGamePly(0));
$('game-prev').addEventListener('click',()=>jumpToGamePly(game.history().length-1));
$('game-next').addEventListener('click',()=>jumpToGamePly(game.history().length+1));
$('game-end').addEventListener('click',()=>jumpToGamePly(game.history().length+redoStack.length));
document.querySelectorAll('[data-annotation-tool]').forEach(b=>b.addEventListener('click',()=>changeAnnotationTool(b.dataset.annotationTool)));
$('show-moves').addEventListener('change',e=>changeHintPreference(e.target.checked));
$('annotation-color').addEventListener('change',()=>{$('quick-ink-color').value=$('annotation-color').value;saveLocally();});
$('quick-ink-color').value=$('annotation-color').value;
$('undo-ink').addEventListener('click',()=>ink.undo());
$('language').addEventListener('click',()=>setLanguage(language==='en'?'mn':'en'));
document.querySelectorAll('button[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
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
$('flip').addEventListener('click',async()=>{
  await board.setOrientation(board.getOrientation()===COLOR.white?COLOR.black:COLOR.white,true);
  ink.redraw();
});
$('clear-arrows').addEventListener('click',()=>{ink.snapshot();board.removeArrows?.();board.removeMarkers?.();ink.clear();showHintsForSelection();saveLocally();});
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
  markExample('open');
  const kind=$('lesson-piece').value;
  const piece=$('lesson-color').value==='w'?kind.toUpperCase():kind;
  lessonMap=lessonExample(piece,'open','d4');
  timeline=[{...lessonMap}];timeIndex=0;
  setMode('lesson');
}
$('start-lesson').addEventListener('click',makeDemo);
function markExample(example){
  const buttons={open:'example-open',blockers:'example-blockers',captures:'example-captures'};
  for(const [id,value] of Object.entries(buttons)){$(value).classList.toggle('active',id===example);}
}
function useLessonExample(example){
  markExample(example);
  const kind=$('lesson-piece').value;
  const piece=$('lesson-color').value==='w'?kind.toUpperCase():kind;
  lessonMap=lessonExample(piece,example);
  timeline=[{...lessonMap}];timeIndex=0;
  setMode('lesson');
}
$('example-open').addEventListener('click',()=>useLessonExample('open'));
$('example-blockers').addEventListener('click',()=>useLessonExample('blockers'));
$('example-captures').addEventListener('click',()=>useLessonExample('captures'));
$('lesson-tool').addEventListener('change',()=>{board.cancelMoveInput();hintSource=null;showHintsForSelection();});
$('setup-tool').addEventListener('change',()=>{board.cancelMoveInput();hintSource=null;showHintsForSelection();});
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
function togglePresentationTools(){
  if(!document.fullscreenElement)return;
  const open=$('teaching-panel').classList.toggle('fullscreen-open');
  $('focus-toggle').setAttribute('aria-expanded',String(open));
}
$('focus-toggle').addEventListener('click',togglePresentationTools);
document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement){$('teaching-panel').classList.remove('fullscreen-open');$('focus-toggle').setAttribute('aria-expanded','false');}
});
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
    togglePresentationTools();
    e.preventDefault();
  }
  if(e.key==='ArrowLeft'){$('undo').click();e.preventDefault();}
  if(e.key==='ArrowRight'){$('redo').click();e.preventDefault();}
});
try{const raw=localStorage.getItem(saveKey);if(raw)loadLesson(JSON.parse(raw));}catch(e){console.warn('Saved lesson could not be restored',e)}
setMode(mode);setLanguage(language);showGameHistory();renderSlides();
