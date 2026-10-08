const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

// Exercise the shipped single-file app without running its browser startup.
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
function createApp() {
  const storage = new Map();
  const context = vm.createContext({
    window: { addEventListener() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    history: { replaceState() {} },
    location: { pathname: '/' },
    console,
  });
  vm.runInContext(script, context);
  return {
    context,
    run: code => vm.runInContext(code, context),
    state: vm.runInContext('state', context),
  };
}
const item = (id, begin, type = 'tv') => ({
  title: `Subject ${id}`, begin, type,
  sites: id ? [{ site: 'bangumi', id }] : [],
});
const defaultTypes = { tv: true, web: true, movie: false, ova: false };
const ids = items => Array.from(items, it => it.sites.find(s => s.site === 'bangumi').id);

test('July includes early premieres from June 21 through the full day of September 20', () => {
  const { context } = createApp();
  const items = [
    item('0', '2026-06-20T15:59:59.999Z'),
    item('1', '2026-06-20T16:00:00.000Z'),
    item('2', '2026-06-30T13:00:00.000Z'),
    item('3', '2026-07-10T12:00:00.000Z'),
    item('4', '2026-08-01T12:00:00.000Z'),
    item('5', '2026-09-20T15:59:59.999Z'),
    item('6', '2026-09-20T16:00:00.000Z'),
    item('7', '2026-10-01T12:00:00.000Z'),
    item('8', '2026-10-10T12:00:00.000Z'),
  ];
  assert.deepEqual(ids(context.filterItems(items, 2026, 3, defaultTypes)), ['1', '2', '3', '4', '5']);
  assert.deepEqual(ids(context.filterItems(items, 2026, 4, defaultTypes)), ['6', '7', '8']);
});

test('all four quarters honor their shifted boundaries, including year rollover', () => {
  const { context } = createApp();
  const boundaries = [
    ['2025-12-22', '2026-03-22'],
    ['2026-03-22', '2026-06-21'],
    ['2026-06-21', '2026-09-21'],
    ['2026-09-21', '2026-12-22'],
  ];
  const allItems = [];
  boundaries.forEach(([start, end], index) => {
    const times = [Date.parse(start + 'T00:00:00+08:00'), Date.parse(end + 'T00:00:00+08:00')];
    const subjects = [times[0] - 1, times[0], times[1] - 1, times[1]]
      .map((time, i) => item(String(index * 4 + i), new Date(time).toISOString()));
    assert.deepEqual(ids(context.filterItems(subjects, 2026, index + 1, defaultTypes)),
      [String(index * 4 + 1), String(index * 4 + 2)]);
    allItems.push(...subjects);
  });
  const quarterIds = [1, 2, 3, 4].flatMap(q => ids(context.filterItems(allItems, 2026, q, defaultTypes)));
  assert.deepEqual(new Set(ids(context.filterItems(allItems, 2026, 0, defaultTypes))), new Set(quarterIds));
  assert.equal(new Set(quarterIds).size, quarterIds.length);
});

test('timestamps with different explicit offsets identify the same boundary instant', () => {
  const { context } = createApp();
  for (const begin of [
    '2026-09-20T16:00:00Z',
    '2026-09-21T00:00:00+08:00',
    '2026-09-21T01:00:00+09:00',
    '2026-09-20T09:00:00-07:00',
  ]) {
    const subjects = [item('1', begin)];
    assert.equal(context.getBeginTimestamp(subjects[0]), Date.parse('2026-09-20T16:00:00Z'), begin);
    assert.equal(context.filterItems(subjects, 2026, 3, defaultTypes).length, 0, begin);
    assert.equal(context.filterItems(subjects, 2026, 4, defaultTypes).length, 1, begin);
  }
});

test('late September premieres belong only to October', () => {
  const { context } = createApp();
  const subjects = [20, 21, 25, 26, 30].map(day => item(String(day), `2026-09-${day}`));
  assert.deepEqual(ids(context.filterItems(subjects, 2026, 3, defaultTypes)), ['20']);
  assert.deepEqual(ids(context.filterItems(subjects, 2026, 4, defaultTypes)), ['21', '25', '26', '30']);
});

test('date-only and month-only values keep their calendar month', () => {
  const { context } = createApp();
  const items = [item('1', '2026-07'), item('2', '2026-09-20'), item('3', '2026-10')];
  assert.deepEqual(ids(context.filterItems(items, 2026, 3, defaultTypes)), ['1', '2']);
});

test('missing, ambiguous, and invalid dates do not create phantom seasons', () => {
  const { context } = createApp();
  for (const begin of [undefined, null, '', 2026, '2026', '2026-00', '2026-13',
    '2026-02-29', '2026-09-31T00:00:00Z', '2026-07-00', '2026-07-32',
    '2026-07-01T12:00:00', '2026-07-01T25:00:00Z', '2026-07-invalid']) {
    const subject = item('1', begin);
    assert.equal(context.getBeginTimestamp(subject), null, String(begin));
    assert.equal(context.filterItems([subject], 2026, 0, defaultTypes).length, 0, String(begin));
  }
  assert.equal(context.getBeginTimestamp(item('1', '2024-02-29')), Date.parse('2024-02-29T00:00:00+08:00'));
  assert.equal(context.getBeginTimestamp(null), null);
});

test('type filters and Bangumi ID deduplication operate after date selection', () => {
  const { context } = createApp();
  const items = [
    item('1', '2026-06-01'), item('1', '2026-07-01'),
    item('1', '2026-07-02', 'web'), item('2', '2026-07-03', 'web'),
    item('3', '2026-07-04', 'movie'), item('4', '2026-07-05', 'ova'),
    item(null, '2026-07-01'),
  ];
  const before = JSON.stringify(items);
  assert.deepEqual(ids(context.filterItems(items, 2026, 3, defaultTypes)), ['1', '2']);
  assert.deepEqual(ids(context.filterItems(items, 2026, 3, { movie: true, ova: true })), ['3', '4']);
  assert.deepEqual(ids(context.filterItems(items, 2026, 3, {})), []);
  assert.equal(JSON.stringify(items), before);
});

test('year/season selector index agrees with filtering at UTC month and year boundaries', () => {
  const { context } = createApp();
  const items = [item('1', '2025-12-31T16:00:00Z'), item('2', '2026-09-30T16:30:00Z')];
  const index = context.buildYearSeasonIndex(items);
  assert.deepEqual(Object.keys(index), ['2026']);
  assert.deepEqual(Array.from(index[2026]), [1, 4]);
  for (const season of index[2026]) {
    assert.equal(context.filterItems(items, 2026, season, defaultTypes).length, 1);
  }
});

test('early premieres enable only their assigned quarter, including the next year', () => {
  const { context } = createApp();
  const items = [item('1', '2025-12-22'), item('2', '2026-09-25'), item('3', '2026-12-27')];
  const index = context.buildYearSeasonIndex(items);
  assert.deepEqual(Object.keys(index), ['2026', '2027']);
  assert.deepEqual(Array.from(index[2026]), [1, 4]);
  assert.deepEqual(Array.from(index[2027]), [1]);
  for (const [year, seasons] of Object.entries(index)) {
    for (let season = 1; season <= 4; season++) {
      assert.equal(seasons.has(season), context.filterItems(items, Number(year), season, defaultTypes).length > 0);
    }
  }
});

function prepareSavedApp() {
  const app = createApp();
  Object.assign(app.state, {
    rawItems: [item('1', '2026-07-01'), item('2', '2026-09-01'),
      item('2', '2026-09-02'), item('3', '2026-10-01'), item('4', '2026-10-05')],
    currentYear: 2026, currentSeason: 3,
    itemsById: { upl_test: { _kind: 'upl', addedAt: 1 } },
  });
  app.context.saved = {
    year: 2026, season: 3, typeFilter: defaultTypes,
    tierRows: [{ id: 'r_test', label: 'S', color: '#e74c3c', itemIds: ['bgm_1', 'bgm_3'], note: 'Keep note' }],
    trayIds: ['bgm_2', 'bgm_2', 'bgm_4'],
    itemComments: { bgm_3: 'Keep cross-season ranking' },
  };
  // Only replace browser UI; exercise the real selection and persistence functions.
  app.run('refreshSelectors = () => {}; renderAll = () => {}; toast = () => {};');
  return app;
}

function assertRestored(app) {
  assert.deepEqual(Array.from(app.state.trayIds), ['upl_test', 'bgm_2']);
  assert.deepEqual(Array.from(app.state.tierRows[0].itemIds), ['bgm_1', 'bgm_3']);
  assert.equal(app.state.itemsById.bgm_3.begin, '2026-10-01');
  assert.equal(app.state.itemComments.bgm_3, 'Keep cross-season ranking');
}

test('rebuilding the tray discards stale out-of-season and duplicate cards, preserving ranked works', () => {
  const app = prepareSavedApp();
  app.run('state.tierRows = saved.tierRows; state.itemComments = saved.itemComments; hydrateAllRefs(); rebuildTrayIds();');
  assertRestored(app);
});

test('named archives rebuild their tray using the corrected filter', () => {
  const app = prepareSavedApp();
  app.run('saveSlot("regression", saved); loadSlotByName("regression");');
  assertRestored(app);
  assert.equal(app.state.tierRows[0].note, 'Keep note');
});

test('JSON imports rebuild their tray using the corrected filter', async () => {
  const app = prepareSavedApp();
  await app.context.importJSON({ text: async () => JSON.stringify({ state: app.context.saved }) });
  assertRestored(app);
  assert.equal(app.state.tierRows[0].note, 'Keep note');
});

test('share restoration filters the tray but preserves explicit cross-season rankings and comments', () => {
  const app = prepareSavedApp();
  app.context.applyShareSpec({
    year: 2026, season: 3, typeFilter: defaultTypes,
    rows: [{ label: 'S', color: '#e74c3c', ids: ['1', '3'] }],
    comments: { r: [[0, 'Keep note']], i: [[0, 1, 'Keep cross-season ranking']] },
  });
  assertRestored(app);
  assert.equal(app.state.tierRows[0].note, 'Keep note');
});
