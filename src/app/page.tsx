'use client';
import { useState, useEffect } from 'react';
import { membershipPricing } from '@/lib/membership';
import ContactPhone from '@/app/components/ContactPhone';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  image: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isPro: boolean;
}

const foodDatabase: FoodItem[] = [
  {
    id: '1',
    name: 'Avocado & Egg Toast',
    category: 'Breakfast',
    image: '🥑',
    ingredients: ['Whole grain bread', 'Avocado', 'Egg', 'Salt & Pepper', 'Olive oil'],
    calories: 350,
    protein: 14,
    carbs: 28,
    fat: 20,
    isPro: false,
  },
  {
    id: '2',
    name: 'Grilled Salmon & Quinoa Bowl',
    category: 'Dinner',
    image: '🐟',
    ingredients: ['Fresh Salmon fillet', 'Organic Quinoa', 'Asparagus', 'Lemon herb dressing'],
    calories: 520,
    protein: 38,
    carbs: 42,
    fat: 22,
    isPro: true,
  },
  {
    id: '3',
    name: 'High-Protein Peanut Butter Smoothie',
    category: 'Snack',
    image: '🥤',
    ingredients: ['Whey protein', 'Peanut butter', 'Almond milk', 'Banana', 'Chia seeds'],
    calories: 410,
    protein: 30,
    carbs: 35,
    fat: 16,
    isPro: true,
  },
  {
    id: '4',
    name: 'Greek Yogurt & Berry Parfait',
    category: 'Breakfast',
    image: '🫐',
    ingredients: ['Greek yogurt', 'Mixed berries', 'Honey', 'Granola', 'Almonds'],
    calories: 310,
    protein: 20,
    carbs: 40,
    fat: 8,
    isPro: false,
  },
  {
    id: '5',
    name: 'Chicken Breast & Potato Mash',
    category: 'Lunch',
    image: '🍗',
    ingredients: ['Chicken', 'Potatoes', 'Broccoli', 'Olive oil', 'Garlic powder'],
    calories: 480,
    protein: 45,
    carbs: 38,
    fat: 12,
    isPro: false,
  },
  {
    id: '6',
    name: 'Mediterranean Cucumber Salad',
    category: 'Lunch',
    image: '🥒',
    ingredients: ['Cucumber', 'Tomato', 'Feta cheese', 'Olive oil', 'Olives'],
    calories: 280,
    protein: 8,
    carbs: 12,
    fat: 22,
    isPro: false,
  },
  {
    id: '7',
    name: 'Chicken Potato & Cucumber Skillet',
    category: 'Dinner',
    image: '🍳',
    ingredients: ['Chicken', 'Potatoes', 'Cucumber', 'Garlic', 'Olive oil'],
    calories: 510,
    protein: 42,
    carbs: 45,
    fat: 14,
    isPro: false,
  }
];

const QUICK_INGREDIENTS = ['Chicken', 'Potatoes', 'Cucumber', 'Tomato', 'Avocado', 'Egg', 'Feta', 'Salmon', 'Quinoa'];

