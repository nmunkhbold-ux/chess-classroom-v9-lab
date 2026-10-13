import test from 'node:test';
import assert from 'node:assert/strict';
import {demonstrationMoves,lessonExample} from '../src/core/teaching.js';

test('knight demonstration shows eight targets from center',()=>{
  const a=demonstrationMoves({d4:'N'},'d4');
  assert.equal(a.moves.length,8);assert.equal(a.captures.length,0);
  assert.ok(a.moves.includes('f5'));assert.ok(a.moves.includes('e6'));
});
test('sliding rook stops behind friendly pieces and can capture enemy',()=>{
  const m={d4:'R',d6:'P',f4:'p'};
  const a=demonstrationMoves(m,'d4');
  assert.ok(a.moves.includes('d5'));assert.ok(!a.moves.includes('d6'));
  assert.ok(!a.moves.includes('d7'));assert.ok(a.captures.includes('f4'));assert.ok(!a.moves.includes('g4'));
});
test('pawn hints handle forward blocking, attacks and initial double moves',()=>{
  let a=demonstrationMoves({d2:'P',c3:'p'},'d2');
  assert.deepEqual(a.moves,['d3','d4']);assert.deepEqual(a.captures,['c3']);
  a=demonstrationMoves({d7:'p',d6:'P',e6:'P'},'d7');
  assert.deepEqual(a.moves,[]);assert.deepEqual(a.captures,['e6']);
});
test('demonstrations allow empty boards, and sample blockers/captures',()=>{
  const x=lessonExample('B','open');assert.deepEqual(x,{d4:'B'});
  const y=lessonExample('N','blockers');assert.equal(y.e6,'P');
  const z=lessonExample('p','captures');assert.equal(z.e3,'P');assert.equal(z.d3,undefined);
});
test('geometry rejects bad square and empty source',()=>{
  assert.throws(()=>demonstrationMoves({},'i4'));
  assert.deepEqual(demonstrationMoves({},'d4'),{moves:[],captures:[]});
});
