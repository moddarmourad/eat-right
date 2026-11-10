'use client';
import { useState, useEffect } from 'react';
import { membershipPricing } from '@/lib/membership';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  image: string;
  ingredients: string[];
  calories: number;
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
    isPro: false,
  },
  {
    id: '2',
    name: 'Grilled Salmon & Quinoa Bowl',
    category: 'Dinner',
    image: '🐟',
    ingredients: ['Fresh Salmon fillet', 'Organic Quinoa', 'Asparagus', 'Lemon herb dressing'],
    calories: 520,
    isPro: true,
  },
  {
    id: '3',
    name: 'High-Protein Peanut Butter Smoothie',
    category: 'Snack',
    image: '🥤',
    ingredients: ['Whey protein', 'Peanut butter', 'Almond milk', 'Banana', 'Chia seeds'],
    calories: 410,
    isPro: true,
  },
];

export default function EatRightApp() {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('eat_right_pro') === 'true') {
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
    } catch (err) {
      alert('Could not start payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9f6] text-[#192b23] font-sans">
      <header className="bg-white border-b border-[#e3ebe3] px-8 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#23845b] text-white flex items-center justify-center text-xl font-bold shadow-md">
            🥗
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Eat Right</h1>
            <p className="text-xs text-[#7d8e84] font-medium">Your personalized nutrition & meal guide</p>
          </div>
        </div>
        {!isPro && (
          <button 
            onClick={handleUpgrade}
            className="bg-[#23845b] hover:bg-[#1c6d4a] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
          >
            Unlock Pro ({membershipPricing.monthly} {membershipPricing.currency}/mo)
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Food Database & Recipes</h2>
          <p className="text-sm text-[#7d8e84] mt-1">Explore healthy meals, ingredients, and macro breakdowns.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {foodDatabase.map((food) => {
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
                    <p className="text-xs text-emerald-200 mb-4">Unlock all recipes and advanced nutritional tracking.</p>
                    <button 
                      onClick={handleUpgrade}
                      className="bg-white text-[#192b23] hover:bg-[#eaf5ee] text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition"
                    >
                      Pay via Ziina ({membershipPricing.monthly} AED)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}