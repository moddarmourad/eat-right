import type { Recipe } from "@/lib/models";

export const healthyRecipes: Recipe[] = [
  {
    id: "med-cucumber-tomato",
    title: "Mediterranean Cucumber & Tomato Salad",
    category: "Salad",
    prepTimeMinutes: 10,
    calories: 220,
    protein: 8,
    carbs: 14,
    fat: 16,
    serving: "1 large bowl",
    ingredients: [
      "2 crisp cucumbers (diced)",
      "2 ripe vine tomatoes (chopped)",
      "50g light feta cheese (crumbled)",
      "1 tbsp extra virgin olive oil",
      "1 tbsp fresh lemon juice",
      "Fresh mint or oregano",
      "Pinch of sea salt and black pepper",
    ],
    instructions: [
      "Wash and dice the cucumbers and tomatoes into bite-sized cubes.",
      "Combine them in a mixing bowl with crumbled feta cheese.",
      "Whisk together olive oil, fresh lemon juice, sea salt, and black pepper.",
      "Drizzle dressing over the vegetables, toss gently, and garnish with fresh herbs.",
    ],
    tags: ["High Fiber", "Low Carb", "Vegetarian", "Quick (10m)"],
  },
  {
    id: "cucumber-tomato-avocado-bowl",
    title: "Avocado, Cucumber & Tomato Detox Bowl",
    category: "Lunch",
    prepTimeMinutes: 12,
    calories: 310,
    protein: 6,
    carbs: 22,
    fat: 24,
    serving: "1 meal bowl",
    ingredients: [
      "1 medium avocado (cubed)",
      "1 large cucumber (sliced into half-moons)",
      "1 cup cherry tomatoes (halved)",
      "1/4 red onion (thinly sliced)",
      "1 tbsp lime juice & 1 tsp olive oil",
      "Fresh cilantro",
      "Pinch of cumin, salt & pepper",
    ],
    instructions: [
      "Dice cucumber, halve the cherry tomatoes, and thinly slice the red onion.",
      "Gently fold in ripe avocado cubes to maintain texture.",
      "Toss with lime juice, olive oil, chopped cilantro, cumin, salt, and pepper.",
      "Serve chilled as a refreshing nutrient-packed meal.",
    ],
    tags: ["Heart Healthy", "Gluten Free", "Vegan", "Fresh"],
  },
  {
    id: "greek-chicken-salad",
    title: "Greek Chicken Cucumber Tomato Plate",
    category: "Dinner",
    prepTimeMinutes: 20,
    calories: 460,
    protein: 42,
    carbs: 16,
    fat: 24,
    serving: "1 plate",
    ingredients: [
      "180g grilled chicken breast (sliced)",
      "1 large cucumber (diced)",
      "2 plum tomatoes (diced)",
      "30g Kalamata olives",
      "40g feta cheese",
      "1 tbsp olive oil & dried oregano",
    ],
    instructions: [
      "Season chicken breast with oregano, garlic, salt, and grill until cooked through (7-8 mins).",
      "Dice cucumbers, tomatoes, and toss with sliced olives and feta.",
      "Plate the crisp cucumber-tomato salad and top with warm sliced grilled chicken.",
      "Finish with a light olive oil and lemon drizzle.",
    ],
    tags: ["High Protein", "Low Carb", "Keto Friendly"],
  },
  {
    id: "tomato-cucumber-gazpacho",
    title: "Chilled Tomato Cucumber Gazpacho",
    category: "Lunch",
    prepTimeMinutes: 15,
    calories: 180,
    protein: 5,
    carbs: 26,
    fat: 7,
    serving: "2 cups",
    ingredients: [
      "4 ripe tomatoes",
      "1 cucumber (peeled and chopped)",
      "1/2 bell pepper",
      "1 clove garlic",
      "1 tbsp red wine vinegar",
      "1 tbsp olive oil",
      "Pinch of sea salt and paprika",
    ],
    instructions: [
      "Roughly chop tomatoes, cucumber, bell pepper, and garlic.",
      "Add to a blender with vinegar, olive oil, salt, and paprika.",
      "Blend on high until smooth and vibrant.",
      "Chill for at least 20 minutes before serving with a basil garnish.",
    ],
    tags: ["Hydrating", "Vegan", "Vitamin C", "Low Calorie"],
  },
  {
    id: "berry-protein-oats",
    title: "Overnight Berry Protein Oats",
    category: "Breakfast",
    prepTimeMinutes: 5,
    calories: 340,
    protein: 26,
    carbs: 48,
    fat: 6,
    serving: "1 jar",
    ingredients: [
      "50g rolled oats",
      "1 scoop (25g) vanilla whey or plant protein",
      "150ml unsweetened almond milk",
      "1/2 cup fresh berries (blueberries & strawberries)",
      "1 tbsp chia seeds",
    ],
    instructions: [
      "Stir oats, protein powder, and chia seeds together in a jar.",
      "Pour in almond milk and mix thoroughly until smooth.",
      "Top with fresh berries, seal jar, and refrigerate overnight (or at least 2 hours).",
      "Enjoy chilled for a sustained morning energy boost.",
    ],
    tags: ["High Protein", "Meal Prep", "Breakfast", "Fiber Rich"],
  },
  {
    id: "salmon-quinoa-bowl",
    title: "Pan-Seared Salmon & Quinoa Bowl",
    category: "Dinner",
    prepTimeMinutes: 22,
    calories: 520,
    protein: 38,
    carbs: 42,
    fat: 22,
    serving: "1 bowl",
    ingredients: [
      "150g fresh salmon fillet",
      "1 cup cooked quinoa",
      "1 cup steamed broccoli florets",
      "1/2 avocado (sliced)",
      "1 tbsp sesame seeds & low-sodium soy sauce",
      "1 tsp olive oil",
    ],
    instructions: [
      "Cook quinoa according to package instructions.",
      "Heat olive oil in a skillet over medium-high heat. Sear salmon skin-side down for 4 mins, flip for 3 mins.",
      "Steam broccoli until bright green and tender-crisp.",
      "Assemble bowl with quinoa base, broccoli, sliced avocado, and crispy salmon. Drizzle with soy glaze.",
    ],
    tags: ["Omega 3", "High Protein", "Balanced Plate"],
  },
  {
    id: "egg-white-spinach-wrap",
    title: "Spinach, Tomato & Egg White Scramble Wrap",
    category: "Breakfast",
    prepTimeMinutes: 12,
    calories: 280,
    protein: 24,
    carbs: 26,
    fat: 8,
    serving: "1 wrap",
    ingredients: [
      "3 large egg whites + 1 whole egg",
      "1 cup baby spinach leaves",
      "1 small tomato (diced)",
      "1 whole wheat tortilla wrap",
      "Pinch of garlic powder, salt, and chili flakes",
    ],
    instructions: [
      "Sauté diced tomato and baby spinach in a non-stick pan until wilted (1-2 mins).",
      "Whisk egg whites with whole egg, season, and pour into pan.",
      "Scramble gently until soft curds form.",
      "Warm the whole wheat wrap and roll the scramble tightly.",
    ],
    tags: ["High Protein", "Lean", "Quick (15m)"],
  },
  {
    id: "protein-energy-bites",
    title: "No-Bake Peanut Butter Protein Bites",
    category: "Snack",
    prepTimeMinutes: 10,
    calories: 190,
    protein: 10,
    carbs: 18,
    fat: 9,
    serving: "2 bites",
    ingredients: [
      "1/2 cup natural peanut or almond butter",
      "1/3 cup honey or maple syrup",
      "1 cup rolled oats",
      "1/2 cup chocolate protein powder",
      "2 tbsp ground flaxseed",
    ],
    instructions: [
      "Mix peanut butter and honey in a bowl until blended.",
      "Stir in rolled oats, protein powder, and ground flaxseed until a thick dough forms.",
      "Roll into 10-12 bite-sized balls.",
      "Chill in the fridge for 20 minutes to set. Keeps well for 7 days.",
    ],
    tags: ["Snack", "High Energy", "Sweet Craving"],
  },
];

