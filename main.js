// Load → validate → start. Content is checked once, before team setup (spec FR-021).
import { validateContent } from './engine/content.js';
import { createSession } from './engine/state.js';
import { renderContentError } from './ui/render.js';
import { start } from './ui/controls.js';

async function boot() {
  let doc;
  try {
    const res = await fetch('data/levels.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} while loading data/levels.json`);
    doc = await res.json();
  } catch (err) {
    renderContentError([{ code: 'load-failed', message: `The game content could not be loaded (${err.message}). If you opened the file directly, serve the folder over HTTP instead.` }]);
    return;
  }
  const result = validateContent(doc);
  if (!result.ok) {
    renderContentError(result.errors);
    return;
  }
  start(createSession(doc));
}

boot();
