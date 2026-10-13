// Framework-free teaching position helpers. These deliberately allow arrangements
// which are not legal games (missing kings, arbitrary pieces and free movement).
export const PIECES = ['p', 'n', 'b', 'r', 'q', 'k'];
const files = 'abcdefgh';

export function assertSquare(square) {
  if (!/^[a-h][1-8]$/.test(square ?? '')) throw new Error('Invalid square');
}

export function fenToMap(fen) {
  const rows = String(fen).trim().split(/\s+/)[0].split('/');
  if (rows.length !== 8) throw new Error('Position must contain eight rows');
  const map = {};
  for (let y = 0; y < 8; y++) {
    let x = 0;
    for (const c of rows[y]) {
      if (/[1-8]/.test(c)) x += Number(c);
      else if (/[pnbrqkPNBRQK]/.test(c)) {
        if (x >= 8) throw new Error('Too many files');
        map[files[x] + (8 - y)] = c;
        x++;
      } else throw new Error('Invalid piece in FEN');
    }
    if (x !== 8) throw new Error('FEN row must contain eight squares');
  }
  return map;
}

export function mapToFen(map) {
  const rows = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = '', empties = 0;
    for (const file of files) {
      const piece = map[file + rank];
      if (piece && !/[pnbrqkPNBRQK]/.test(piece)) throw new Error('Invalid piece');
      if (piece) {
        if (empties) row += empties;
        empties = 0;
        row += piece;
      } else empties++;
    }
    if (empties) row += empties;
    rows.push(row);
  }
  return rows.join('/');
}

export function putPiece(map, square, piece) {
  assertSquare(square);
  if (piece && !/^[pnbrqkPNBRQK]$/.test(piece)) throw new Error('Unknown chess piece');
  const next = { ...map };
  if (piece) next[square] = piece;
  else delete next[square];
  return next;
}

export function freeMove(map, from, to) {
  assertSquare(from); assertSquare(to);
  if (!map[from] || from === to) return { ...map };
  const next = { ...map, [to]: map[from] };
  delete next[from];
  return next;
}

export function demoPosition(piece = 'N', square = 'd4') {
  if (!/^[pnbrqkPNBRQK]$/.test(piece)) throw new Error('Unknown demo piece');
  assertSquare(square);
  return { [square]: piece };
}

export function mapFromPieces(list) {
  const result = {};
  for (const [square, piece] of list) Object.assign(result, putPiece(result, square, piece));
  return result;
}

export function validateLesson(data) {
  if (!data || typeof data !== 'object') throw new Error('Not a lesson');
  if (!['game', 'lesson', 'editor'].includes(data.mode)) throw new Error('Invalid teaching mode');
  if (typeof data.position !== 'string') throw new Error('Missing board position');
  fenToMap(data.position);
  if (data.title != null && typeof data.title !== 'string') throw new Error('Invalid lesson title');
  if (data.notes != null && typeof data.notes !== 'string') throw new Error('Invalid notes');
  return data;
}
