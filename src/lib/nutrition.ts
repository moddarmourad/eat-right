import type { ActivityLevel, DailyTargets, Goal, Nutrition, UserProfile } from "@/lib/models";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin–St Jeor Basal Metabolic Rate (BMR) */
export function calculateBmr(profile: UserProfile): number {
  const sexOffset = profile.sexAtBirth === "male" ? 5 : -161;
  return Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset);
}

/** Total Daily Energy Expenditure (TDEE / maintenance calories) */
export function calculateTdee(profile: UserProfile): number {
  const bmr = calculateBmr(profile);
  return Math.round(bmr * activityMultipliers[profile.activityLevel]);
}

/** Daily recommended water intake in ml (approx 35ml per kg body weight, rounded to 250ml) */
export function calculateWaterTarget(weightKg: number): number {
  return Math.max(1500, Math.round((weightKg * 35) / 250) * 250);
}

/** Mifflin–St Jeor BMR, adjusted by activity and a moderate goal delta. */
export function calculateTargets(profile: UserProfile): DailyTargets {
  const maintenance = calculateTdee(profile);
  const goalDelta: Record<Goal, number> = { lose: -400, maintain: 0, gain: 300 };
  const calories = Math.max(1200, Math.round(maintenance + goalDelta[profile.goal]));

  // Protein: 1.6 g/kg, fat: 27% of calories; carbs use the remaining calories.
  const protein = Math.round(profile.weightKg * 1.6);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function todayKey(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function percentOf(value: number, target: number): number {
  return target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
}