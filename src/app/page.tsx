'use client';
import { useState, useEffect } from 'react';
import { membershipPricing } from '@/lib/membership';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  image: string; // Emoji icon or image URL
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
        window.location.href = data.redirect_url; // Redirects client to Ziina payment gateway
      }
    } catch (err) {
      alert('Could not start payment. Please try again.');
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto font-sans">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Eat Right 🥗</h1>
          <p className="text-sm text-gray-500">Your personalized nutrition & meal guide</p>
        </div>
        {!isPro && (
          <button 
            onClick={handleUpgrade}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow hover:bg-emerald-700 transition"
          >
            Unlock Pro ({membershipPricing.monthly} {membershipPricing.currency}/mo)
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {foodDatabase.map((food) => {
          const locked = food.isPro && !isPro;

          return (
            <div key={food.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden bg-white">
              <div className="text-4xl mb-3">{food.image}</div>
              <h3 className="font-bold text-lg">{food.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{food.category} • {food.calories} kcal</p>

              <div className={`transition ${locked ? 'filter blur-sm select-none opacity-40' : ''}`}>
                <h4 className="text-xs font-semibold uppercase text-gray-400 mb-1 tracking-wider">Ingredients:</h4>
                <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                  {food.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>

              {locked && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] flex flex-col items-center justify-center text-white p-4 text-center">
                  <span className="text-2xl mb-1">🔒</span>
                  <p className="font-bold mb-2">Pro Access Required</p>
                  <button 
                    onClick={handleUpgrade}
                    className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
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
  );
}