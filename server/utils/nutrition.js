/**
 * Nutrition calculator utilities
 * Uses Mifflin-St Jeor equation for BMR
 */

// Activity level multipliers for TDEE
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,       // Little/no exercise
  light: 1.375,         // Light exercise 1-3 days/week
  moderate: 1.55,       // Moderate exercise 3-5 days/week
  active: 1.725,        // Hard exercise 6-7 days/week
  very_active: 1.9      // Very hard exercise, physical job
};

// Goal calorie adjustments
const GOAL_ADJUSTMENTS = {
  lose_fat: -500,       // 500 cal deficit
  maintain: 0,
  build_muscle: 300     // 300 cal surplus
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(weight, height, age, gender) {
  // weight in kg, height in cm, age in years
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate daily calorie target based on goal
 */
function calculateDailyCalories(tdee, goal) {
  const adjustment = GOAL_ADJUSTMENTS[goal] || 0;
  return Math.max(1200, Math.round(tdee + adjustment));
}

/**
 * Calculate macro split in grams
 */
function calculateMacros(dailyCalories, weight, goal) {
  let proteinPerKg, fatPercent;
  
  switch (goal) {
    case 'lose_fat':
      proteinPerKg = 2.2;  // Higher protein for muscle preservation
      fatPercent = 0.25;
      break;
    case 'build_muscle':
      proteinPerKg = 2.0;
      fatPercent = 0.25;
      break;
    default: // maintain
      proteinPerKg = 1.8;
      fatPercent = 0.30;
  }
  
  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round((dailyCalories * fatPercent) / 9);
  const carbCalories = dailyCalories - (protein * 4) - (fat * 9);
  const carbs = Math.round(Math.max(50, carbCalories / 4));
  
  return { protein, carbs, fat };
}

/**
 * Generate a meal plan based on user preferences
 */
function generateMealPlan(foods, dailyCalories, macros, dietaryPreference) {
  const mealSplit = {
    breakfast: { calPercent: 0.25, label: 'Breakfast' },
    lunch:     { calPercent: 0.35, label: 'Lunch' },
    dinner:    { calPercent: 0.30, label: 'Dinner' },
    snack:     { calPercent: 0.10, label: 'Snack' }
  };

  // Filter foods based on dietary preference
  let availableFoods = foods;
  if (dietaryPreference !== 'any') {
    availableFoods = foods.filter(f => {
      if (!f.tags) return false;
      switch (dietaryPreference) {
        case 'vegetarian': return f.tags.includes('vegetarian');
        case 'vegan': return f.tags.includes('vegan');
        case 'keto': return f.tags.includes('keto');
        case 'paleo': return !f.tags.includes('vegetarian') || f.category === 'protein';
        default: return true;
      }
    });
    // Fallback if too few foods match
    if (availableFoods.length < 20) {
      availableFoods = foods;
    }
  }

  const meals = [];
  
  for (const [mealType, config] of Object.entries(mealSplit)) {
    const targetCal = Math.round(dailyCalories * config.calPercent);
    const mealFoods = selectFoodsForMeal(availableFoods, targetCal, mealType);
    
    const totalCalories = mealFoods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = mealFoods.reduce((sum, f) => sum + f.protein, 0);
    const totalCarbs = mealFoods.reduce((sum, f) => sum + f.carbs, 0);
    const totalFat = mealFoods.reduce((sum, f) => sum + f.fat, 0);
    
    meals.push({
      mealType,
      foods: mealFoods,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat)
    });
  }
  
  return meals;
}

/**
 * Select foods for a specific meal to hit calorie target
 */
function selectFoodsForMeal(foods, targetCalories, mealType) {
  const categoryPriority = {
    breakfast: ['grain', 'dairy', 'fruit', 'protein'],
    lunch:     ['protein', 'grain', 'vegetable', 'legume'],
    dinner:    ['protein', 'vegetable', 'grain', 'legume'],
    snack:     ['fruit', 'nut', 'dairy', 'snack']
  };

  const priorities = categoryPriority[mealType] || ['protein', 'grain', 'vegetable'];
  const selected = [];
  let currentCalories = 0;

  for (const category of priorities) {
    if (currentCalories >= targetCalories * 0.9) break;
    
    const categoryFoods = foods.filter(f => f.category === category);
    if (categoryFoods.length === 0) continue;
    
    const food = categoryFoods[Math.floor(Math.random() * categoryFoods.length)];
    const remaining = targetCalories - currentCalories;
    const portions = Math.max(0.5, Math.min(2, remaining / food.calories));
    
    selected.push({
      name: food.name,
      servingSize: `${Math.round(portions * 100) / 100} serving`,
      calories: Math.round(food.calories * portions),
      protein: Math.round(food.protein * portions * 10) / 10,
      carbs: Math.round(food.carbs * portions * 10) / 10,
      fat: Math.round(food.fat * portions * 10) / 10
    });
    
    currentCalories += food.calories * portions;
  }
  
  return selected;
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  generateMealPlan,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS
};
