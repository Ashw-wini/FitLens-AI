const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');
const User = require('../models/User');
const { generateMealPlan } = require('../utils/nutrition');
const foods = require('../data/foods.json');

// Get food database (with optional search)
router.get('/foods', (req, res) => {
  const { search, category } = req.query;
  let results = foods;
  
  if (search) {
    const query = search.toLowerCase();
    results = results.filter(f => f.name.toLowerCase().includes(query));
  }
  if (category) {
    results = results.filter(f => f.category === category);
  }
  
  res.json(results);
});

// Generate meal plan for user
router.get('/plan/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const meals = generateMealPlan(
      foods,
      user.dailyCalories,
      user.macros,
      user.dietaryPreference
    );

    const dailyTotal = {
      calories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
      protein: meals.reduce((sum, m) => sum + m.totalProtein, 0),
      carbs: meals.reduce((sum, m) => sum + m.totalCarbs, 0),
      fat: meals.reduce((sum, m) => sum + m.totalFat, 0)
    };

    res.json({ meals, dailyTotal, targetCalories: user.dailyCalories, targetMacros: user.macros });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log a meal
router.post('/log', async (req, res) => {
  try {
    const { userId, date, mealType, foods: mealFoods } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    let mealLog = await MealLog.findOne({ userId, date: dateStr });
    
    const totalCalories = mealFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const totalProtein = mealFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
    const totalCarbs = mealFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    const totalFat = mealFoods.reduce((sum, f) => sum + (f.fat || 0), 0);

    const newMeal = { mealType, foods: mealFoods, totalCalories, totalProtein, totalCarbs, totalFat };

    if (mealLog) {
      mealLog.meals.push(newMeal);
    } else {
      mealLog = new MealLog({
        userId, date: dateStr, meals: [newMeal]
      });
    }

    // Recalculate daily totals
    mealLog.dailyTotal = {
      calories: mealLog.meals.reduce((sum, m) => sum + m.totalCalories, 0),
      protein: mealLog.meals.reduce((sum, m) => sum + m.totalProtein, 0),
      carbs: mealLog.meals.reduce((sum, m) => sum + m.totalCarbs, 0),
      fat: mealLog.meals.reduce((sum, m) => sum + m.totalFat, 0)
    };

    await mealLog.save();
    res.status(201).json(mealLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal history for user
router.get('/history/:userId', async (req, res) => {
  try {
    const { days } = req.query;
    const limit = parseInt(days) || 7;
    
    const logs = await MealLog.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
