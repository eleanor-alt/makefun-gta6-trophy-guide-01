// Boot: load the trophy data and the source legend, restore saved progress,
// then route by the URL hash: #/checklist, #/roadmap, #/missable, #/about,
// or #/trophy/<id> to open one trophy's guide in the checklist.
import { loadState, saveState, toggleEarned, exportProgress, importProgress, resetProgress } from './store.js';
import {
  renderProgress,
  renderChecklist,
  renderDetail,
  renderRoadmap,
  renderMissables,
  renderSources,
} from './views.js';

const data = await (await fetch('data/trophies.json')).json();
const sources = await (await fetch('data/sources.json')).json();
const trophies = data.trophies;

let state = loadState();
let selectedId = null;
let view = 'checklist';
const filters = { kind: 'all', grade: 'all', query: '', hideEarned: false };

const views = {
  checklist: document.getElementById('view-checklist'),
  roadmap: document.getElementById('view-roadmap'),
  missable: document.getElementById('view-missable'),
  about: document.getElementById('view-about'),
};

function selectedTrophy() {
  return trophies.find((t) => t.id === selectedId) || null;
}

function rerender() {
  renderProgress(trophies, state);
  renderChecklist(trophies, state, filters, selectedId, selectTrophy, toggleTrophy);
  renderDetail(selectedTrophy(), state, sources);
}

function selectTrophy(id) {
  selectedId = id;
  rerender();
  const card = document.querySelector(`[data-trophy-id="${id}"]`);
  if (card) card.scrollIntoView({ block: 'nearest' });
}

function toggleTrophy(id) {
  state = toggleEarned(state, id);
  rerender();
}

function showView(name) {
  view = name;
  renderProgress(trophies, state);
  for (const [key, section] of Object.entries(views)) section.hidden = key !== name;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.tab === name);
  }
  if (name === 'roadmap') renderRoadmap(trophies, state);
  if (name === 'missable') renderMissables(trophies, state);
  if (name === 'about') renderSources(sources);
  if (name === 'checklist') rerender();
}

function route() {
  const hash = window.location.hash || '#/checklist';
  const trophyMatch = hash.match(/^#\/trophy\/([a-z0-9-]+)$/);
  if (trophyMatch && trophies.some((t) => t.id === trophyMatch[1])) {
    selectedId = trophyMatch[1];
    showView('checklist');
    window.scrollTo(0, 0);
    return;
  }
  const viewMatch = hash.match(/^#\/(checklist|roadmap|missable|about)$/);
  showView(viewMatch ? viewMatch[1] : 'checklist');
}

document.getElementById('search').addEventListener('input', (event) => {
  filters.query = event.target.value;
  rerender();
});
document.getElementById('grade').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  rerender();
});
document.getElementById('hide-earned').addEventListener('change', (event) => {
  filters.hideEarned = event.target.checked;
  rerender();
});
document.getElementById('spoilers').addEventListener('change', (event) => {
  state.spoilers = event.target.checked;
  saveState(state);
  rerender();
});
document.getElementById('kind-chips').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-kind]');
  if (!chip) return;
  filters.kind = chip.dataset.kind;
  for (const button of document.querySelectorAll('#kind-chips .chip')) {
    button.classList.toggle('active', button === chip);
  }
  rerender();
});
document.getElementById('export').addEventListener('click', () => exportProgress(state));
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const earned = await importProgress(file, trophies.map((t) => t.id));
    state.earned = earned;
    saveState(state);
    rerender();
  } catch {
    alert('That file could not be imported as trophy progress.');
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies and the spoiler setting?')) {
    state = resetProgress();
    selectedId = null;
    rerender();
  }
});

document.getElementById('spoilers').checked = state.spoilers;
window.addEventListener('hashchange', route);
route();
requestAnimationFrame(() => {
  window.__shotReady = true;
});