export default function EatRightApp() {
  const [isPro, setIsPro] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'chef'>('recipes');

  // Pantry Chef state
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['Chicken', 'Potatoes']);
  const [customInput, setCustomInput] = useState('');

  // Recipe catalog search & category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const stored = localStorage.getItem('eat_right_pro');
    if (stored === 'true') setIsPro(true);
  }, []);

  // After payment succeeds via the webhook, the success page sets this flag.
  useEffect(() => {
    const pending = localStorage.getItem('eat_right_pro_pending');
    if (pending === 'true') {
      localStorage.setItem('eat_right_pro', 'true');
      localStorage.removeItem('eat_right_pro_pending');
      setIsPro(true);
    }
  }, []);

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'monthly' }),
      });
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch {
      alert('Could not start payment. Please try again.');
    }
  };

  const toggleIngredient = (ing: string) => {
    if (selectedIngredients.includes(ing)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== ing));
    } else {
      setSelectedIngredients([...selectedIngredients, ing]);
    }
  };

  const addCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const formatted = customInput.trim();
    if (!selectedIngredients.includes(formatted)) {
      setSelectedIngredients([...selectedIngredients, formatted]);
    }
    setCustomInput('');
  };

  // Pantry Chef Matching: Recipes that contain ANY selected pantry ingredients
  const chefRecipes = foodDatabase.filter(food => {
    if (selectedIngredients.length === 0) return true;
    return food.ingredients.some(ing =>
      selectedIngredients.some(selected => ing.toLowerCase().includes(selected.toLowerCase()))
    );
  });

  // Full Recipe Catalog Filter
  const filteredCatalog = foodDatabase.filter(food => {
    const matchesCat = selectedCategory === 'All' || food.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || food.name.toLowerCase().includes(q) || food.ingredients.some(i => i.toLowerCase().includes(q));
    return matchesCat && matchesQ;
  });

  return (
    <div className="min-h-screen bg-[#f7f9f6] text-[#192b23] flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#e3ebe3] p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#23845b] text-white flex items-center justify-center text-xl font-bold shadow-md">
            🥗
          </div>
          <div>
            <h1 className="font-extrabold text-lg">Eat Right</h1>
            <span className="text-[10px] tracking-widest text-[#8fa095] font-bold uppercase">Nutrition Guide</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${activeTab === 'recipes' ? 'bg-[#eaf5ee] text-[#23845b]' : 'text-[#55665d] hover:bg-[#f0f6ef]'}`}
          >
            <span>📖</span> Healthy Recipes
          </button>
          <button
            onClick={() => setActiveTab('chef')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${activeTab === 'chef' ? 'bg-[#eaf5ee] text-[#23845b]' : 'text-[#55665d] hover:bg-[#f0f6ef]'}`}
          >
            <span>🍳</span> Pantry Chef
          </button>
        </nav>

        {!isPro && (
          <div className="bg-[#f3f7f0] border border-[#e5ede3] p-4 rounded-2xl mt-auto">
            <span className="text-xl mb-2 block">🔒</span>
            <strong className="text-sm block text-[#192b23]">Unlock Pro Access</strong>
            <p className="text-xs text-[#728479] mt-1 mb-3">Get unlimited recipes and advanced macros.</p>
            <button
              onClick={handleUpgrade}
              className="w-full bg-[#23845b] hover:bg-[#1c6d4a] text-white py-2 rounded-xl text-xs font-bold shadow transition"
            >
              Upgrade ({membershipPricing.monthly} AED)
            </button>
          </div>
        )}
      </aside>

      {/* Contact Phone UI (mobile) */}
      <div className="mb-4 md:hidden">
        <ContactPhone />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-[#e3ebe3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#38845b] tracking-wider uppercase mb-1">
              <span>✦</span> {activeTab === 'recipes' ? 'Full Catalog' : 'Kitchen Inventory'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {activeTab === 'recipes' ? 'Healthy Recipes Database' : 'Pantry Chef: What can you cook?'}
            </h1>
            {/* Contact Phone UI (header) */}
            <div className="hidden md:block mt-2">
              <ContactPhone />
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setActiveTab(activeTab === 'recipes' ? 'chef' : 'recipes')}
              className="bg-[#23845b] text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              {activeTab === 'recipes' ? '🍳 Pantry Chef' : '📖 Recipes'}
            </button>
          </div>
        </header>

        {/* TAB 1: PANTRY CHEF */}
        {activeTab === 'chef' && (
          <div>
            <div className="bg-gradient-to-br from-[#eaf6ec] to-[#f4f9f2] border border-[#d9ebdc] rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
              <h2 className="text-lg font-bold mb-2">Select what you have in your kitchen:</h2>
              <p className="text-xs text-[#697c70] mb-4">Click ingredients below or type your own to discover instant matching meals.</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {QUICK_INGREDIENTS.map((ing) => {
                  const selected = selectedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleIngredient(ing)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        selected
                          ? 'bg-[#23845b] text-white shadow'
                          : 'bg-white border border-[#d4e5d7] text-[#3b5043] hover:bg-[#eaf4eb]'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '} {ing}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={addCustomIngredient} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type any other ingredient (e.g., olive oil, garlic)..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-white border border-[#c7decb] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#23845b]"
                />
                <button type="submit" className="bg-[#23845b] hover:bg-[#1c6d4a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow">
                  Add
                </button>
              </form>
            </div>

            <h3 className="text-base font-bold mb-4">
              Matching Recipes ({chefRecipes.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chefRecipes.map((food) => {
                const locked = food.isPro && !isPro;
                return (
                  <div key={food.id} className="bg-white border border-[#e3ebe3] rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="text-4xl mb-4 p-3 bg-[#eaf5ee] w-14 h-14 rounded-2xl flex items-center justify-center">
                      {food.image}
                    </div>
                    <h3 className="font-bold text-lg text-[#192b23]">{food.name}</h3>
                    <p className="text-xs font-semibold text-[#7d8e84] mb-4 uppercase tracking-wider">
                      {food.category} • {food.calories} kcal
                    </p>

                    <div className={`transition flex-1 ${locked ? 'filter blur-sm select-none opacity-40' : ''}`}>
                      <h4 className="text-xs font-bold uppercase text-[#7d8e84] mb-2 tracking-wider">Ingredients:</h4>
                      <ul className="text-sm text-[#4a5c53] space-y-1.5">
                        {food.ingredients.map((ing, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#23845b]"></span>
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {locked && (
                      <div className="absolute inset-0 bg-[#192b23]/75 backdrop-blur-[4px] flex flex-col items-center justify-center text-white p-6 text-center">
                        <span className="text-3xl mb-2">🔒</span>
                        <p className="font-bold text-base mb-1">Pro Access Required</p>
                        <button onClick={handleUpgrade} className="mt-2 bg-white text-[#192b23] text-xs font-extrabold px-4 py-2 rounded-xl shadow">
                          Unlock via Ziina ({membershipPricing.monthly} AED)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: HEALTHY RECIPES CATALOG */}
        {activeTab === 'recipes' && (
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2">
                {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-[#23845b] text-white shadow-sm'
                        : 'bg-white border border-[#e3ebe3] text-[#4a5c53] hover:bg-[#eaf5ee]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search recipe or ingredient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#e3ebe3] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#23845b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCatalog.map((food) => {
                const locked = food.isPro && !isPro;
                return (
                  <div key={food.id} className="bg-white border border-[#e3ebe3] rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="text-4xl mb-4 p-3 bg-[#eaf5ee] w-14 h-14 rounded-2xl flex items-center justify-center">
                      {food.image}
                    </div>
                    <h3 className="font-bold text-lg text-[#192b23]">{food.name}</h3>
                    <p className="text-xs font-semibold text-[#7d8e84] mb-4 uppercase tracking-wider">
                      {food.category} • {food.calories} kcal
                    </p>

                    <div className={`transition flex-1 ${locked ? 'filter blur-sm select-none opacity-40' : ''}`}>
                      <h4 className="text-xs font-bold uppercase text-[#7d8e84] mb-2 tracking-wider">Ingredients:</h4>
                      <ul className="text-sm text-[#4a5c53] space-y-1.5">
                        {food.ingredients.map((ing, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#23845b]"></span>
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {locked && (
                      <div className="absolute inset-0 bg-[#192b23]/75 backdrop-blur-[4px] flex flex-col items-center justify-center text-white p-6 text-center">
                        <span className="text-3xl mb-2">🔒</span>
                        <p className="font-bold text-base mb-1">Pro Access Required</p>
                        <button onClick={handleUpgrade} className="mt-2 bg-white text-[#192b23] text-xs font-extrabold px-4 py-2 rounded-xl shadow">
                          Unlock via Ziina ({membershipPricing.monthly} AED)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
