import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'giveaways.json');

function ensureDir() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDir();
  if (!fs.existsSync(FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8')) || {};
  } catch (e) {
    return {};
  }
}

function save(obj) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

export default {
  getAll() { return load(); },
  get(id) { return load()[id]; },
  set(id, data) {
    const obj = load(); obj[id] = data; save(obj); return data;
  },
  del(id) {
    const obj = load(); delete obj[id]; save(obj);
  }
};
