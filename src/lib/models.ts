export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type SexAtBirth = "female" | "male";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type BillingPeriod = "monthly" | "yearly";
export type MembershipStatus = "free" | "active" | "cancelled";

export interface UserProfile {
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  sexAtBirth: SexAtBirth;
  activityLevel: ActivityLevel;
  goal: Goal;
  targetWeightKg?: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem extends Nutrition {
  id: string;
  name: string;
  serving: string;
  barcode?: string;
  source?: "manual" | "barcode" | "photo" | "recipe";
}

export interface FoodLog {
  id: string;
  date: string;
  meal: MealType;
  food: FoodItem;
  loggedAt: string;
}

export type DailyTargets = Nutrition;

export interface Membership {
  status: MembershipStatus;
  period: BillingPeriod;
  renewsAt?: string;
}

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface Recipe {
  id: string;
  title: string;
  category: "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Salad";
  prepTimeMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

export interface AppState {
  profile: UserProfile | null;
  logs: FoodLog[];
  favorites: string[];
  membership: Membership;
  waterLogs?: Record<string, number>;
  weightHistory?: WeightEntry[];
}
