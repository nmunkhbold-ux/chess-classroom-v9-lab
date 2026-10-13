export const CHANNEL='chess-classroom-v10-preview-v1';
export const PRESENTATION_KEY='chess-classroom-v10-presentation';
export const LESSON_KEY='chess-classroom-v10-lesson';
export function makeSync(handler){
  const bc=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(CHANNEL):null;
  const callback=e=>{if(e.key===PRESENTATION_KEY&&e.newValue){try{handler(JSON.parse(e.newValue));}catch{}}};
  window.addEventListener('storage',callback);
  if(bc)bc.onmessage=e=>handler(e.data);
  return {send(payload){const msg={...payload,sentAt:Date.now()};try{localStorage.setItem(PRESENTATION_KEY,JSON.stringify(msg));}catch{}bc?.postMessage(msg);},
  request(){bc?.postMessage({type:'request',sentAt:Date.now()});},
  saved(){try{return JSON.parse(localStorage.getItem(PRESENTATION_KEY)||'null');}catch{return null;}},
  close(){bc?.close();window.removeEventListener('storage',callback);}};
}
