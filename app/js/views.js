// Views: the checklist with its filters and spoiler rule, the guide detail pane,
// the roadmap, the missables page and the sources page. Everything renders from
// the trophy data; nothing here fetches anything.
import { isEarned } from './store.js';

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectible',
  activity: 'Activity',
  online: 'Online',
};

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function storyHidden(trophy, state) {
  return state.spoilers && trophy.kind === 'story' && !isEarned(state, trophy.id);
}

export function applyFilters(trophies, state, filters) {
  const query = filters.query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (filters.kind === 'online') return false;
    if (filters.kind === 'missable' && !trophy.missable) return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.hideEarned && isEarned(state, trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function tag(text, className) {
  const span = document.createElement('span');
  span.className = `tag ${className}`;
  span.textContent = text;
  return span;
}

export function renderProgress(trophies, state) {
  const earned = trophies.filter((t) => isEarned(state, t.id));
  document.getElementById('progress-earned').textContent = String(earned.length);
  document.getElementById('progress-fill').style.width = `${(earned.length / trophies.length) * 100}%`;
  const byGrade = {};
  for (const trophy of earned) byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  const parts = ['platinum', 'gold', 'silver', 'bronze']
    .filter((grade) => byGrade[grade])
    .map((grade) => `${byGrade[grade]} ${grade}`);
  document.getElementById('progress-grades').textContent = parts.length
    ? parts.join(' · ')
    : 'No trophies earned yet — tick one off to start.';
}

export function renderChecklist(trophies, state, filters, selectedId, onSelect, onToggle) {
  const list = document.getElementById('trophy-list');
  list.replaceChildren();
  const shown = applyFilters(trophies, state, filters);
  const meta = document.getElementById('list-meta');
  if (filters.kind === 'online') {
    meta.textContent = 'No online trophies — every one of the 55 is single-player and offline, as PowerPyx confirms.';
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent =
      'There is nothing to track here: no trophy needs multiplayer, online play or DLC. Work the other filters instead.';
    list.append(empty);
    return;
  }
  meta.textContent = `Showing ${shown.length} of ${trophies.length} trophies` +
    (filters.kind !== 'all' ? ` · ${KIND_LABELS[filters.kind]}` : '') +
    (filters.grade !== 'all' ? ` · ${gradeLabel(filters.grade)}` : '') +
    (filters.query ? ` · matching “${filters.query}”` : '');
  for (const trophy of shown) {
    const item = document.createElement('li');
    item.className = `trophy grade-${trophy.grade}` + (isEarned(state, trophy.id) ? ' earned' : '') +
      (trophy.id === selectedId ? ' selected' : '');
    item.dataset.trophyId = trophy.id;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, trophy.id);
    box.setAttribute('aria-label', `Earned: ${trophy.name}`);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      onToggle(trophy.id);
    });
    item.append(box);

    const body = document.createElement('div');
    const hidden = storyHidden(trophy, state);
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : trophy.name;
    body.append(name);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = hidden
      ? 'Complete the story to reveal this trophy. Turn “Hide story spoilers” off to see it now.'
      : trophy.description;
    body.append(desc);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.append(tag(gradeLabel(trophy.grade), `grade-${trophy.grade}`));
    tags.append(tag(KIND_LABELS[trophy.kind] || trophy.kind, ''));
    if (trophy.count) tags.append(tag(`${trophy.count} ${trophy.target}`, 'count'));
    if (trophy.missable) tags.append(tag('Possibly missable', 'missable'));
    if (trophy.hidden) tags.append(tag('Hidden on PSN', 'hidden-flag'));
    body.append(tags);
    item.append(body);

    const hint = document.createElement('div');
    hint.className = 'spoiler-note';
    hint.textContent = trophy.id === selectedId ? 'Guide open →' : 'Guide →';
    item.append(hint);

    item.addEventListener('click', (event) => {
      if (event.target === box) return;
      onSelect(trophy.id);
    });
    list.append(item);
  }
  if (shown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
    list.append(empty);
  }
}

export function renderDetail(trophy, state, sources) {
  const panel = document.getElementById('detail');
  panel.replaceChildren();
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Pick a trophy on the left to read its guide, its steps and its sources.';
    panel.append(empty);
    return;
  }
  const hidden = storyHidden(trophy, state);
  const heading = document.createElement('h2');
  heading.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  panel.append(heading);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'Official name and description hidden until this trophy is earned (spoiler setting on).'
    : `“${trophy.description}” — official description, ${gradeLabel(trophy.grade)} trophy.`;
  panel.append(official);

  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  tags.append(tag(gradeLabel(trophy.grade), `grade-${trophy.grade}`));
  tags.append(tag(KIND_LABELS[trophy.kind] || trophy.kind, ''));
  if (trophy.count) tags.append(tag(`${trophy.count} ${trophy.target}`, 'count'));
  if (trophy.hidden) tags.append(tag('Hidden on PSN', 'hidden-flag'));
  panel.append(tags);

  if (trophy.missable) {
    const banner = document.createElement('p');
    banner.className = 'missable-banner';
    banner.textContent =
      'Possibly missable — PowerPyx flags this one. Read the guide below before you pass Chapter 1.';
    panel.append(banner);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  panel.append(guideHeading);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden
    ? 'This trophy belongs to the story. Earn it (or turn the spoiler setting off) to read its guide.'
    : trophy.guide;
  panel.append(guide);

  if (!hidden && trophy.steps && trophy.steps.length) {
    const stepsHeading = document.createElement('h3');
    stepsHeading.textContent = 'Steps';
    panel.append(stepsHeading);
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    panel.append(steps);
  }

  if (!hidden) {
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources';
    panel.append(sourcesHeading);
    const list = document.createElement('ul');
    list.className = 'sources';
    for (const key of trophy.sources || []) {
      const source = sources[key];
      if (!source) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.label;
      item.append(link);
      item.append(document.createTextNode(` — ${source.covers}`));
      list.append(item);
    }
    const note = document.createElement('li');
    note.textContent =
      'Guides are this entry’s own words, drawn from the sources above and never copied from them.';
    list.append(note);
    panel.append(list);
  }
}

