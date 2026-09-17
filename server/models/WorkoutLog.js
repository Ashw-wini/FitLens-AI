const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },  // YYYY-MM-DD
  programName: { type: String },
  dayLabel: { type: String },              // e.g. "Push Day", "Full Body A"
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number,                         // kg
    formScore: { type: Number, min: 0, max: 100, default: null },
    notes: String
  }],
  duration: { type: Number, default: 0 },   // minutes
  caloriesBurned: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

workoutLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
