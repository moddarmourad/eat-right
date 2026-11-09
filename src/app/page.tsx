"use client";

import {
  Suspense,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Barcode,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Clock,
  Download,
  Flame,
  Heart,
  History,
  Leaf,
  Lock,
  Plus,
  RotateCcw,
  Salad,
  Scale,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import type {
  ActivityLevel,
  AppState,
  FoodItem,
  FoodLog,
  Goal,
  MealType,
  Recipe,
  UserProfile,
} from "@/lib/models";
import {
  calculateBmr,
  calculateTargets,
  calculateTdee,
  calculateWaterTarget,
  percentOf,
  sumNutrition,
  todayKey,
} from "@/lib/nutrition";
import { healthyRecipes, findRecipesByIngredients } from "@/lib/recipes";
import { membershipPricing } from "@/lib/membership";
import {
  getAppStateSnapshot,
  getServerSnapshot,
  subscribeToAppState,
  updateAppState,
} from "@/lib/storage";

type View = "today" | "recipes" | "chef" | "progress" | "history" | "membership";
type Draft = Omit<FoodItem, "id">;

const meals: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

const starterFoods: FoodItem[] = [
  { id: "oats", name: "Oats with berries", serving: "1 bowl", calories: 320, protein: 14, carbs: 51, fat: 8 },
  { id: "yogurt", name: "Greek yogurt", serving: "170 g", calories: 130, protein: 18, carbs: 8, fat: 3 },
  { id: "chicken", name: "Chicken & rice bowl", serving: "1 bowl", calories: 485, protein: 38, carbs: 54, fat: 12 },
];

const blankDraft: Draft = {
  name: "",
  serving: "1 serving",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  source: "manual",
};

const commonPantryIngredients = [
  "Cucumber",
  "Tomato",
  "Chicken",
  "Eggs",
  "Avocado",
  "Spinach",
  "Feta",
  "Oats",
  "Salmon",
  "Garlic",
  "Quinoa",
  "Broccoli",
];

function dateLabel(date: string): string {
  if (!date || date === todayKey()) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function offsetDate(date: string, offset: number): string {
  const current = new Date(`${date || todayKey()}T12:00:00`);
  return todayKey(new Date(current.getTime() + offset * 86_400_000));
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8f5]" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const app = useSyncExternalStore(
    subscribeToAppState,
    getAppStateSnapshot,
    getServerSnapshot
  );

  const [view, setView] = useState<View>("today");
  const [day, setDay] = useState(todayKey);
  const [modal, setModal] = useState<"food" | "barcode" | "profile" | "paywall" | "recipeDetail" | null>(null);
  const [paywallFeature, setPaywallFeature] = useState<string>("");
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [meal, setMeal] = useState<MealType>("Breakfast");
  const [barcode, setBarcode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");

  // Pantry Chef state
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(["Cucumber", "Tomato"]);
  const [customIngredientInput, setCustomIngredientInput] = useState("");

  // Recipe filter
  const [recipeCategory, setRecipeCategory] = useState<string>("All");

  const isMember = app.membership.status === "active";

  const targets = useMemo(
    () => (app.profile ? calculateTargets(app.profile) : null),
    [app.profile]
  );

  const waterTarget = useMemo(
    () => (app.profile ? calculateWaterTarget(app.profile.weightKg) : 2500),
    [app.profile]
  );

  const dayWater = useMemo(
    () => (app.waterLogs ? app.waterLogs[day] || 0 : 0),
    [app.waterLogs, day]
  );

  const logs = useMemo(
    () => app.logs.filter((item) => item.date === day),
    [app.logs, day]
  );

  const consumed = useMemo(
    () => sumNutrition(logs.map((item) => item.food)),
    [logs]
  );

  const recent = useMemo(() => {
    const names = new Set<string>();
    return app.logs
      .slice()
      .reverse()
      .map(({ food }) => food)
      .filter((food) => {
        const name = food.name.toLowerCase();
        if (names.has(name)) return false;
        names.add(name);
        return true;
      })
      .slice(0, 3);
  }, [app.logs]);

  function showToast(message: string, duration = 3000) {
    setToast(message);
    window.setTimeout(() => setToast(""), duration);
  }

  function requireMembership(featureName: string, action: () => void) {
    if (isMember) {
      action();
    } else {
      setPaywallFeature(featureName);
      setModal("paywall");
    }
  }

  function activateDemoMembership() {
    updateAppState((state) => ({
      ...state,
      membership: {
        status: "active",
        period: "monthly",
        renewsAt: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      },
    }));
    setModal(null);
    showToast("Eat Right Membership activated! All features unlocked.");
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const weightKg = Number(fields.get("weightKg")) || 70;
    const targetWeightKg = Number(fields.get("targetWeightKg")) || weightKg;

    const profile: UserProfile = {
      name: String(fields.get("name") || "").trim() || "Friend",
      weightKg,
      heightCm: Number(fields.get("heightCm")) || 170,
      age: Number(fields.get("age")) || 30,
      sexAtBirth: (fields.get("sexAtBirth") as UserProfile["sexAtBirth"]) || "female",
      activityLevel: (fields.get("activityLevel") as ActivityLevel) || "sedentary",
      goal: (fields.get("goal") as Goal) || "maintain",
      targetWeightKg,
    };

    updateAppState((state) => {
      const existingHistory = state.weightHistory || [];
      const today = todayKey();
      const hasToday = existingHistory.some((e) => e.date === today);
      const updatedHistory = hasToday
        ? existingHistory.map((e) => (e.date === today ? { ...e, weightKg } : e))
        : [...existingHistory, { date: today, weightKg }];

      return {
        ...state,
        profile,
        weightHistory: updatedHistory,
      };
    });

    setModal(null);
    showToast("Profile & personalized targets updated!");
  }

  function logFood(food: FoodItem, selectedMeal = meal) {
    requireMembership("Unlimited Food Diary Logging", () => {
      const entry: FoodLog = {
        id: crypto.randomUUID(),
        date: day || todayKey(),
        meal: selectedMeal,
        food,
        loggedAt: new Date().toISOString(),
      };
      updateAppState((state) => ({ ...state, logs: [...state.logs, entry] }));
      setModal(null);
      setDraft(blankDraft);
      showToast(`${food.name} added to ${selectedMeal.toLowerCase()}`);
    });
  }

  function logWater(amountDelta: number) {
    const current = dayWater;
    const nextAmount = Math.max(0, current + amountDelta);
    updateAppState((state) => ({
      ...state,
      waterLogs: {
        ...(state.waterLogs || {}),
        [day]: nextAmount,
      },
    }));
    showToast(amountDelta > 0 ? `+${amountDelta} ml water logged` : "Water intake adjusted");
  }

  function deleteFoodLog(id: string) {
    updateAppState((state) => ({
      ...state,
      logs: state.logs.filter((item) => item.id !== id),
    }));
    showToast("Food log removed");
  }

  function saveFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim()) {
      logFood({
        ...draft,
        id: crypto.randomUUID(),
        name: draft.name.trim(),
      });
    }
  }

  function toggleFavorite(name: string) {
    updateAppState((state) => {
      const exists = state.favorites.includes(name);
      return {
        ...state,
        favorites: exists
          ? state.favorites.filter((item) => item !== name)
          : [...state.favorites, name],
      };
    });
  }

  async function lookupBarcode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;
    setLookingUp(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`
      );
      const result = (await response.json()) as {
        status: number;
        product?: {
          product_name?: string;
          serving_size?: string;
          nutriments?: Record<string, number>;
        };
      };

      if (result.status !== 1 || !result.product) {
        throw new Error("No product found for this barcode.");
      }

      const item = result.product;
      const nutrients = item.nutriments ?? {};
      setDraft({
        ...blankDraft,
        name: item.product_name || "Scanned food",
        serving: item.serving_size || "100 g",
        calories: Math.round(
          nutrients["energy-kcal_100g"] ?? nutrients["energy-kcal"] ?? 0
        ),
        protein: Math.round(nutrients.proteins_100g ?? 0),
        carbs: Math.round(nutrients.carbohydrates_100g ?? 0),
        fat: Math.round(nutrients.fat_100g ?? 0),
        barcode: cleanBarcode,
        source: "barcode",
      });
      setModal("food");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not look up that barcode.",
        3500
      );
    } finally {
      setLookingUp(false);
    }
  }

  function estimatePhoto(file?: File) {
    if (!file) return;
    requireMembership("AI Photo Food Estimator", () => {
      const cleanName =
        file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "Photo meal";
      setDraft({
        ...blankDraft,
        name: cleanName,
        serving: "1 plate (estimate)",
        calories: 520,
        protein: 28,
        carbs: 58,
        fat: 19,
        source: "photo",
      });
      setModal("food");
      showToast("Demo photo estimate calculated — adjust and save.", 4500);
    });
  }

  function toggleIngredient(ing: string) {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  }

  function addCustomIngredient(e: FormEvent) {
    e.preventDefault();
    const val = customIngredientInput.trim();
    if (val && !selectedIngredients.includes(val)) {
      setSelectedIngredients((prev) => [...prev, val]);
      setCustomIngredientInput("");
    }
  }

  function logRecipeAsMeal(recipe: Recipe, targetMeal: MealType = "Lunch") {
    logFood(
      {
        id: crypto.randomUUID(),
        name: recipe.title,
        serving: recipe.serving,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        source: "recipe",
      },
      targetMeal
    );
    setModal(null);
  }

  function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eat-right-backup-${todayKey()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Backup exported successfully!");
  }

  function importBackup(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result));
        if (parsed && typeof parsed === "object") {
          updateAppState(() => parsed as AppState);
          showToast("Data restored successfully!");
        }
      } catch {
        showToast("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    if (window.confirm("Are you sure you want to reset all data and start fresh?")) {
      updateAppState(() => ({
        profile: null,
        logs: [],
        favorites: [],
        membership: { status: "free", period: "monthly" },
        waterLogs: {},
        weightHistory: [],
      }));
      setView("today");
      showToast("App data reset.");
    }
  }

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return healthyRecipes.filter((r) => {
      const matchCat = recipeCategory === "All" || r.category === recipeCategory || r.tags.includes(recipeCategory);
      const matchQuery =
        !query.trim() ||
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.ingredients.some((i) => i.toLowerCase().includes(query.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [recipeCategory, query]);

  // Pantry Chef matched recipes
  const chefRecipes = useMemo(() => {
    return findRecipesByIngredients(selectedIngredients);
  }, [selectedIngredients]);

  const history = useMemo(() => {
    return app.logs.filter((item) =>
      `${item.food.name} ${item.meal} ${item.date}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [app.logs, query]);

  return (
    <main className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <a
          className="brand"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setView("today");
          }}
        >
          <span className="brand-mark">
            <Leaf size={22} />
          </span>
          <span>
            eat right<small>YOUR DAILY WELLNESS</small>
          </span>
        </a>

        <div className="nav-label">MENU</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${view === "today" ? "active" : ""}`}
            onClick={() => setView("today")}
          >
            <Apple size={18} />
            Today
          </button>
          <button
            className={`nav-item ${view === "recipes" ? "active" : ""}`}
            onClick={() => setView("recipes")}
          >
            <BookOpen size={18} />
            Healthy Recipes
            {!isMember && <span className="nav-pro-badge">PRO</span>}
          </button>
          <button
            className={`nav-item ${view === "chef" ? "active" : ""}`}
            onClick={() => setView("chef")}
          >
            <Salad size={18} />
            Pantry Chef
            {!isMember && <span className="nav-pro-badge">PRO</span>}
          </button>
          <button
            className={`nav-item ${view === "progress" ? "active" : ""}`}
            onClick={() => setView("progress")}
          >
            <TrendingUp size={18} />
            Goals & Data
          </button>
          <button
            className={`nav-item ${view === "history" ? "active" : ""}`}
            onClick={() => setView("history")}
          >
            <History size={18} />
            Food History
            {!isMember && <span className="nav-pro-badge">PRO</span>}
          </button>
          <button
            className={`nav-item ${view === "membership" ? "active" : ""}`}
            onClick={() => setView("membership")}
          >
            <Sparkles size={18} />
            Membership
            <span className="nav-dot" />
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">
              <Sparkles size={18} />
            </span>
            <strong>
              A little progress
              <br />
              adds up every day.
            </strong>
            <p>Consistency beats perfection. You&apos;re making real progress.</p>
          </div>

          <div
            className="user-chip"
            onClick={() => setModal("profile")}
            title="Click to edit profile & calorie targets"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setModal("profile");
            }}
          >
            <div className="avatar">
              {app.profile?.name.slice(0, 1).toUpperCase() || "E"}
            </div>
            <div>
              <strong>{app.profile?.name || "Your Profile"}</strong>
              <small>
                {isMember ? "✨ Eat Right Member" : "Free Plan (Calculation only)"}
              </small>
            </div>
            <ChevronDown size={16} className="muted-icon" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Leaf size={20} />
            </span>
            eat right
          </div>
          <span className="date-label">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
          <button
            className="help-button"
            title="Nutrition formula details"
            onClick={() =>
              showToast(
                `Mifflin–St Jeor BMR: ${app.profile ? calculateBmr(app.profile) : 1500} kcal. TDEE: ${app.profile ? calculateTdee(app.profile) : 2000} kcal.`
              )
            }
          >
            <CircleHelp size={19} />
          </button>
        </header>

        {/* Onboarding View if no profile */}
        {!app.profile ? (
          <Onboarding onSubmit={saveProfile} />
        ) : view === "membership" ? (
          <Membership app={app} onUpgrade={activateDemoMembership} />
        ) : view === "recipes" ? (
          /* RECIPES VIEW */
          <section className="content-page">
            <div className="welcome-row">
              <div>
                <span className="eyebrow">
                  <BookOpen size={15} /> CURATED NUTRITION
                </span>
                <h1>Healthy Recipes</h1>
                <p className="page-subtitle">
                  Wholesome, delicious recipes with calorie and macro targets ready to log.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="quick-chips-row" style={{ marginTop: 0, marginBottom: 20 }}>
              {["All", "Breakfast", "Lunch", "Dinner", "Salad", "High Protein", "Low Carb"].map((cat) => (
                <button
                  key={cat}
                  className={`ingredient-chip ${recipeCategory === cat ? "active" : ""}`}
                  onClick={() => setRecipeCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="recipes-grid">
              {filteredRecipes.map((recipe, index) => (
                <div className="recipe-card" key={recipe.id}>
                  <div className="recipe-banner">
                    <span className="recipe-category-pill">{recipe.category}</span>
                    <span className="recipe-time-pill">
                      <Clock size={12} /> {recipe.prepTimeMinutes}m
                    </span>
                    <span>{["🥗", "🥑", "🍗", "🥣", "🥣", "🐟", "🌯", "🥜"][index % 8]}</span>
                  </div>
                  <div className="recipe-body">
                    <h3>{recipe.title}</h3>
                    <div className="recipe-macros">
                      <strong>{recipe.calories} kcal</strong>
                      <span>·</span>
                      <span>P {recipe.protein}g</span>
                      <span>·</span>
                      <span>C {recipe.carbs}g</span>
                      <span>·</span>
                      <span>F {recipe.fat}g</span>
                    </div>
                    <div className="recipe-tags">
                      {recipe.tags.map((t) => (
                        <span key={t} className="recipe-tag">{t}</span>
                      ))}
                    </div>
                    <div className="recipe-actions">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setActiveRecipe(recipe);
                          setModal("recipeDetail");
                        }}
                      >
                        View Recipe
                      </button>
                      <button
                        className="primary-button"
                        onClick={() =>
                          requireMembership("Quick Recipe Logging", () =>
                            logRecipeAsMeal(recipe, recipe.category === "Salad" ? "Lunch" : (recipe.category as MealType))
                          )
                        }
                      >
                        <Plus size={15} /> Log to Diary
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : view === "chef" ? (
          /* PANTRY CHEF VIEW */
          <section className="content-page">
            <div className="welcome-row">
              <div>
                <span className="eyebrow">
                  <Salad size={15} /> SMART INGREDIENT MATCH
                </span>
                <h1>Pantry Chef</h1>
                <p className="page-subtitle">
                  Have cucumber, tomato, or whatever is in your fridge? Tell us and we will give you healthy meals to cook.
                </p>
              </div>
            </div>

            <div className="chef-hero">
              <span className="eyebrow">WHAT DO YOU HAVE IN YOUR KITCHEN?</span>
              <h2>Select or type your ingredients</h2>
              <p>
                For example, choose <strong>Cucumber</strong> and <strong>Tomato</strong> to discover delicious Mediterranean salads, gazpacho, and detox bowls.
              </p>

              <div className="quick-chips-row">
                <span>Quick Tap:</span>
                {commonPantryIngredients.map((item) => (
                  <button
                    key={item}
                    className={`ingredient-chip ${selectedIngredients.includes(item) ? "active" : ""}`}
                    onClick={() => toggleIngredient(item)}
                  >
                    {selectedIngredients.includes(item) ? <Check size={13} /> : <Plus size={13} />}
                    {item}
                  </button>
                ))}
              </div>

              <form className="ingredient-input-wrap" onSubmit={addCustomIngredient}>
                <input
                  placeholder="Or type another ingredient (e.g. olive oil, feta, lime)..."
                  value={customIngredientInput}
                  onChange={(e) => setCustomIngredientInput(e.target.value)}
                />
                <button className="primary-button" type="submit">
                  <Plus size={16} /> Add Ingredient
                </button>
              </form>
            </div>

            <div className="section-row">
              <div>
                <span className="eyebrow">COOKING IDEAS</span>
                <h2>Recipes matching: {selectedIngredients.join(", ") || "Everything"}</h2>
              </div>
              <span className="section-hint">{chefRecipes.length} healthy suggestions</span>
            </div>

            <div className="recipes-grid">
              {chefRecipes.map((recipe, index) => (
                <div className="recipe-card" key={recipe.id}>
                  <div className="recipe-banner">
                    <span className="recipe-category-pill">{recipe.category}</span>
                    <span className="recipe-time-pill">
                      <Clock size={12} /> {recipe.prepTimeMinutes}m
                    </span>
                    <span>{["🥗", "🥑", "🍳", "🥣", "🍲"][index % 5]}</span>
                  </div>
                  <div className="recipe-body">
                    <h3>{recipe.title}</h3>
                    <div className="recipe-macros">
                      <strong>{recipe.calories} kcal</strong>
                      <span>·</span>
                      <span>P {recipe.protein}g</span>
                      <span>·</span>
                      <span>C {recipe.carbs}g</span>
                      <span>·</span>
                      <span>F {recipe.fat}g</span>
                    </div>
                    <div className="recipe-tags">
                      {recipe.tags.map((t) => (
                        <span key={t} className="recipe-tag">{t}</span>
                      ))}
                    </div>
                    <div className="recipe-actions">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setActiveRecipe(recipe);
                          setModal("recipeDetail");
                        }}
                      >
                        Instructions
                      </button>
                      <button
                        className="primary-button"
                        onClick={() =>
                          requireMembership("Pantry Chef Meal Logging", () =>
                            logRecipeAsMeal(recipe, "Lunch")
                          )
                        }
                      >
                        <Plus size={15} /> Log to Diary
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : view === "progress" ? (
          /* GOALS & DATA TRACKING VIEW */
          <section className="content-page">
            <div className="welcome-row">
              <div>
                <span className="eyebrow">
                  <TrendingUp size={15} /> CLIENT GOALS & DATA
                </span>
                <h1>Track Your Goals</h1>
                <p className="page-subtitle">
                  Your milestone tracking, weight history, and device-saved nutrition data.
                </p>
              </div>
              <button className="primary-button" onClick={exportBackup}>
                <Download size={16} /> Export Backup
              </button>
            </div>

            {/* 4 Stat Metric Cards */}
            <div className="stats-grid-4">
              <div className="stat-metric-card">
                <small>Current Weight</small>
                <strong>{app.profile.weightKg} kg</strong>
              </div>
              <div className="stat-metric-card">
                <small>Goal Weight</small>
                <strong>{app.profile.targetWeightKg || app.profile.weightKg} kg</strong>
              </div>
              <div className="stat-metric-card">
                <small>Daily Target</small>
                <strong>{targets?.calories.toLocaleString()} kcal</strong>
              </div>
              <div className="stat-metric-card">
                <small>Total Meals Logged</small>
                <strong>{app.logs.length}</strong>
              </div>
            </div>

            <div className="progress-grid">
              {/* Weight Milestone Progress */}
              <div className="goal-card">
                <div className="card-top">
                  <div>
                    <span className="card-overline">WEIGHT MILESTONE</span>
                    <h2>Progress toward goal</h2>
                  </div>
                  <span className="round-icon green">
                    <Scale size={20} />
                  </span>
                </div>
                <div className="goal-metric">
                  <strong>{app.profile.weightKg} kg</strong>
                  <span>Target: {app.profile.targetWeightKg || app.profile.weightKg} kg</span>
                </div>
                <div className="progress-track calorie-track">
                  <span style={{ width: "70%" }} />
                </div>
                <p style={{ marginTop: 14, color: "#6e8175", fontSize: 13 }}>
                  Goal: {app.profile.goal === "lose" ? "Gentle weight loss (-400 kcal deficit)" : app.profile.goal === "gain" ? "Lean mass building (+300 kcal surplus)" : "Weight maintenance"}.
                </p>
              </div>

              {/* Hydration Tracker */}
              <div className="goal-card">
                <div className="card-top">
                  <div>
                    <span className="card-overline">DAILY HYDRATION</span>
                    <h2>Water intake goal</h2>
                  </div>
                  <span className="round-icon blue">
                    <DropletIcon size={20} />
                  </span>
                </div>
                <div className="goal-metric">
                  <strong>{(dayWater / 1000).toFixed(1)} L</strong>
                  <span>Target: {(waterTarget / 1000).toFixed(1)} L ({Math.round(waterTarget / 250)} glasses)</span>
                </div>
                <div className="water-bar">
                  <span style={{ width: `${percentOf(dayWater, waterTarget)}%` }} />
                </div>
                <div className="water-actions" style={{ marginTop: 16 }}>
                  <button className="water-btn" onClick={() => logWater(250)}>
                    +250 ml Glass
                  </button>
                  <button className="water-btn" onClick={() => logWater(500)}>
                    +500 ml Bottle
                  </button>
                  <button className="water-btn subtle" onClick={() => logWater(-250)}>
                    -250 ml
                  </button>
                </div>
              </div>
            </div>

            {/* Data Management Section */}
            <div className="panel-card" style={{ padding: 26, marginTop: 24 }}>
              <div className="card-top">
                <div>
                  <span className="card-overline">DATA MANAGEMENT & PRIVACY</span>
                  <h2>Client data is saved on this device</h2>
                </div>
                <span className="round-icon green">
                  <Target size={20} />
                </span>
              </div>
              <p style={{ color: "#6b7c71", marginTop: 8, fontSize: 13.5 }}>
                Your logs, weight check-ins, water intake, and customized calorie targets are securely stored in local storage and persist across browser sessions.
              </p>
              <div className="data-actions" style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button className="secondary-button" onClick={exportBackup}>
                  <Download size={16} /> Download JSON Data
                </button>
                <label className="secondary-button" style={{ cursor: "pointer" }}>
                  <Upload size={16} /> Restore from JSON
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: "none" }}
                    onChange={(e) => importBackup(e.target.files?.[0])}
                  />
                </label>
                <button className="danger-button" onClick={resetAllData}>
                  <RotateCcw size={16} /> Reset All Data
                </button>
              </div>
            </div>
          </section>
        ) : view === "history" ? (
          /* FOOD HISTORY VIEW */
          <section className="content-page">
            <span className="eyebrow">YOUR JOURNEY</span>
            <h1>Food history</h1>
            <p className="page-subtitle">Your logged meals, saved on this device.</p>
            <div className="history-search" style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid var(--line)", padding: "0 16px", borderRadius: 12, height: 48, margin: "20px 0" }}>
              <Search size={18} />
              <input
                style={{ border: 0, outline: "none", width: "100%", fontSize: 14 }}
                placeholder="Search logged foods, meals, or dates..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {history.length ? (
              <div className="history-list">
                {history
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <FoodRow
                      key={entry.id}
                      log={entry}
                      favorite={app.favorites.includes(entry.food.name)}
                      onFavorite={() => toggleFavorite(entry.food.name)}
                      onDelete={() => deleteFoodLog(entry.id)}
                    />
                  ))}
              </div>
            ) : (
              <div className="empty-card" style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px dashed var(--line)" }}>
                <div className="empty-icon" style={{ margin: "0 auto", width: 50, height: 50, borderRadius: 14, background: "#edf6ef", display: "grid", placeItems: "center", color: "#23845b" }}>
                  <Utensils size={24} />
                </div>
                <h3 style={{ marginTop: 16 }}>No meals found yet</h3>
                <p style={{ color: "#7f9084" }}>Foods you log in your daily diary will appear here.</p>
                <button
                  className="secondary-button"
                  style={{ marginTop: 12 }}
                  onClick={() => setView("today")}
                >
                  Go to today <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        ) : (
          /* TODAY DASHBOARD VIEW */
          <>
            <section className="welcome-row">
              <div>
                <span className="eyebrow">YOUR DAILY CHECK-IN</span>
                <h1>
                  Good{" "}
                  {new Date().getHours() < 12
                    ? "morning"
                    : new Date().getHours() < 17
                    ? "afternoon"
                    : "evening"}
                  , {app.profile.name.split(" ")[0]}{" "}
                  <span className="wave">✳</span>
                </h1>
                <p>Small daily choices compound into life-changing wellness.</p>
              </div>
              <div className="date-switch">
                <button
                  aria-label="Previous day"
                  onClick={() => setDay((d) => offsetDate(d, -1))}
                >
                  <ArrowLeft size={16} />
                </button>
                <span>{dateLabel(day)}</span>
                <button
                  aria-label="Next day"
                  onClick={() => setDay((d) => offsetDate(d, 1))}
                  disabled={day >= todayKey()}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            {/* Overview Cards (Calories & Balanced Plate) */}
            <section className="overview-grid">
              <div className="calorie-card">
                <div className="card-top">
                  <div>
                    <span className="card-overline">CALORIES</span>
                    <h2>Daily energy</h2>
                  </div>
                  <span className="round-icon orange">
                    <Flame size={20} />
                  </span>
                </div>
                <div className="calorie-meter">
                  <div className="meter-copy">
                    <strong>{consumed.calories.toLocaleString()}</strong>
                    <span> / {targets?.calories.toLocaleString()} kcal</span>
                  </div>
                  <div className="progress-track calorie-track">
                    <span
                      style={{
                        width: `${percentOf(
                          consumed.calories,
                          targets?.calories || 1
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="meter-footer">
                    <span>
                      {Math.max(
                        0,
                        (targets?.calories || 0) - consumed.calories
                      ).toLocaleString()}{" "}
                      kcal left
                    </span>
                    <span>
                      {percentOf(consumed.calories, targets?.calories || 1)}%
                    </span>
                  </div>
                </div>
                <div className="calorie-bottom">
                  <span>
                    <Target size={16} /> Daily target (Mifflin–St Jeor)
                  </span>
                  <strong>{targets?.calories.toLocaleString()} kcal</strong>
                </div>
              </div>

              <div className="macro-card">
                <div className="card-top">
                  <div>
                    <span className="card-overline">MACRONUTRIENTS</span>
                    <h2>Balanced plate</h2>
                  </div>
                  <span className="round-icon green">
                    <Leaf size={20} />
                  </span>
                </div>
                <MacroProgress
                  label="Protein"
                  value={consumed.protein}
                  target={targets?.protein || 0}
                  tone="protein"
                />
                <MacroProgress
                  label="Carbs"
                  value={consumed.carbs}
                  target={targets?.carbs || 0}
                  tone="carbs"
                />
                <MacroProgress
                  label="Fat"
                  value={consumed.fat}
                  target={targets?.fat || 0}
                  tone="fat"
                />
              </div>
            </section>

            {/* Hydration Tracker Card */}
            <div className="water-card">
              <div className="water-left">
                <span className="round-icon blue">
                  <DropletIcon size={20} />
                </span>
                <div className="water-copy">
                  <strong>Water Intake: {dayWater} ml</strong>
                  <span>Target: {waterTarget} ml ({Math.round(waterTarget / 250)} glasses)</span>
                </div>
              </div>
              <div className="water-progress-wrap">
                <div className="water-bar">
                  <span style={{ width: `${percentOf(dayWater, waterTarget)}%` }} />
                </div>
                <div className="water-bar-footer">
                  <span>{percentOf(dayWater, waterTarget)}% hydrated</span>
                  <span>{Math.max(0, waterTarget - dayWater)} ml remaining</span>
                </div>
              </div>
              <div className="water-actions">
                <button className="water-btn" onClick={() => logWater(250)}>
                  <Plus size={14} /> 250ml
                </button>
                <button className="water-btn" onClick={() => logWater(500)}>
                  <Plus size={14} /> 500ml
                </button>
                <button className="water-btn subtle" onClick={() => logWater(-250)} title="Remove 250ml">
                  -250
                </button>
              </div>
            </div>

            {/* Quick Add Section */}
            <section className="section-row">
              <div>
                <span className="eyebrow">KEEP IT SIMPLE</span>
                <h2>Quick add foods</h2>
              </div>
              <span className="section-hint">Your favorites & starter items</span>
            </section>

            <section className="quick-grid">
              {(recent.length ? recent : starterFoods).map((food, index) => (
                <button
                  key={food.id}
                  className="quick-card"
                  onClick={() => logFood(food)}
                >
                  <span className={`food-emoji food-${index % 3}`}>
                    {["🥣", "🥑", "🍓"][index % 3]}
                  </span>
                  <span className="quick-info">
                    <strong>{food.name}</strong>
                    <small>
                      {food.calories} kcal · {food.serving}
                    </small>
                  </span>
                  <span className="quick-add">
                    <Plus size={18} />
                  </span>
                  <span
                    className="quick-heart"
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(food.name);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.stopPropagation();
                        toggleFavorite(food.name);
                      }
                    }}
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      size={16}
                      fill={
                        app.favorites.includes(food.name)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </span>
                </button>
              ))}
            </section>

            {/* Meal Diary */}
            <section className="section-row meal-title-row">
              <div>
                <span className="eyebrow">YOUR FOOD DIARY</span>
                <h2>Today&apos;s meals</h2>
              </div>
              <label className="meal-select-label">
                Log to
                <select
                  value={meal}
                  onChange={(event) => setMeal(event.target.value as MealType)}
                >
                  {meals.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className="diary-card">
              {meals.map((name) => {
                const entries = logs.filter((entry) => entry.meal === name);
                const mealCalories = entries.reduce(
                  (total, entry) => total + entry.food.calories,
                  0
                );
                return (
                  <div className="meal-group" key={name}>
                    <div className="meal-heading">
                      <div>
                        <span className="meal-dot" />
                        <strong>{name}</strong>
                        <small>
                          {entries.length
                            ? `${entries.length} item${
                                entries.length === 1 ? "" : "s"
                              }`
                            : "Nothing logged yet"}
                        </small>
                      </div>
                      <strong className="meal-kcal">{mealCalories} kcal</strong>
                    </div>

                    {entries.map((entry) => (
                      <FoodRow
                        key={entry.id}
                        log={entry}
                        favorite={app.favorites.includes(entry.food.name)}
                        onFavorite={() => toggleFavorite(entry.food.name)}
                        onDelete={() => deleteFoodLog(entry.id)}
                      />
                    ))}

                    {!entries.length && (
                      <button
                        className="add-meal-link"
                        onClick={() =>
                          requireMembership("Food Diary Logging", () => {
                            setMeal(name);
                            setDraft(blankDraft);
                            setModal("food");
                          })
                        }
                      >
                        <Plus size={16} /> Add food
                      </button>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Quick Logging Tools */}
            <section className="tools-grid">
              <button
                className="tool-card"
                onClick={() =>
                  requireMembership("Food Logging", () => {
                    setDraft(blankDraft);
                    setModal("food");
                  })
                }
              >
                <span className="tool-icon mint">
                  <Plus size={22} />
                </span>
                <span>
                  <strong>Add food manually</strong>
                  <small>Enter nutrition details</small>
                </span>
                <ArrowRight size={17} className="tool-arrow" />
              </button>

              <button
                className="tool-card"
                onClick={() =>
                  requireMembership("Barcode Product Lookup", () => {
                    setBarcode("");
                    setModal("barcode");
                  })
                }
              >
                {!isMember && <span className="locked-tool-badge">MEMBER</span>}
                <span className="tool-icon lilac">
                  <Barcode size={22} />
                </span>
                <span>
                  <strong>Scan a barcode</strong>
                  <small>Open Food Facts database</small>
                </span>
                <ArrowRight size={17} className="tool-arrow" />
              </button>

              <label
                className="tool-card upload-tool"
                onClick={(e) => {
                  if (!isMember) {
                    e.preventDefault();
                    setPaywallFeature("AI Photo Food Estimator");
                    setModal("paywall");
                  }
                }}
              >
                {!isMember && <span className="locked-tool-badge">MEMBER</span>}
                <span className="tool-icon peach">
                  <Camera size={22} />
                </span>
                <span>
                  <strong>Photo food estimate</strong>
                  <small>Try the demo vision flow</small>
                </span>
                <ArrowRight size={17} className="tool-arrow" />
                {isMember && (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => estimatePhoto(event.target.files?.[0])}
                  />
                )}
              </label>
            </section>

            <p className="disclaimer">
              <CircleHelp size={15} /> Free plan includes calorie & macro formula calculations. Food logging, barcode scanning, and recipe tools are part of the Eat Right Membership.
            </p>
          </>
        )}
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Paywall / Upgrade Modal */}
      {modal === "paywall" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card paywall-modal" onClick={(e) => e.stopPropagation()}>
            <div className="paywall-icon">
              <Lock size={28} />
            </div>
            <span className="eyebrow" style={{ justifyContent: "center", marginBottom: 6 }}>
              EAT RIGHT MEMBERSHIP
            </span>
            <h2>Unlock {paywallFeature || "Premium Features"}</h2>
            <p>
              The <strong>Free Plan</strong> covers calculating your daily Mifflin–St Jeor calorie & macro targets.
              Upgrade to the membership for unlimited logging, barcode lookup, photo analysis, and the Pantry Chef.
            </p>

            <div className="plan-comparison-box">
              <div>
                <Check size={16} /> <strong>Free:</strong> BMR, TDEE, Calorie & Macro Target Calculations
              </div>
              <div>
                <Check size={16} /> <strong>Member:</strong> Unlimited food logging & daily diary
              </div>
              <div>
                <Check size={16} /> <strong>Member:</strong> Barcode scanner & Open Food Facts database
              </div>
              <div>
                <Check size={16} /> <strong>Member:</strong> Healthy recipe menu & ingredient chef
              </div>
              <div>
                <Check size={16} /> <strong>Member:</strong> Hydration & goal progress tracking
              </div>
            </div>

            <button className="primary-button full-button" onClick={activateDemoMembership}>
              Start Membership (AED {membershipPricing.monthly}/mo) <ArrowRight size={17} />
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: "#8b9c91" }}>
              Cancel anytime. Simulated demo checkout.
            </p>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {modal === "recipeDetail" && activeRecipe && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{activeRecipe.category} RECIPE</span>
                <h2>{activeRecipe.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setModal(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="recipe-macros" style={{ marginBottom: 16 }}>
              <strong>{activeRecipe.calories} kcal</strong>
              <span>·</span>
              <span>Protein: {activeRecipe.protein}g</span>
              <span>·</span>
              <span>Carbs: {activeRecipe.carbs}g</span>
              <span>·</span>
              <span>Fat: {activeRecipe.fat}g</span>
              <span>·</span>
              <span>Prep: {activeRecipe.prepTimeMinutes} mins</span>
            </div>

            <h4 style={{ margin: "16px 0 8px", fontSize: 14 }}>Ingredients:</h4>
            <ul style={{ paddingLeft: 20, margin: 0, color: "#4a5d51", fontSize: 13.5 }}>
              {activeRecipe.ingredients.map((ing, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{ing}</li>
              ))}
            </ul>

            <h4 style={{ margin: "20px 0 8px", fontSize: 14 }}>Step-by-Step Instructions:</h4>
            <ol style={{ paddingLeft: 20, margin: 0, color: "#4a5d51", fontSize: 13.5 }}>
              {activeRecipe.instructions.map((step, i) => (
                <li key={i} style={{ marginBottom: 8, lineHeight: 1.5 }}>{step}</li>
              ))}
            </ol>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button
                className="primary-button full-button"
                onClick={() =>
                  requireMembership("Recipe Logging", () =>
                    logRecipeAsMeal(activeRecipe, "Lunch")
                  )
                }
              >
                <Plus size={16} /> Log This Meal ({activeRecipe.calories} kcal)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      {modal === "food" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form
            className="modal-card"
            onSubmit={saveFood}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">FOOD DIARY</span>
                <h2>Add food</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label className="field-label">
              Food name
              <input
                autoFocus
                required
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="e.g. Avocado toast"
              />
            </label>

            <div className="field-grid">
              <label className="field-label">
                Serving
                <input
                  required
                  value={draft.serving}
                  onChange={(event) =>
                    setDraft({ ...draft, serving: event.target.value })
                  }
                />
              </label>

              <label className="field-label">
                Meal
                <select
                  value={meal}
                  onChange={(event) =>
                    setMeal(event.target.value as MealType)
                  }
                >
                  {meals.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-grid nutrition-inputs">
              <label className="field-label">
                Calories (kcal)
                <input
                  required
                  type="number"
                  min="0"
                  value={draft.calories || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      calories: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field-label">
                Protein (g)
                <input
                  required
                  type="number"
                  min="0"
                  value={draft.protein || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      protein: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field-label">
                Carbs (g)
                <input
                  required
                  type="number"
                  min="0"
                  value={draft.carbs || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      carbs: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field-label">
                Fat (g)
                <input
                  required
                  type="number"
                  min="0"
                  value={draft.fat || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      fat: Number(event.target.value) || 0,
                    })
                  }
                />
              </label>
            </div>

            <button className="primary-button full-button" type="submit">
              Add to diary <Plus size={17} />
            </button>
          </form>
        </div>
      )}

      {/* Barcode Lookup Modal */}
      {modal === "barcode" && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form
            className="modal-card"
            onSubmit={lookupBarcode}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">PRODUCT LOOKUP</span>
                <h2>Scan a barcode</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", background: "#f0f7f1", padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <Barcode size={36} color="#257e57" />
              <span style={{ fontSize: 13, color: "#4f6356", lineHeight: 1.4 }}>
                Enter product barcode digits to look up instant nutrition from Open Food Facts.
              </span>
            </div>

            <label className="field-label">
              Barcode number
              <input
                autoFocus
                inputMode="numeric"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="e.g. 737628064502 or 3017620422003"
              />
            </label>

            <button
              className="primary-button full-button"
              disabled={lookingUp || !barcode.trim()}
              type="submit"
            >
              {lookingUp ? "Looking up…" : "Look up product"}
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      )}

      {/* Profile & Targets Modal */}
      {modal === "profile" && app.profile && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form
            className="modal-card"
            onSubmit={saveProfile}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">SETTINGS & FORMULA</span>
                <h2>Edit Profile & Targets</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formula Stats Box */}
            <div className="stats-box">
              <div className="stat-pill">
                <small>BMR</small>
                <strong>{calculateBmr(app.profile)} kcal</strong>
              </div>
              <div className="stat-pill">
                <small>TDEE</small>
                <strong>{calculateTdee(app.profile)} kcal</strong>
              </div>
              <div className="stat-pill">
                <small>Hydration</small>
                <strong>{waterTarget} ml</strong>
              </div>
            </div>

            <label className="field-label">
              Your name
              <input
                required
                name="name"
                defaultValue={app.profile.name}
                placeholder="Your name"
              />
            </label>

            <div className="field-grid">
              <label className="field-label">
                Current Weight <span>kg</span>
                <input
                  required
                  name="weightKg"
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  defaultValue={app.profile.weightKg}
                />
              </label>
              <label className="field-label">
                Target Weight <span>kg</span>
                <input
                  required
                  name="targetWeightKg"
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  defaultValue={app.profile.targetWeightKg || app.profile.weightKg}
                />
              </label>
              <label className="field-label">
                Height <span>cm</span>
                <input
                  required
                  name="heightCm"
                  type="number"
                  min="100"
                  max="250"
                  defaultValue={app.profile.heightCm}
                />
              </label>
              <label className="field-label">
                Age <span>years</span>
                <input
                  required
                  name="age"
                  type="number"
                  min="16"
                  max="100"
                  defaultValue={app.profile.age}
                />
              </label>
            </div>

            <label className="field-label">
              Sex at birth
              <select name="sexAtBirth" defaultValue={app.profile.sexAtBirth}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>

            <label className="field-label">
              Activity level
              <select
                name="activityLevel"
                defaultValue={app.profile.activityLevel}
              >
                <option value="sedentary">Mostly sitting (sedentary)</option>
                <option value="light">Lightly active (1-3 days/wk)</option>
                <option value="moderate">Moderately active (3-5 days/wk)</option>
                <option value="active">Very active (6-7 days/wk)</option>
                <option value="very_active">Highly active (physical work)</option>
              </select>
            </label>

            <label className="field-label">
              Your goal
              <select name="goal" defaultValue={app.profile.goal}>
                <option value="lose">Lose weight gently (-400 kcal)</option>
                <option value="maintain">Maintain current weight</option>
                <option value="gain">Build mass / gain (+300 kcal)</option>
              </select>
            </label>

            <button className="primary-button full-button" type="submit">
              Update Targets <ArrowRight size={17} />
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function Onboarding({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="onboarding-wrap">
      <div className="onboarding-copy">
        <span className="eyebrow">
          <Sparkles size={16} /> A healthier routine starts here
        </span>
        <h1>
          Let&apos;s build a plan
          <br />
          <em>that fits you.</em>
        </h1>
        <p>
          Tell us about yourself. We calculate your exact Mifflin–St Jeor BMR, Total Daily Energy Expenditure (TDEE), and daily macro distribution.
        </p>
        <div className="formula-note">
          <Target size={20} />
          <span>
            Free Plan provides scientifically calculated calorie & macro targets tailored to your body and activity level.
          </span>
        </div>
      </div>

      <form className="onboarding-card" onSubmit={onSubmit}>
        <div className="card-heading">
          <div>
            <h2>Your starting profile</h2>
            <p>You can adjust these targets at any time.</p>
          </div>
          <span className="step-pill">FREE CALCULATOR</span>
        </div>

        <label className="field-label">
          Your name
          <input
            required
            name="name"
            placeholder="e.g. Alex"
            autoComplete="given-name"
          />
        </label>

        <div className="field-grid">
          <label className="field-label">
            Current Weight <span>kg</span>
            <input
              required
              name="weightKg"
              type="number"
              min="30"
              max="300"
              step="0.1"
              placeholder="70"
            />
          </label>
          <label className="field-label">
            Target Weight <span>kg</span>
            <input
              required
              name="targetWeightKg"
              type="number"
              min="30"
              max="300"
              step="0.1"
              placeholder="65"
            />
          </label>
          <label className="field-label">
            Height <span>cm</span>
            <input
              required
              name="heightCm"
              type="number"
              min="100"
              max="250"
              placeholder="170"
            />
          </label>
          <label className="field-label">
            Age <span>years</span>
            <input
              required
              name="age"
              type="number"
              min="16"
              max="100"
              placeholder="30"
            />
          </label>
        </div>

        <label className="field-label">
          Sex at birth
          <select name="sexAtBirth">
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>

        <label className="field-label">
          Activity level
          <select name="activityLevel">
            <option value="sedentary">Mostly sitting (sedentary)</option>
            <option value="light">Lightly active (1-3 workouts/wk)</option>
            <option value="moderate">Moderately active (3-5 workouts/wk)</option>
            <option value="active">Very active (6-7 intense days)</option>
            <option value="very_active">Highly active (physical labor)</option>
          </select>
        </label>

        <label className="field-label">
          Your goal
          <select name="goal">
            <option value="lose">Lose weight gently (-400 kcal)</option>
            <option value="maintain">Maintain my weight</option>
            <option value="gain">Build mass & strength (+300 kcal)</option>
          </select>
        </label>

        <button className="primary-button full-button" type="submit">
          Calculate My Targets <ArrowRight size={17} />
        </button>

        <p className="fine-print">
          Targets are wellness estimates, not medical advice. Consult a healthcare professional for specific restrictions.
        </p>
      </form>
    </section>
  );
}

function MacroProgress({
  label,
  value,
  target,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  tone: string;
}) {
  return (
    <div className="macro-row">
      <div className="macro-label">
        <span className={`macro-dot ${tone}`} />
        <span>{label}</span>
        <strong>
          {value} <small>/ {target} g</small>
        </strong>
      </div>
      <div className={`progress-track macro-track ${tone}`}>
        <span style={{ width: `${percentOf(value, target)}%` }} />
      </div>
    </div>
  );
}

function FoodRow({
  log,
  onFavorite,
  favorite,
  onDelete,
}: {
  log: FoodLog;
  onFavorite: () => void;
  favorite: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="food-row">
      <span className="food-row-icon">
        <Utensils size={18} />
      </span>
      <div className="food-row-name">
        <strong>{log.food.name}</strong>
        <small>
          {log.food.serving} · P {log.food.protein}g · C {log.food.carbs}g · F{" "}
          {log.food.fat}g
        </small>
      </div>
      <strong className="food-row-calories">
        {log.food.calories} <small>kcal</small>
      </strong>
      <button
        className="favorite-button"
        onClick={onFavorite}
        aria-label="Toggle favorite"
        title={favorite ? "Remove from favorites" : "Save as favorite"}
      >
        <Heart size={17} fill={favorite ? "currentColor" : "none"} />
      </button>
      {onDelete && (
        <button
          className="delete-button"
          onClick={onDelete}
          aria-label="Delete food entry"
          title="Delete entry"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function Membership({ app, onUpgrade }: { app: AppState; onUpgrade: () => void }) {
  const active = app.membership.status === "active";

  return (
    <section className="membership-page">
      <span className="eyebrow">
        <Sparkles size={16} /> EAT RIGHT MEMBERSHIP
      </span>
      <h1>
        A little more support
        <br />
        <em>for your everyday wellness.</em>
      </h1>
      <p className="page-subtitle">
        Free plan covers calorie and macro target calculations. Membership unlocks the full suite of daily tracking tools.
      </p>

      <div className="member-grid">
        <div className="member-benefits">
          <h2>Everything included in Membership:</h2>
          {[
            "Full food diary & unlimited meal logging",
            "Open Food Facts instant barcode product lookup",
            "Curated healthy recipe library with one-click logging",
            "Pantry Chef: find what to cook with your ingredients",
            "Hydration & water intake tracker",
            "Client goals & weight milestone tracking",
            "Local backup export and restore anytime",
          ].map((benefit) => (
            <div className="benefit-row" key={benefit}>
              <span>
                <Check size={16} />
              </span>
              {benefit}
            </div>
          ))}
          <p className="fine-print">
            Targets are wellness estimates and are not a substitute for professional medical advice.
          </p>
        </div>

        <div className="price-card">
          <div className="price-tag">SIMPLE PRICING</div>
          <div className="price">
            <span>{membershipPricing.currency}</span>
            <strong>{membershipPricing.monthly}</strong>
            <small>/ month</small>
          </div>
          <p>
            Billed monthly. Equivalent to {membershipPricing.currency}{" "}
            {membershipPricing.yearly} for 12 months.
          </p>

          <div className="price-divider" style={{ borderTop: "1px solid var(--line)", margin: "16px 0" }} />
          <div className="annual-line" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7c71" }}>
            <span>12-month equivalent</span>
            <strong>
              {membershipPricing.currency} {membershipPricing.yearly} / year
            </strong>
          </div>
          <div className="billing-note" style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0", fontSize: 13, color: "#23845b" }}>
            <Check size={16} /> No hidden fees · Cancel any time
          </div>

          <button
            className={
              active
                ? "secondary-button full-button"
                : "primary-button full-button"
            }
            onClick={() => {
              if (active) {
                updateAppState((state) => ({
                  ...state,
                  membership: { status: "free", period: "monthly" },
                }));
              } else {
                onUpgrade();
              }
            }}
          >
            {active ? "Cancel demo membership" : "Start membership"}
            <ArrowRight size={17} />
          </button>
          <small className="demo-label" style={{ display: "block", textAlign: "center", marginTop: 12, color: "#8c9e93", fontSize: 12 }}>
            Demo mode — instant activation without charging.
          </small>
        </div>
      </div>
    </section>
  );
}

function DropletIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
