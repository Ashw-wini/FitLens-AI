const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },  // YYYY-MM-DD
  meals: [{
    mealType: { 
      type: String, 
      enum: ['breakfast', 'lunch', 'dinner', 'snack'], 
      required: true 
    },
    foods: [{
      name: String,
      servingSize: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }],
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 }
  }],
  dailyTotal: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  }
}, { timestamps: true });

mealLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealLog', mealLogSchema);
