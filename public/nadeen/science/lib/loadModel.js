// Loads a .glb that is stored as base64 inside a small JS module (models/<name>.glb.js),
// so the model can be served by hosts that only serve web files. Same bytes as the original .glb.
import { GLTFLoader } from './GLTFLoader.js';
export async function loadModel(name) {
  const b64 = (await import(`../models/${name}.glb.js`)).default;
  const s = atob(b64), u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return new GLTFLoader().parseAsync(u.buffer, '');
}
