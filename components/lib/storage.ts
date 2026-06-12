export type Food = {
  id: string;
  name: string;
  carbPer100g: number;   // grams of carb per 100g of food
  protPer100g: number;   // grams of protein per 100g of food
  fatPer100g: number;    // grams of fat per 100g of food
};

// kcal per gram of each macro
const KCAL = { carb: 4, prot: 4, fat: 9 };

export function caloriesPer100g(food: Food): number {
  return food.carbPer100g * KCAL.carb + food.protPer100g * KCAL.prot + food.fatPer100g * KCAL.fat;
}

export function macrosForGrams(food: Food, grams: number) {
  const factor = grams / 100;
  const carb = food.carbPer100g * factor;
  const prot = food.protPer100g * factor;
  const fat  = food.fatPer100g  * factor;
  return {
    carb, prot, fat,
    cal: carb * KCAL.carb + prot * KCAL.prot + fat * KCAL.fat,
  };
}

export type UserProfile = { peso: string; goal: "emagrecer" | "manter" | "crescer" };
const PROFILE_KEY = "calcnutri_profile";
export function loadProfile(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null"); }
  catch { return null; }
}
export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// localStorage keys
const FOODS_KEY = "calcnutri_foods";
const GOAL_KEY  = "calcnutri_daily_goal";

export function loadFoods(): Food[] {
  try { return JSON.parse(localStorage.getItem(FOODS_KEY) ?? "[]"); }
  catch { return []; }
}
export function saveFoods(foods: Food[]): void {
  localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
}

export type PlateItem = { id: string; food: Food; grams: number };

export type Meal = { id: string; name: string; items: PlateItem[] };

const MEALS_KEY = "calcnutri_meals";
export function loadMeals(): Meal[] {
  try { return JSON.parse(localStorage.getItem(MEALS_KEY) ?? "[]"); }
  catch { return []; }
}
export function saveMeals(meals: Meal[]): void {
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
}

const FAVORITES_KEY = "calcnutri_favorites";
export function loadFavorites(): Meal[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
  catch { return []; }
}
export function saveFavorites(favs: Meal[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export type DailyGoal = { cal: number; carb: number; prot: number; lip: number } | null;
export function loadDailyGoal(): DailyGoal {
  try { return JSON.parse(localStorage.getItem(GOAL_KEY) ?? "null"); }
  catch { return null; }
}
export function saveDailyGoal(goal: DailyGoal): void {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}
