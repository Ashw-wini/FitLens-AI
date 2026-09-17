/**
 * Workout scheduler utility
 * Generates weekly workout schedules based on user preferences
 */

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Generate a weekly workout schedule
 */
function generateWeeklySchedule(program, userWorkoutDays) {
  const schedule = {};
  const programDays = Object.entries(program.schedule);
  
  let dayIndex = 0;
  
  for (const weekday of WEEKDAYS) {
    if (userWorkoutDays.includes(weekday) && dayIndex < programDays.length) {
      const [, dayPlan] = programDays[dayIndex % programDays.length];
      schedule[weekday] = {
        type: 'workout',
        label: dayPlan.label,
        exercises: dayPlan.exercises
      };
      dayIndex++;
    } else {
      schedule[weekday] = {
        type: 'rest',
        label: 'Rest Day',
        exercises: []
      };
    }
  }
  
  return schedule;
}

/**
 * Estimate calories burned for a workout
 */
function estimateCaloriesBurned(exercises, exerciseDB, durationMinutes, userWeight) {
  // MET-based estimation (simplified)
  const baseMET = 5; // Average MET for resistance training
  let totalCals = 0;
  
  for (const ex of exercises) {
    const exerciseDef = exerciseDB.find(e => e.id === ex.exerciseId);
    if (exerciseDef) {
      totalCals += (exerciseDef.caloriesPerRep || 0.3) * ex.sets * ex.reps;
    }
  }
  
  // Add base metabolic cost of training duration
  const baseBurn = (baseMET * 3.5 * userWeight / 200) * durationMinutes;
  
  return Math.round(totalCals + baseBurn);
}

/**
 * Suggest next workout based on history
 */
function suggestNextWorkout(program, completedDays) {
  const programDays = Object.keys(program.schedule);
  const totalDays = programDays.length;
  const nextDayIndex = completedDays % totalDays;
  const nextDayKey = programDays[nextDayIndex];
  
  return {
    dayNumber: nextDayIndex + 1,
    ...program.schedule[nextDayKey]
  };
}

module.exports = {
  generateWeeklySchedule,
  estimateCaloriesBurned,
  suggestNextWorkout,
  WEEKDAYS
};
