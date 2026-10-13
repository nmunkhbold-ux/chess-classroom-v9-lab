import test from 'node:test';
import assert from 'node:assert/strict';
import { fenToMap, mapToFen, putPiece, freeMove, demoPosition, validateLesson } from '../src/core/position.js';

test('standard starting position survives FEN conversion', () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  assert.equal(mapToFen(fenToMap(fen)), fen);
});
test('empty board round trips', () => {
  const fen = '8/8/8/8/8/8/8/8';
  assert.equal(mapToFen(fenToMap(fen)), fen);
});
test('place and remove any type and color', () => {
  const board = putPiece({}, 'a4', 'q');
  assert.equal(board.a4, 'q');
  const cleared = putPiece(board, 'a4', null);
  assert.equal(cleared.a4, undefined);
});
test('free board editing supports arbitrary captures without chess rules', () => {
  const initial = { a1:'R', h8:'q' };
  const moved = freeMove(initial, 'a1', 'h8');
  assert.deepEqual(moved, { h8:'R' });
  assert.deepEqual(initial, { a1:'R', h8:'q' });
});
test('single piece lesson without kings is valid', () => {
  const board = demoPosition('N','d4');
  assert.equal(mapToFen(board), '8/8/8/8/3N4/8/8/8');
});
test('corrupt FEN is rejected', () => {
  assert.throws(() => fenToMap('9/8/8/8/8/8/8/8'));
  assert.throws(() => fenToMap('8/8/8/8/8/8/8'));
});
test('lesson backups reject malformed content', () => {
  const data = {mode:'lesson',position:'8/8/8/8/3N4/8/8/8',title:'Knight',notes:'L shape'};
  assert.equal(validateLesson(data),data);
  assert.throws(() => validateLesson({mode:'editor',position:'invalid'}));
  assert.throws(() => validateLesson({mode:'unknown',position:data.position}));
});