export function renderRoadmap(trophies, state) {
  const host = document.getElementById('roadmap-stages');
  host.replaceChildren();
  const stages = [
    {
      number: 1,
      title: 'Story and optional missions',
      time: 'About 60 to 80 hours',
      intro:
        'Play the story at your own pace. Along the way, do the things that count later — and do the Chapter 1 meditation before it is gone.',
      trophies: trophies.filter((t) => t.stage === 1),
      notes: [
        'Do the Chapter 1 meditation at Jason’s house (see Missables) — the one thing that may not wait.',
        'Take optional missions as they appear: 100% needs any 100 of them, out of several hundred.',
        'Scan every new vehicle with the WAiNK app: 100% needs 200 of the 277 base models.',
        'Study new animals through the binoculars: 100% needs 100 of 255. You do not have to hunt them.',
        'Turn on progress and criminal profile notifications in the UI settings, so you can see what counts.',
      ],
    },
    {
      number: 2,
      title: 'The 100% checklist and challenges',
      time: 'About 100 hours',
      intro:
        'The checklist appears after the story, under Progress, then Stats, then 100% Completion. Progress made during the story already counts, and nothing on it is missable.',
      trophies: trophies.filter((t) => t.stage === 2),
      notes: [
        'PowerPyx calls the checklist lenient — closer to 60% true completion — but it is still the long stage.',
        'You need 70 of 80 challenges, 15 of 18 meditation spots and 300 stunts.',
        'Robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests need everything.',
        'Most of these trophies land while you clear the checklist — work it line by line.',
      ],
    },
    {
      number: 3,
      title: 'Strangers & Freaks and cleanup',
      time: 'About 10 hours',
      intro:
        'Most trophies should be done by now. Strangers & Freaks is not part of 100%, so you may still need those 8 strands — then clean up anything left and the platinum follows.',
      trophies: trophies.filter((t) => t.stage === 3),
      notes: [
        'Sweep Leonida for stranger markers and finish each strand to its end.',
        'Clear the hidden side trophies: the strands for Andy, Kenton, Billy, Randy, Tyrone and Bret.',
        'The platinum, Vice Got a Price!, pops when the last of the other 54 is yours.',
      ],
    },
  ];
  for (const stage of stages) {
    const card = document.createElement('article');
    card.className = 'stage';
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = `Stage ${stage.number} · ${stage.time}`;
    card.append(meta);
    const heading = document.createElement('h3');
    heading.textContent = stage.title;
    card.append(heading);
    const intro = document.createElement('p');
    intro.textContent = stage.intro;
    card.append(intro);
    const notes = document.createElement('ul');
    for (const note of stage.notes) {
      const item = document.createElement('li');
      item.textContent = note;
      notes.append(item);
    }
    card.append(notes);
    const earnedCount = stage.trophies.filter((t) => isEarned(state, t.id)).length;
    const trophyLine = document.createElement('p');
    trophyLine.innerHTML = '';
    trophyLine.textContent = `Trophies in this stage (${earnedCount}/${stage.trophies.length} earned): ` +
      stage.trophies.map((t) => (storyHidden(t, state) ? 'Hidden story trophy' : t.name)).join(' · ');
    card.append(trophyLine);
    host.append(card);
  }
}

export function renderMissables(trophies, state) {
  const host = document.getElementById('missable-list');
  host.replaceChildren();
  const flagged = trophies.filter((t) => t.missable);
  for (const trophy of flagged) {
    const card = document.createElement('article');
    card.className = 'stage';
    const heading = document.createElement('h3');
    heading.textContent = `${trophy.name} — ${gradeLabel(trophy.grade)}`;
    card.append(heading);
    const banner = document.createElement('p');
    banner.className = 'missable-banner';
    banner.textContent = 'Possibly missable — flagged by PowerPyx; Push Square lists no known missables. Nobody has confirmed it either way yet.';
    card.append(banner);
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    card.append(guide);
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    card.append(steps);
    host.append(card);
  }
  const notMissable = document.getElementById('not-missable-list');
  notMissable.replaceChildren();
  const reassurances = [
    'All 12 story trophies unlock automatically and none can be missed.',
    'Many optional missions disappear after a while — there are far more than you need.',
    'Some quest givers, Kenton for one, go away for part of the story. All trophy quest givers come back and stay after the story.',
    'Some fences leave for good. None of them has a trophy quest.',
    'A few magazine collectibles sit in story buildings that close off. They also spawn elsewhere.',
    'Quests with an hourglass icon can fail on a timer. None is tied to a trophy.',
    'The relationship between Jason and Lucia does not matter for trophies.',
  ];
  for (const line of reassurances) {
    const item = document.createElement('li');
    item.textContent = line;
    notMissable.append(item);
  }
}

export function renderSources(sources) {
  const host = document.getElementById('source-list');
  host.replaceChildren();
  for (const [key, source] of Object.entries(sources)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.label;
    item.append(link);
    item.append(document.createTextNode(` — ${source.covers}`));
    host.append(item);
  }
}
