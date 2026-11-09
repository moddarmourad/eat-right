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
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Flame,
  Heart,
  History,
  Leaf,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
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
  UserProfile,
} from "@/lib/models";
import { calculateTargets, percentOf, sumNutrition, todayKey } from "@/lib/nutrition";
import { membershipPricing } from "@/lib/membership";
import {
  getAppStateSnapshot,
  getServerSnapshot,
  subscribeToAppState,
  updateAppState,
} from "@/lib/storage";

type View = "today" | "history" | "membership";
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
  const [modal, setModal] = useState<"food" | "barcode" | "profile" | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [meal, setMeal] = useState<MealType>("Breakfast");
  const [barcode, setBarcode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");

  const targets = useMemo(
    () => (app.profile ? calculateTargets(app.profile) : null),
    [app.profile]
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

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const profile: UserProfile = {
      name: String(fields.get("name") || "").trim() || "Friend",
      weightKg: Number(fields.get("weightKg")) || 70,
      heightCm: Number(fields.get("heightCm")) || 170,
      age: Number(fields.get("age")) || 30,
      sexAtBirth: (fields.get("sexAtBirth") as UserProfile["sexAtBirth"]) || "female",
      activityLevel: (fields.get("activityLevel") as ActivityLevel) || "sedentary",
      goal: (fields.get("goal") as Goal) || "maintain",
    };
    updateAppState((state) => ({ ...state, profile }));
    setModal(null);
    showToast("Profile and nutrition targets updated!");
  }

  function logFood(food: FoodItem, selectedMeal = meal) {
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
    showToast("Demo estimate calculated — check and adjust before logging.", 4500);
  }

  const history = useMemo(() => {
    return app.logs.filter((item) =>
      `${item.food.name} ${item.meal} ${item.date}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [app.logs, query]);

  return (
    <main className="app-shell">
      {/* Sidebar */}
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
            <Leaf size={21} />
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
            className={`nav-item ${view === "history" ? "active" : ""}`}
            onClick={() => setView("history")}
          >
            <History size={18} />
            Food history
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
              <Sparkles size={17} />
            </span>
            <strong>
              A little progress
              <br />
              adds up.
            </strong>
            <p>Consistency beats perfection. You&apos;re doing great.</p>
          </div>

          <div
            className="user-chip"
            onClick={() => setModal("profile")}
            title="Click to edit profile & targets"
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
              <strong>{app.profile?.name || "Your profile"}</strong>
              <small>
                {app.membership.status === "active"
                  ? "Eat Right member"
                  : "Free plan"}
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
            title="Nutrition targets are wellness estimates"
            onClick={() =>
              showToast(
                "Targets calculated with the Mifflin–St Jeor formula based on your profile."
              )
            }
          >
            <CircleHelp size={18} />
          </button>
        </header>

        {!app.profile ? (
          <Onboarding onSubmit={saveProfile} />
        ) : view === "membership" ? (
          <Membership app={app} />
        ) : view === "history" ? (
          <section className="content-page">
            <span className="eyebrow">YOUR JOURNEY</span>
            <h1>Food history</h1>
            <p className="page-subtitle">Your logged meals, saved on this device.</p>
            <div className="history-search">
              <Search size={17} />
              <input
                placeholder="Search foods, meals, or dates"
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
              <div className="empty-card">
                <div className="empty-icon">
                  <Utensils size={23} />
                </div>
                <h3>No meals found yet</h3>
                <p>Foods you log will automatically show up here.</p>
                <button
                  className="secondary-button"
                  onClick={() => setView("today")}
                >
                  Go to today <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Today Dashboard */}
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
                <p>Small choices today make a big difference tomorrow.</p>
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

            {/* Overview Cards */}
            <section className="overview-grid">
              <div className="calorie-card">
                <div className="card-top">
                  <div>
                    <span className="card-overline">CALORIES</span>
                    <h2>Daily energy</h2>
                  </div>
                  <span className="round-icon orange">
                    <Flame size={18} />
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
                    <Target size={15} /> Your daily target
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
                    <Leaf size={18} />
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

            {/* Quick Add Section */}
            <section className="section-row">
              <div>
                <span className="eyebrow">KEEP IT SIMPLE</span>
                <h2>Quick add</h2>
              </div>
              <span className="section-hint">Your recent & favorite foods</span>
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
                    <Plus size={17} />
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
                      size={15}
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
                        onClick={() => {
                          setMeal(name);
                          setDraft(blankDraft);
                          setModal("food");
                        }}
                      >
                        <Plus size={15} /> Add food
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
                onClick={() => {
                  setDraft(blankDraft);
                  setModal("food");
                }}
              >
                <span className="tool-icon mint">
                  <Plus size={20} />
                </span>
                <span>
                  <strong>Add food manually</strong>
                  <small>Enter nutrition details</small>
                </span>
                <ArrowRight size={16} className="tool-arrow" />
              </button>

              <button
                className="tool-card"
                onClick={() => {
                  setBarcode("");
                  setModal("barcode");
                }}
              >
                <span className="tool-icon lilac">
                  <Barcode size={20} />
                </span>
                <span>
                  <strong>Scan a barcode</strong>
                  <small>Look up packaged food</small>
                </span>
                <ArrowRight size={16} className="tool-arrow" />
              </button>

              <label className="tool-card upload-tool">
                <span className="tool-icon peach">
                  <Camera size={20} />
                </span>
                <span>
                  <strong>Photo food estimate</strong>
                  <small>Try the demo vision flow</small>
                </span>
                <ArrowRight size={16} className="tool-arrow" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => estimatePhoto(event.target.files?.[0])}
                />
              </label>
            </section>

            <p className="disclaimer">
              <CircleHelp size={14} /> Nutrition estimates and photo demo are
              for general wellness purposes only.
            </p>
          </>
        )}
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={15} />
          </button>
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
                <X size={19} />
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

            {draft.source === "photo" && (
              <p className="modal-note">
                <Sparkles size={15} />
                Demo vision estimate — verify numbers before logging.
              </p>
            )}
            {draft.source === "barcode" && (
              <p className="modal-note">
                <Barcode size={15} />
                Fetched from Open Food Facts database.
              </p>
            )}

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
                <X size={19} />
              </button>
            </div>

            <div className="barcode-illustration">
              <Barcode size={38} />
              <span>
                Enter the product barcode digits below to search Open Food Facts.
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

            <p className="modal-note">
              Nutrition values retrieved will be converted to your serving
              estimate.
            </p>

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
                <span className="eyebrow">SETTINGS & TARGETS</span>
                <h2>Edit profile</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
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
                Weight <span>kg</span>
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
              <label className="field-label">
                Sex at birth
                <select name="sexAtBirth" defaultValue={app.profile.sexAtBirth}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>
            </div>

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
              Update targets <ArrowRight size={17} />
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
          <Sparkles size={15} /> A healthier routine starts here
        </span>
        <h1>
          Let&apos;s make a plan
          <br />
          <em>that fits you.</em>
        </h1>
        <p>
          Tell us a little about yourself. We&apos;ll estimate daily calorie and
          macro targets you can use as a helpful starting point.
        </p>
        <div className="formula-note">
          <Target size={18} />
          <span>
            Calculated with the Mifflin–St Jeor formula and your daily activity
            multiplier.
          </span>
        </div>
      </div>

      <form className="onboarding-card" onSubmit={onSubmit}>
        <div className="card-heading">
          <div>
            <h2>Your starting profile</h2>
            <p>You can adjust these targets at any time.</p>
          </div>
          <span className="step-pill">STEP 1 OF 1</span>
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
            Weight <span>kg</span>
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
          <label className="field-label">
            Sex at birth
            <select name="sexAtBirth">
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
        </div>

        <label className="field-label">
          Activity level
          <select name="activityLevel">
            <option value="sedentary">Mostly sitting</option>
            <option value="light">Lightly active</option>
            <option value="moderate">Moderately active</option>
            <option value="active">Very active</option>
            <option value="very_active">Highly active</option>
          </select>
        </label>

        <label className="field-label">
          Your goal
          <select name="goal">
            <option value="lose">Lose weight gently</option>
            <option value="maintain">Maintain my weight</option>
            <option value="gain">Gain weight</option>
          </select>
        </label>

        <button className="primary-button full-button" type="submit">
          Build my plan <ArrowRight size={17} />
        </button>

        <p className="fine-print">
          Targets are wellness estimates, not medical advice. Consult a
          healthcare professional for specific dietary restrictions.
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
        <Utensils size={16} />
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
        <Heart size={16} fill={favorite ? "currentColor" : "none"} />
      </button>
      {onDelete && (
        <button
          className="delete-button"
          onClick={onDelete}
          aria-label="Delete food entry"
          title="Delete entry"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function Membership({ app }: { app: AppState }) {
  const active = app.membership.status === "active";

  return (
    <section className="membership-page">
      <span className="eyebrow">
        <Sparkles size={15} /> EAT RIGHT MEMBERSHIP
      </span>
      <h1>
        A little more support
        <br />
        <em>for your everyday.</em>
      </h1>
      <p className="page-subtitle">
        Build healthy habits with room to grow. One simple membership, cancel
        any time.
      </p>

      <div className="member-grid">
        <div className="member-benefits">
          <h2>Everything you need to stay on track</h2>
          {[
            "Personal calorie & macro targets",
            "Unlimited food and meal logging",
            "Daily progress and food history",
            "Fast barcode product lookup",
            "Photo estimate demo & favorites",
          ].map((benefit) => (
            <div className="benefit-row" key={benefit}>
              <span>
                <Check size={15} />
              </span>
              {benefit}
            </div>
          ))}
          <p className="fine-print">
            Targets are wellness estimates and are not a substitute for
            professional medical advice.
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
            Billed monthly. That&apos;s {membershipPricing.currency}{" "}
            {membershipPricing.yearly} for 12 months.
          </p>

          <div className="price-divider" />
          <div className="annual-line">
            <span>12-month equivalent</span>
            <strong>
              {membershipPricing.currency} {membershipPricing.yearly} / year
            </strong>
          </div>
          <div className="billing-note">
            <Check size={15} /> No hidden fees · Cancel any time
          </div>

          <button
            className={
              active
                ? "secondary-button full-button"
                : "primary-button full-button"
            }
            onClick={() =>
              updateAppState((state) => ({
                ...state,
                membership: {
                  status: active ? "free" : "active",
                  period: "monthly",
                  renewsAt: active
                    ? undefined
                    : new Date(
                        new Date().setMonth(new Date().getMonth() + 1)
                      ).toISOString(),
                },
              }))
            }
          >
            {active ? "Cancel demo membership" : "Start membership"}
            <ArrowRight size={16} />
          </button>
          <small className="demo-label">
            Demo only — payment checkout is simulated.
          </small>
        </div>
      </div>
    </section>
  );
}
