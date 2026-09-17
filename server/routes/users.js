const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { calculateBMR, calculateTDEE, calculateDailyCalories, calculateMacros } = require('../utils/nutrition');

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, age, gender, weight, height, goal, activityLevel, dietaryPreference, workoutDays, preferredProgram } = req.body;

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const dailyCalories = calculateDailyCalories(tdee, goal);
    const macros = calculateMacros(dailyCalories, weight, goal);

    const user = new User({
      name, age, gender, weight, height, goal,
      activityLevel: activityLevel || 'moderate',
      dietaryPreference: dietaryPreference || 'any',
      workoutDays: workoutDays || ['monday', 'wednesday', 'friday'],
      preferredProgram: preferredProgram || 'full_body',
      bmr, tdee, dailyCalories, macros,
      weightHistory: [{ weight, date: new Date() }]
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { name, age, gender, weight, height, goal, activityLevel, dietaryPreference, workoutDays, preferredProgram } = req.body;
    
    const updates = { name, age, gender, weight, height, goal, activityLevel, dietaryPreference, workoutDays, preferredProgram };
    
    // Recalculate nutrition
    if (weight && height && age && gender) {
      updates.bmr = calculateBMR(weight, height, age, gender);
      updates.tdee = calculateTDEE(updates.bmr, activityLevel || 'moderate');
      updates.dailyCalories = calculateDailyCalories(updates.tdee, goal || 'maintain');
      updates.macros = calculateMacros(updates.dailyCalories, weight, goal || 'maintain');
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Log weight progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { weight } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.weight = weight;
    user.weightHistory.push({ weight, date: new Date() });
    
    // Recalculate nutrition with new weight
    user.bmr = calculateBMR(weight, user.height, user.age, user.gender);
    user.tdee = calculateTDEE(user.bmr, user.activityLevel);
    user.dailyCalories = calculateDailyCalories(user.tdee, user.goal);
    user.macros = calculateMacros(user.dailyCalories, weight, user.goal);
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
