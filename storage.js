/* ============================================================
   ПЛАНИРОВЩИК — storage.js
   Работа с localStorage: сохранение/загрузка расписания,
   темы, режима недели, настроек
   ============================================================ */

const STORAGE_KEYS = {
  EVENTS_A:   'planner_events_a',   // расписание недели A (нечётная)
  EVENTS_B:   'planner_events_b',   // расписание недели B (чётная)
  WEEK_MODE:  'planner_week_mode',  // 'single' | 'ab'
  THEME:      'planner_theme',
  GUEST_DATA: 'planner_guest',      // временно загруженное чужое расписание
};

/** Возвращает номер ISO-недели для даты */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/** Определяет тип текущей недели: 'a' (нечётная) или 'b' (чётная) */
function currentWeekType(weekOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + weekOffset * 7);
  return getISOWeek(now) % 2 === 1 ? 'a' : 'b';
}

/* ── Расписание ── */

function loadEvents(slot) {
  const key = slot === 'b' ? STORAGE_KEYS.EVENTS_B : STORAGE_KEYS.EVENTS_A;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : getDefaultEvents(slot);
  } catch { return getDefaultEvents(slot); }
}

function saveEvents(slot, data) {
  const key = slot === 'b' ? STORAGE_KEYS.EVENTS_B : STORAGE_KEYS.EVENTS_A;
  localStorage.setItem(key, JSON.stringify(data));
}

/** Пример данных при первом запуске */
function getDefaultEvents(slot) {
  if (slot === 'b') {
    return {
      0:[{title:'Физика — задачи гл.3', time:'09:00', type:'hw', note:'Задачи 3.1–3.5', remind:0}],
      1:[{title:'История — параграф 12', time:'10:00', type:'hw', note:'', remind:0}],
      2:[],
      3:[{title:'Математика — тест', time:'11:00', type:'ev', note:'Подготовиться к главе 4', remind:30}],
      4:[],
      5:[{title:'Музыка', time:'14:00', type:'ot', note:'', remind:10}],
      6:[]
    };
  }
  return {
    0:[
      {title:'Алгебра — упражнения 14–18', time:'09:00', type:'hw', note:'Стр. 56, чётные задачи.', remind:15},
      {title:'Олимпиада по физике',         time:'14:00', type:'ev', note:'Актовый зал, 2 этаж.', remind:30}
    ],
    1:[
      {title:'Биология — параграф 5', time:'08:30', type:'hw', note:'Выучить термины.', remind:0},
      {title:'Репетиция хора',         time:'16:00', type:'ot', note:'', remind:10}
    ],
    2:[],
    3:[
      {title:'Сочинение по литературе', time:'10:00', type:'hw', note:'Тема: «Образ Раскольникова».', remind:0},
      {title:'Контрольная по химии',    time:'12:00', type:'ev', note:'Валентность, реакции.', remind:30}
    ],
    4:[{title:'Физкультура', time:'15:00', type:'ot', note:'Взять форму!', remind:20}],
    5:[
      {title:'Рисование — акварель',        time:'11:00', type:'ot', note:'', remind:0},
      {title:'Геометрия — задачи стр. 45',  time:'09:00', type:'hw', note:'№ 1–6 с чертежами.', remind:0}
    ],
    6:[]
  };
}

/* ── Режим недели ── */

function loadWeekMode() {
  return localStorage.getItem(STORAGE_KEYS.WEEK_MODE) || 'single';
}

function saveWeekMode(mode) {
  localStorage.setItem(STORAGE_KEYS.WEEK_MODE, mode);
}

/* ── Тема ── */

function loadTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || '';
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

/* ── Синхронизация: экспорт / импорт ── */

/**
 * Сжимает расписание в строку-код для передачи другому пользователю.
 * Формат: base64(JSON({a, b, mode}))
 */
function exportCode(eventsA, eventsB, mode) {
  const payload = { a: eventsA, b: eventsB, mode };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/**
 * Разбирает код, полученный от другого пользователя.
 * Возвращает { a, b, mode } или null при ошибке.
 */
function importCode(code) {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const data = JSON.parse(json);
    if (!data.a) return null;
    return data;
  } catch { return null; }
}

/* ── Гостевые данные ── */

function saveGuestData(data) {
  localStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(data));
}

function loadGuestData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GUEST_DATA);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearGuestData() {
  localStorage.removeItem(STORAGE_KEYS.GUEST_DATA);
}
