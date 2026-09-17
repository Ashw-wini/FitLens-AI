const express = require('express');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const { generateWeeklySchedule, estimateCaloriesBurned, suggestNextWorkout } = require('../utils/scheduler');
const programs = require('../data/programs.json');
const exercises = require('../data/exercises.json');

// Get all workout programs
router.get('/programs', (req, res) => {
  const programSummaries = programs.map(p => ({
    id: p.id,
    name: p.name,
    difficulty: p.difficulty,
    daysPerWeek: p.daysPerWeek,
    description: p.description
  }));
  res.json(programSummaries);
});

// Get specific program details
router.get('/programs/:id', (req, res) => {
  const program = programs.find(p => p.id === req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  
  // Enrich exercises with full details
  const enriched = { ...program };
  for (const [dayKey, dayPlan] of Object.entries(enriched.schedule)) {
    enriched.schedule[dayKey] = {
      ...dayPlan,
      exercises: dayPlan.exercises.map(ex => {
        const exerciseDef = exercises.find(e => e.id === ex.exerciseId);
        return {
          ...ex,
          name: exerciseDef?.name || 'Unknown',
          muscles: exerciseDef?.muscles || [],
          instructions: exerciseDef?.instructions || '',
          formCues: exerciseDef?.formCues || []
        };
      })
    };
  }
  
  res.json(enriched);
});

// Generate weekly schedule for user
router.get('/schedule/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find the program
    const programMap = {
      'full_body': 'prog001',
      'ppl': 'prog002',
      'upper_lower': 'prog003',
      'bro_split': 'prog004'
    };
    
    const programId = programMap[user.preferredProgram] || 'prog001';
    const program = programs.find(p => p.id === programId);
    
    const schedule = generateWeeklySchedule(program, user.workoutDays);
    
    // Enrich with exercise details
    for (const [day, plan] of Object.entries(schedule)) {
      if (plan.type === 'workout') {
        plan.exercises = plan.exercises.map(ex => {
          const exerciseDef = exercises.find(e => e.id === ex.exerciseId);
          return {
            ...ex,
            name: exerciseDef?.name || 'Unknown',
            muscles: exerciseDef?.muscles || [],
            instructions: exerciseDef?.instructions || '',
            formCues: exerciseDef?.formCues || []
          };
        });
      }
    }
    
    res.json({ program: program.name, schedule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log a completed workout
router.post('/log', async (req, res) => {
  try {
    const { userId, date, programName, dayLabel, exercises: workoutExercises, duration } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];
    
    const user = await User.findById(userId);
    const caloriesBurned = estimateCaloriesBurned(
      workoutExercises.map(e => ({ exerciseId: e.exerciseId || e.name, sets: e.sets, reps: e.reps })),
      exercises,
      duration || 45,
      user?.weight || 70
    );

    const workoutLog = new WorkoutLog({
      userId, date: dateStr, programName, dayLabel,
      exercises: workoutExercises,
      duration: duration || 45,
      caloriesBurned,
      completed: true
    });

    await workoutLog.save();
    res.status(201).json(workoutLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get workout history
router.get('/history/:userId', async (req, res) => {
  try {
    const { days } = req.query;
    const limit = parseInt(days) || 30;
    
    const logs = await WorkoutLog.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
