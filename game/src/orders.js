// Dapur Senja — OrderBoard: spawn, tick, complete and expire customer orders.
// Scoring and tips live here; the kitchen asks it what a served dish is worth.

import { RECIPES, MAX_ORDERS, PATIENCE_START, PATIENCE_MIN, ORDER_SPAWN_START, ORDER_SPAWN_MIN } from './config.js';

let orderSeq = 0;

export function makeOrder(level, recipeId) {
  const recipe = recipeId
    ? RECIPES.find((r) => r.id === recipeId)
    : RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const patience = Math.max(PATIENCE_MIN, PATIENCE_START - (level - 1) * 4);
  orderSeq += 1;
  return {
    id: orderSeq,
    recipeId: recipe.id,
    name: recipe.name,
    price: recipe.price,
    ingredients: [...recipe.ingredients],
    patience,
    maxPatience: patience,
    color: recipe.color,
  };
}

export class OrderBoard {
  constructor() {
    this.orders = [];
    this.spawnTimer = 3.0;
    this.served = 0;
    this.expired = 0;
    this.earned = 0;
  }

  reset() {
    this.orders = [];
    this.spawnTimer = 3.0;
    this.served = 0;
    this.expired = 0;
    this.earned = 0;
  }

  spawnInterval(level) {
    return Math.max(ORDER_SPAWN_MIN, ORDER_SPAWN_START - (level - 1) * 0.8);
  }

  tick(dt, level, onNewOrder) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < MAX_ORDERS) {
      this.orders.push(makeOrder(level));
      this.spawnTimer = this.spawnInterval(level);
      if (onNewOrder) onNewOrder();
    }
    for (const o of this.orders) o.patience -= dt;
    const lost = this.orders.filter((o) => o.patience <= 0);
    if (lost.length) {
      this.orders = this.orders.filter((o) => o.patience > 0);
      this.expired += lost.length;
      return lost;
    }
    return [];
  }

  // Serve a dish by recipe id. Returns the payout or null when no order matches.
  completeOrder(recipeId, combo) {
    const idx = this.orders.findIndex((o) => o.recipeId === recipeId);
    if (idx < 0) return null;
    const order = this.orders[idx];
    this.orders.splice(idx, 1);
    const patienceFrac = Math.max(0, order.patience / order.maxPatience);
    const tip = Math.round(50 * patienceFrac);
    const comboBonus = Math.min(combo, 5) * 5;
    const total = order.price + tip + comboBonus;
    this.served += 1;
    this.earned += total;
    return { order, tip, comboBonus, total, patienceFrac };
  }

  // A complete dish with no matching order still sells as a walk-in, half price.
  walkInPrice(recipeId) {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    return recipe ? Math.round(recipe.price / 2) : 0;
  }

  addSeedOrders(recipeIds, patienceFrac) {
    this.orders = recipeIds.map((id) => {
      const o = makeOrder(1, id);
      o.patience = o.maxPatience * (patienceFrac ?? 0.7);
      return o;
    });
  }
}
