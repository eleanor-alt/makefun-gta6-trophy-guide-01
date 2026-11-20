// Vice Ledger — the tracker's wiring.
// Loads the trophy data from data/trophies.json (a file of this app, fetched
// from the same folder the page was served from — the app works offline and
// asks for nothing else), keeps the player's progress in the store, routes
// between the checklist, the roadmap and the missables page by the URL hash,
// and re-renders on every change.

import { earnedTallies, trophyMatches } from './filters.js';
import { exportFileText, loadProgress, parseImport, saveProgress } from './store.js';
import { checklistRowHtml, detailHtml, missablesHtml, roadmapHtml } from './views.js';

const elements = {
  list: document.querySelector('#trophy-list'),
  listStatus: document.querySelector('#list-status'),
  detailEmpty: document.querySelector('#detail-empty'),
  detailCard: document.querySelector('#detail-card'),
  checklistPane: document.querySelector('#checklist-pane'),
  detailPane: document.querySelector('#detail-pane'),
  roadmapPane: document.querySelector('#roadmap-pane'),
  missablesPane: document.querySelector('#missables-pane'),
  toolbar: document.querySelector('#toolbar'),
  search: document.querySelector('#search-box'),
  grade: document.querySelector('#grade-filter'),
  state: document.querySelector('#state-filter'),
  spoilers: document.querySelector('#spoiler-checkbox'),
  earnedNumber: document.querySelector('#earned-number'),
  progressFill: document.querySelector('#progress-fill'),
  gradeTally: document.querySelector('#grade-tally'),
  tabs: [...document.querySelectorAll('#view-tabs .tab')],
  chips: [...document.querySelectorAll('#kind-filters .chip')],
};

let data = null;
let progress = loadProgress();
let selectedId = null;
const filters = { kind: 'all', grade: 'all', state: 'all', query: '' };

function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'roadmap') return { view: 'roadmap' };
  if (hash === 'missables') return { view: 'missables' };
  if (hash.startsWith('trophy/')) return { view: 'checklist', trophy: hash.slice('trophy/'.length) };
  return { view: 'checklist' };
}

function renderHeader() {
  const tally = earnedTallies(data.trophies, progress);
  elements.earnedNumber.textContent = String(tally.total);
  elements.progressFill.style.width = `${(tally.total / data.trophies.length) * 100}%`;
  elements.gradeTally.textContent =
    `${tally.platinum} of 1 platinum · ${tally.gold} of 2 gold · ${tally.silver} of 6 silver · ${tally.bronze} of 46 bronze earned`;
}

function renderChecklist() {
  const shown = data.trophies.filter((t) => trophyMatches(t, progress, filters));
  elements.list.innerHTML = shown.map((t) => checklistRowHtml(t, progress, selectedId)).join('');
  elements.listStatus.textContent = shown.length === data.trophies.length
    ? 'All 55 trophies shown.'
    : `${shown.length} of 55 trophies match the filters.`;
}

function renderDetail() {
  const trophy = data.trophies.find((t) => t.id === selectedId) ?? null;
  elements.detailEmpty.hidden = trophy !== null;
  elements.detailCard.hidden = trophy === null;
  if (trophy !== null) elements.detailCard.innerHTML = detailHtml(trophy, progress);
}

function render() {
  if (data === null) return;
  const route = currentRoute();
  if (route.trophy !== undefined && data.trophies.some((t) => t.id === route.trophy)) selectedId = route.trophy;
  const onChecklist = route.view === 'checklist';
  elements.checklistPane.hidden = !onChecklist;
  elements.detailPane.hidden = !onChecklist;
  elements.toolbar.style.display = onChecklist ? '' : 'none';
  elements.roadmapPane.hidden = route.view !== 'roadmap';
  elements.missablesPane.hidden = route.view !== 'missables';
  for (const tab of elements.tabs) tab.classList.toggle('is-active', tab.dataset.view === route.view);
  renderHeader();
  if (onChecklist) {
    renderChecklist();
    renderDetail();
  } else if (route.view === 'roadmap') {
    elements.roadmapPane.innerHTML = roadmapHtml(data, progress);
  } else {
    elements.missablesPane.innerHTML = missablesHtml(data, progress);
  }
}

function setEarned(id, earned) {
  if (earned) progress.earned[id] = true;
  else delete progress.earned[id];
  saveProgress(progress);
  render();
}

function setCount(id, value) {
  const trophy = data.trophies.find((t) => t.id === id);
  if (trophy === undefined || typeof trophy.count !== 'number') return;
  const clamped = Math.max(0, Math.min(trophy.count, Math.floor(value) || 0));
  progress.counts[id] = clamped;
  if (clamped >= trophy.count) progress.earned[id] = true;
  saveProgress(progress);
  render();
}

function wireEvents() {
  window.addEventListener('hashchange', render);

  elements.list.addEventListener('click', (event) => {
    const checkbox = event.target.closest('[data-earn]');
    if (checkbox !== null) return; // the change handler below owns the checkbox
    const row = event.target.closest('[data-open]');
    if (row !== null) window.location.hash = `#/trophy/${row.dataset.open}`;
  });
  elements.list.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-earn]');
    if (checkbox !== null) setEarned(checkbox.dataset.earn, checkbox.checked);
  });

  elements.detailCard.addEventListener('click', (event) => {
    if (event.target.id === 'earn-toggle') {
      setEarned(selectedId, progress.earned[selectedId] !== true);
      return;
    }
    const step = event.target.closest('[data-count]');
    if (step !== null) setCount(selectedId, (progress.counts[selectedId] ?? 0) + Number(step.dataset.count));
  });
  elements.detailCard.addEventListener('change', (event) => {
    if (event.target.id === 'count-input') setCount(selectedId, Number(event.target.value));
  });

  elements.search.addEventListener('input', () => {
    filters.query = elements.search.value.trim();
    renderChecklist();
  });
  elements.grade.addEventListener('change', () => {
    filters.grade = elements.grade.value;
    renderChecklist();
  });
  elements.state.addEventListener('change', () => {
    filters.state = elements.state.value;
    renderChecklist();
  });
  for (const chip of elements.chips) {
    chip.addEventListener('click', () => {
      filters.kind = chip.dataset.kind;
      for (const other of elements.chips) other.classList.toggle('is-active', other === chip);
      renderChecklist();
    });
  }
  elements.spoilers.addEventListener('change', () => {
    progress.spoilers = elements.spoilers.checked;
    saveProgress(progress);
    render();
  });

  document.querySelector('#export-button').addEventListener('click', () => {
    const blob = new Blob([exportFileText(progress)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vice-ledger-progress.json';
    link.click();
    URL.revokeObjectURL(url);
  });
  const fileInput = document.querySelector('#import-file');
  document.querySelector('#import-button').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (file === undefined) return;
    try {
      progress = parseImport(await file.text());
      elements.spoilers.checked = progress.spoilers;
      saveProgress(progress);
      render();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'That import did not work.');
    }
    fileInput.value = '';
  });
}

async function boot() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error(`trophies.json answered ${response.status}`);
    data = await response.json();
  } catch {
    elements.listStatus.textContent = 'The trophy data (data/trophies.json) could not be loaded — serve this folder with any static file server and reload.';
    return;
  }
  elements.spoilers.checked = progress.spoilers;
  wireEvents();
  render();
}

boot();
