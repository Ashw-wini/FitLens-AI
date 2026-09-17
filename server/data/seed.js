const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function seed() {
  await connectDB();
  
  console.log('✅ Database connected. Seeding is handled via JSON files loaded at runtime.');
  console.log('   Foods: server/data/foods.json (100 items)');
  console.log('   Exercises: server/data/exercises.json (20 items)');
  console.log('   Programs: server/data/programs.json (4 programs)');
  console.log('');
  console.log('💡 These files are loaded directly by the API routes.');
  console.log('   No additional seeding required!');
  
  await mongoose.connection.close();
  console.log('🔒 Database connection closed.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
