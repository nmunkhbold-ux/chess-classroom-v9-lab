import test from 'node:test';
import assert from 'node:assert/strict';
import {newLesson,newScene,copyScene,validateLesson,normalizePosition,frameFor,migrateV9,framesForMoveSequence,moveSequence} from '../src/v10/core.js';
test('blank V10 lesson roundtrips',()=>{const l=newLesson();assert.equal(validateLesson(l).version,10);assert.equal(l.scenes.length,1);});
test('scene duplication has new id and independent data',()=>{const s=newScene();const c=copyScene(s);assert.notEqual(c.id,s.id);c.title='edited';assert.notEqual(s.title,c.title);});
test('reveal progression never changes underlying scene',()=>{
 const s=newScene();s.position='8/8/8/8/3N4/8/8/8 w - - 0 1';s.reveals=[{type:'highlight',value:'b3 f5'}, {type:'arrow',value:'d4 f5'},{type:'text',value:'L-shaped move'}];
 assert.equal(frameFor(s,0).annotations.length,0);assert.equal(frameFor(s,1).annotations.length,2);assert.equal(frameFor(s,2).annotations.length,3);
 assert.deepEqual(frameFor(s,3).texts,['L-shaped move']);assert.equal(s.annotations.length,0);
});
test('move sequences and reset are deterministic even without kings',()=>{
 const s=newScene();s.position='8/8/8/8/3N4/8/8/8 w - - 0 1';s.reveals=[{type:'move',value:'d4f5 f5d4'}];
 assert.equal(frameFor(s,1).position.split(' ')[0],'8/8/8/8/3N4/8/8/8');
 assert.equal(framesForMoveSequence(s.position,'d4f5').length,1);
 assert.equal(frameFor(s,0).position,normalizePosition(s.position));
});
test('bad moves, unknown templates, excessive scenes are rejected',()=>{
 assert.throws(()=>moveSequence('zz99'));const x=newLesson();x.scenes[0].template='bogus';assert.throws(()=>validateLesson(x));
 const y=newLesson();y.scenes=Array.from({length:121},()=>newScene());assert.throws(()=>validateLesson(y));
});
test('V9 simple lesson migrates without modifying source',()=>{
 const raw={version:1,language:'mn',title:'Knight',position:'8/8/8/8/3N4/8/8/8 w - - 0 1',notes:'lesson',chapters:[]};
 assert.equal(migrateV9(raw).scenes[0].notes,'lesson');assert.equal(raw.version,1);
});
