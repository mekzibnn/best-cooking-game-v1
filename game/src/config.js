// Dapur Senja — config: recipes, ingredients, stations, palette, tuning.
// One clear job: every number and name the rest of the game reads lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const DAY_SECONDS = 120;
export const MAX_ORDERS = 3;

export const COLORS = {
  cream: '#FFF3D6',
  paper: '#FFEFC2',
  wall: '#F7D9A0',
  floor: '#E8B96F',
  floorDark: '#D9A85C',
  wood: '#8A5A2B',
  woodDark: '#6B4420',
  counter: '#B0713A',
  counterTop: '#E9C07A',
  teal: '#1F7A6D',
  tealDark: '#14594F',
  terracotta: '#D95D39',
  tomato: '#C0392B',
  gold: '#F2B705',
  ink: '#3B2416',
  muted: '#7A5C3E',
  white: '#FFFDF6',
  green: '#4C9A3F',
  red: '#D64541',
  blue: '#3E7CB1',
};

export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',   short: 'NASI',   color: '#FFF8E7', prep: 'cook',     prepLabel: 'Masak',  icon: 'bowl' },
  mie:    { id: 'mie',    name: 'Mie',    short: 'MIE',    color: '#F2C14E', prep: 'cook',     prepLabel: 'Rebus',  icon: 'noodle' },
  ayam:   { id: 'ayam',   name: 'Ayam',   short: 'AYAM',   color: '#E8A87C', prep: 'chopcook', prepLabel: 'Cincang+Masak', icon: 'drumstick' },
  telur:  { id: 'telur',  name: 'Telur',  short: 'TELUR',  color: '#F7E8A0', prep: 'cook',     prepLabel: 'Goreng', icon: 'egg' },
  sayur:  { id: 'sayur',  name: 'Sayur',  short: 'SAYUR',  color: '#6FBF44', prep: 'chop',     prepLabel: 'Iris',   icon: 'leaf' },
  sambal: { id: 'sambal', name: 'Sambal', short: 'SAMBAL', color: '#D64541', prep: 'ready',    prepLabel: 'Siap',   icon: 'chili' },
};

export const INGREDIENT_ORDER = ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'sambal'];

export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 100,
    ingredients: ['nasi', 'telur', 'ayam'],
    blurb: 'Nasi + Telur + Ayam',
    color: '#D95D39',
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', price: 90,
    ingredients: ['mie', 'ayam', 'sayur'],
    blurb: 'Mie + Ayam + Sayur',
    color: '#F2B705',
  },
  {
    id: 'soto-senja', name: 'Soto Senja', price: 110,
    ingredients: ['nasi', 'ayam', 'sayur', 'sambal'],
    blurb: 'Nasi + Ayam + Sayur + Sambal',
    color: '#3E7CB1',
  },
  {
    id: 'telur-dadar', name: 'Telur Dadar', price: 70,
    ingredients: ['telur', 'sayur'],
    blurb: 'Telur + Sayur',
    color: '#4C9A3F',
  },
];

export function findRecipeByIngredients(ids) {
  const sorted = [...ids].sort().join(',');
  return RECIPES.find((r) => [...r.ingredients].sort().join(',') === sorted) || null;
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Stations: x, y, w, h in canvas space. Kitchen floor runs y 210..700.
export const STATIONS = {
  crates: INGREDIENT_ORDER.map((id, i) => ({
    kind: 'crate', ingredient: id,
    x: 36 + i * 118, y: 228, w: 106, h: 92,
    label: INGREDIENTS[id].name,
  })),
  board: { kind: 'board', x: 764, y: 228, w: 200, h: 92, label: 'TALENAN' },
  stove: { kind: 'stove', x: 996, y: 228, w: 248, h: 92, label: 'KOMPOR' },
  plating: { kind: 'plating', x: 764, y: 452, w: 220, h: 100, label: 'PIRING SAJI' },
  serving: { kind: 'serving', x: 1016, y: 452, w: 228, h: 100, label: 'JENDELA SAJIAN' },
  trash: { kind: 'trash', x: 36, y: 452, w: 110, h: 100, label: 'BUANG' },
  plates: { kind: 'plates', x: 164, y: 452, w: 110, h: 100, label: 'PIRING' },
  book: { kind: 'book', x: 292, y: 452, w: 150, h: 100, label: 'BUKU RESEP' },
};

export const PLAYER_START = { x: 620, y: 600 };
export const PLAYER_SPEED = 300;
export const CHOP_SECONDS = 1.2;
export const COOK_SECONDS = 2.0;
export const ORDER_SPAWN_START = 8.0;
export const ORDER_SPAWN_MIN = 4.5;
export const PATIENCE_START = 55;
export const PATIENCE_MIN = 32;
