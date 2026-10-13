import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
const source = path.resolve('node_modules/cm-chessboard/assets');
const target = path.resolve('public/cm-assets');
await access(source);
await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log('Copied cm-chessboard assets into public/cm-assets');
