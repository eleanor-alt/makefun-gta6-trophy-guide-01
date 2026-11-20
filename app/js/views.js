// Vice Ledger — the three views as HTML strings.
// renderChecklistRows builds the tracker rows, renderDetail the guide pane for
// one trophy, renderRoadmap the three-stage road to the platinum, and
// renderMissables the warning page. All trophy text comes from
// data/trophies.json and is escaped before it reaches the page.

import { KIND_LABELS, countFraction, displayDescription, displayName, isVeiled } from './filters.js';

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraphs(text) {
  return String(text).split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join('');
}

function tagRow(trophy, progress) {
  const tags = [`<span class="tag tag-grade">${esc(trophy.grade)}</span>`, `<span class="tag">${esc(KIND_LABELS[trophy.kind] ?? trophy.kind)}</span>`];
  if (trophy.hidden) tags.push('<span class="tag tag-hidden">hidden</span>');
  if (trophy.missable) tags.push('<span class="tag tag-missable">missable — take care</span>');
  if (typeof trophy.count === 'number') {
    const done = progress.counts[trophy.id] ?? 0;
    tags.push(`<span class="tag tag-count">${done} / ${trophy.count} ${esc(trophy.target ?? '')}</span>`);
  }
  return tags.join('');
}

function counterBar(trophy, progress) {
  const fraction = countFraction(trophy, progress);
  if (fraction === null) return '';
  const done = progress.counts[trophy.id] ?? 0;
  return `<div class="row-counter"><progress value="${Math.round(fraction * 100)}" max="100"></progress>${done} of ${trophy.count} ${esc(trophy.target ?? '')} logged</div>`;
}

/** One checklist row: earn checkbox, medal swatch, name and description, tags. */
export function checklistRowHtml(trophy, progress, selectedId) {
  const earned = progress.earned[trophy.id] === true;
  const classes = ['trophy-row', earned ? 'is-earned' : '', trophy.id === selectedId ? 'is-selected' : ''].join(' ');
  return `<li class="${classes}" data-open="${esc(trophy.id)}">
    <input type="checkbox" data-earn="${esc(trophy.id)}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(displayName(trophy, progress))} earned">
    <span class="medal medal-${esc(trophy.grade)}" title="${esc(trophy.grade)}"></span>
    <span class="trophy-main">
      <span class="trophy-name">${esc(displayName(trophy, progress))}</span><br>
      <span class="trophy-desc">${esc(displayDescription(trophy, progress))}</span>
    </span>
    <span class="trophy-tags">${tagRow(trophy, progress)}</span>
    ${counterBar(trophy, progress)}
  </li>`;
}

/** The guide pane for one trophy: official words first, then this guide's own. */
export function detailHtml(trophy, progress) {
  const earned = progress.earned[trophy.id] === true;
  const veiled = isVeiled(trophy, progress);
  const parts = [];
  parts.push(`<p class="meta-line">${esc(trophy.grade)} · ${esc(KIND_LABELS[trophy.kind] ?? trophy.kind)} · roadmap stage ${trophy.stage}${trophy.hidden ? ' · hidden on PlayStation until earned' : ''}</p>`);
  parts.push(`<h2>${esc(displayName(trophy, progress))}</h2>`);
  parts.push(`<p class="official-desc">“${esc(displayDescription(trophy, progress))}”</p>`);
  if (trophy.missable) {
    parts.push(`<div class="missable-warning"><strong>Missable — read before you play on.</strong><br>${esc(trophy.missableNote ?? 'This one can be left behind. Check the guide below before moving the story forward.')}</div>`);
  }
  if (!veiled) {
    parts.push('<h3>The guide</h3>');
    parts.push(paragraphs(trophy.guide));
    if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
      parts.push('<h3>Steps</h3>');
      parts.push(`<ol>${trophy.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>`);
    }
    if (typeof trophy.count === 'number') {
      const done = progress.counts[trophy.id] ?? 0;
      parts.push('<h3>Your count</h3>');
      parts.push(`<p>PlayStation tracks ${trophy.count} ${esc(trophy.target ?? '')} for this trophy. Log yours here and the checklist keeps the fraction for you.</p>`);
      parts.push(`<div class="counter-editor">
        <button type="button" data-count="-1" aria-label="One less">−</button>
        <input type="number" id="count-input" min="0" max="${trophy.count}" value="${done}" aria-label="Your count so far">
        <button type="button" data-count="1" aria-label="One more">+</button>
        <span>of ${trophy.count}</span>
      </div>`);
    }
    parts.push(`<p class="sources">${esc(trophy.sources)}</p>`);
  } else {
    parts.push('<p>This guide page unlocks with the trophy: turn the spoiler setting off above if you would rather read ahead.</p>');
  }
  parts.push(`<button type="button" id="earn-toggle" aria-pressed="${earned}">${earned ? 'Earned — tap to undo' : 'Mark as earned'}</button>`);
  return parts.join('');
}

/** The roadmap: three stages, each with its advice and its trophies by name. */
export function roadmapHtml(data, progress) {
  const parts = [`<p class="pane-intro">${esc(data.roadmapIntro)}</p>`];
  for (const stage of data.roadmap) {
    const members = data.trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => progress.earned[t.id] === true).length;
    parts.push(`<section class="stage-card">
      <h2>Stage ${stage.stage} — ${esc(stage.title)}</h2>
      <p class="stage-sub">${esc(stage.sub)}</p>
      <p class="stage-progress">${done} of ${members.length} trophies in this stage earned</p>
      ${paragraphs(stage.body)}
      <ul>${members.map((t) => `<li class="${progress.earned[t.id] === true ? 'done' : ''}"><a href="#/trophy/${esc(t.id)}">${esc(displayName(t, progress))}</a> (${esc(t.grade)})</li>`).join('')}</ul>
    </section>`);
  }
  return parts.join('');
}

/** The missables page: the one real warning, and the near-misses explained. */
export function missablesHtml(data, progress) {
  const flagged = data.trophies.filter((t) => t.missable === true);
  const parts = [`<p class="pane-intro">${esc(data.missablesIntro)}</p>`];
  for (const trophy of flagged) {
    parts.push(`<section class="missable-card">
      <h2>${esc(trophy.name)} <span class="tag tag-missable">missable — take care</span></h2>
      <p class="stage-sub">“${esc(trophy.description)}” — ${esc(trophy.grade)}</p>
      <p>${esc(trophy.missableNote ?? '')}</p>
      ${paragraphs(trophy.guide)}
      <p><a href="#/trophy/${esc(trophy.id)}">Open its checklist page</a></p>
    </section>`);
  }
  parts.push(`<section class="missable-card">
    <h2>What looks missable, and is not</h2>
    ${paragraphs(data.notMissable)}
  </section>`);
  return parts.join('');
}
