import {newLesson,newScene,normalizePosition} from './core.js';
export function makeSampleLesson(){
 const lesson=newLesson('mn');lesson.title='Морины нүүдэл';lesson.course='ГЭГЭЭН АРВАЙ ШАТРЫН КЛУБ';
 const scene=(kind,title,subtitle,notes,position='8/8/8/8/3N4/8/8/8 w - - 0 1')=>{
   const s=newScene(kind,1);s.title=title;s.subtitle=subtitle;s.chapter='АНХАН ШАТ · ХИЧЭЭЛ 01';s.notes=notes;s.position=normalizePosition(position);return s;
 };
 const intro=scene('intro','Морины нүүдэл','Шатрын дүрсний нүүдэл · Хичээл 1','Өнөөдрийн хичээлээр бид морины өвөрмөц нүүдэл, дүрс идэх дүрэм, саадыг давдаг онцлогийг судална.');
 const show=scene('board-presenter','Морь гэж ямар дүрс вэ?','Морь бусдаас өөрөөр нүүдэг.','Самбарын төвд байгаа цагаан морийг заан танилцуулна.');
 const motion=scene('board-presenter','Морь Г хэлбэрээр нүүдэг','Хоёр нүд + нэг нүд','Дүрсийг дагуулж хоёр нүд урагш, нэг нүд хажуу тийш нүүдгийг тайлбарлана.');
 motion.reveals=[{id:'kn-1',type:'highlight',label:'Нүүдлийг харуулах',value:'b3 b5 c2 c6 e2 e6 f3 f5'},
   {id:'kn-2',type:'arrow',label:'Жишээ',value:'d4 f5'},
   {id:'kn-3',type:'move',label:'Морийг нүүлгэх',value:'d4f5'}];
 const corners=scene('board-presenter','Буланд байгаа морь','Булангаас цөөн нүүдэлтэй.','Самбарын буланд морь зөвхөн хоёр нүд рүү нүүж чадна.','N7/8/8/8/8/8/8/8 w - - 0 1');
 corners.reveals=[{id:'kn-4',type:'highlight',label:'Хоёр нүүдэл',value:'b6 c7'}];
 const captures=scene('board-presenter','Дүрс идэх','Морь эсрэг талын дүрсийг идэж чадна.','Эсрэг өнгийн дүрс дээр нүүж идэхийг тайлбарлана.','8/8/8/5p2/3N4/8/8/8 w - - 0 1');
 captures.reveals=[{id:'kn-5',type:'circle',label:'Бай дүрс',value:'f5'}, {id:'kn-6',type:'move',label:'Идэх жишээ',value:'d4f5'}];
 const exercise=scene('exercise','Та хаашаа нүүх вэ?','Бичлэгийг түр зогсоогоод бодоорой.','Суралцагчдад бодох хугацаа өгнө.');
 const answer=scene('answer','Хариултаа шалгая','Найман боломжит нүүдэл байна.','Боломжит найман нүдийг нэг нэгээр нь харуулна.');
 answer.reveals=[{id:'kn-7',type:'highlight',label:'Бүх нүүдэл',value:'b3 b5 c2 c6 e2 e6 f3 f5'}, {id:'kn-8',type:'text',label:'Нийт',value:'8 боломжит нүүдэл'}];
 const summary=scene('summary','Өнөөдрийн хичээлийн дүгнэлт','Морь Г хэлбэрээр нүүдэг · Саадыг давдаг · Дүрс иддэг','Гол дүрмийг эргэн сануулаад дараагийн хичээлээ зарлана.');
 summary.reveals=[{id:'kn-9',type:'text',label:'Дүгнэлт',value:'Морь Г хэлбэрээр нүүдэг. Морь бусад дүрсний дээгүүр давж нүүдэг.'}];
 lesson.scenes=[intro,show,motion,corners,captures,exercise,answer,summary];return lesson;
}