/**
 * Searches and ranks recipes matching any user-provided ingredients.
 * Also dynamically crafts an inventive healthy dish if unusual ingredient combinations are supplied.
 */
export function findRecipesByIngredients(inputIngredients: string[]): Recipe[] {
  const normalized = inputIngredients
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!normalized.length) return healthyRecipes;

  // Score recipes by how many ingredients match
  const scored = healthyRecipes.map((recipe) => {
    const recipeText = `${recipe.title} ${recipe.ingredients.join(" ")} ${recipe.tags.join(" ")}`.toLowerCase();
    let matchCount = 0;
    for (const ing of normalized) {
      if (recipeText.includes(ing)) {
        matchCount++;
      }
    }
    return { recipe, matchCount };
  });

  const matching = scored
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((item) => item.recipe);

  // If we found good matches, return them
  if (matching.length > 0) {
    return matching;
  }

  // Fallback: Dynamically compose a custom recipe based on the user's ingredients
  const titleWords = normalized.map(
    (w) => w.charAt(0).toUpperCase() + w.slice(1)
  );
  const customTitle = `${titleWords.join(" & ")} Healthy Sauté`;
  const dynamicRecipe: Recipe = {
    id: `custom-${Date.now()}`,
    title: customTitle,
    category: "Lunch",
    prepTimeMinutes: 15,
    calories: 290,
    protein: 14,
    carbs: 28,
    fat: 12,
    serving: "1 warm plate",
    ingredients: [
      ...normalized.map((ing) => `Fresh ${ing} (washed & prepped)`),
      "1 tbsp extra virgin olive oil",
      "1 clove minced garlic",
      "Pinch of sea salt, black pepper, and herbs to taste",
      "Optional: protein of your choice (eggs, tofu, or chicken)",
    ],
    instructions: [
      `Chop your ${normalized.join(" and ")} into uniform bite-sized pieces.`,
      "Heat a pan over medium heat with olive oil and fragrant minced garlic.",
      `Add your ${normalized.join(" and ")}, seasoning with salt, black pepper, and your favorite herbs.`,
      "Sauté for 6-8 minutes until tender-crisp and caramelized. Serve warm and fresh!",
    ],
    tags: ["Custom Created", "Pantry Chef", "Healthy", "Quick"],
  };

  return [dynamicRecipe, ...healthyRecipes.slice(0, 3)];
}
