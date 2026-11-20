// Vice Ledger — filtering and display rules for the checklist.
// Pure helpers: they read the trophy data and the player's progress and say
// what a row should show. The spoiler rule lives here so every view applies
// it the same way: while spoilers are hidden, an unearned story trophy shows
// neither its real name nor its official description.

export const KIND_LABELS = {
  story: 'Story',
  collectible: 'Collectibles',
  activity: 'Activities',
};

/** Whether this trophy counts as story for the spoiler rule and the Story filter. */
export function isStory(trophy) {
  return trophy.kind === 'story';
}

/** A story trophy is veiled until earned while the spoiler setting is on. */
export function isVeiled(trophy, progress) {
  return progress.spoilers && isStory(trophy) && progress.earned[trophy.id] !== true;
}

export function displayName(trophy, progress) {
  return isVeiled(trophy, progress) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, progress) {
  return isVeiled(trophy, progress) ? 'Its name and description stay hidden until you earn it.' : trophy.description;
}

/** The kind filter's five positions: every trophy, one kind, or the missable flag. */
export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

export function matchesGrade(trophy, grade) {
  return grade === 'all' || trophy.grade === grade;
}

export function matchesState(trophy, progress, state) {
  if (state === 'all') return true;
  const earned = progress.earned[trophy.id] === true;
  return state === 'earned' ? earned : !earned;
}

/** Free text against the trophy's name, description, kind and guide. */
export function matchesSearch(trophy, query) {
  if (query === '') return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.kind} ${trophy.guide}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

export function trophyMatches(trophy, progress, filters) {
  return (
    matchesKind(trophy, filters.kind) &&
    matchesGrade(trophy, filters.grade) &&
    matchesState(trophy, progress, filters.state) &&
    matchesSearch(trophy, filters.query)
  );
}

/** Earned tallies for the header: overall, and per grade for the platinum maths. */
export function earnedTallies(trophies, progress) {
  const tally = { total: 0, platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (progress.earned[trophy.id] === true) {
      tally.total += 1;
      tally[trophy.grade] += 1;
    }
  }
  return tally;
}

/** A counted trophy's progress as a fraction of its PlayStation target, capped at 1. */
export function countFraction(trophy, progress) {
  if (typeof trophy.count !== 'number') return null;
  const done = progress.counts[trophy.id] ?? 0;
  return Math.min(1, done / trophy.count);
}
