const express = require('express');
const router = express.Router();
const exercises = require('../data/exercises.json');

// Get all exercises (with optional filters)
router.get('/', (req, res) => {
  const { category, difficulty, search } = req.query;
  let results = exercises;
  
  if (category) {
    results = results.filter(e => e.category === category);
  }
  if (difficulty) {
    results = results.filter(e => e.difficulty === difficulty);
  }
  if (search) {
    const query = search.toLowerCase();
    results = results.filter(e => 
      e.name.toLowerCase().includes(query) || 
      e.muscles.some(m => m.toLowerCase().includes(query))
    );
  }
  
  res.json(results);
});

// Get exercise by ID
router.get('/:id', (req, res) => {
  const exercise = exercises.find(e => e.id === req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json(exercise);
});

// Get exercise categories
router.get('/meta/categories', (req, res) => {
  const categories = [...new Set(exercises.map(e => e.category))];
  res.json(categories);
});

module.exports = router;
