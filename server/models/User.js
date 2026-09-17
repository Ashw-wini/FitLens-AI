const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 13, max: 100 },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  weight: { type: Number, required: true, min: 20 },       // kg
  height: { type: Number, required: true, min: 100 },      // cm
  goal: { 
    type: String, 
    enum: ['lose_fat', 'maintain', 'build_muscle'], 
    default: 'maintain' 
  },
  activityLevel: { 
    type: String, 
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], 
    default: 'moderate' 
  },
  dietaryPreference: { 
    type: String, 
    enum: ['any', 'vegetarian', 'vegan', 'keto', 'paleo'], 
    default: 'any' 
  },
  dailyCalories: { type: Number, default: 2000 },
  macros: {
    protein: { type: Number, default: 150 },    // grams
    carbs: { type: Number, default: 200 },
    fat: { type: Number, default: 65 }
  },
  bmr: { type: Number, default: 0 },
  tdee: { type: Number, default: 0 },
  weightHistory: [{
    weight: Number,
    date: { type: Date, default: Date.now }
  }],
  workoutDays: {
    type: [String],
    default: ['monday', 'wednesday', 'friday']
  },
  preferredProgram: {
    type: String,
    enum: ['ppl', 'full_body', 'upper_lower', 'bro_split'],
    default: 'full_body'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
