import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, saveUser, clearUser } = useUser();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || 'male',
    weight: user?.weight || '',
    height: user?.height || '',
    goal: user?.goal || 'maintain',
    activityLevel: user?.activityLevel || 'moderate',
    dietaryPreference: user?.dietaryPreference || 'any',
    preferredProgram: user?.preferredProgram || 'full_body',
    workoutDays: user?.workoutDays || ['monday', 'wednesday', 'friday']
  });

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleDay(day) {
    setForm(prev => ({
      ...prev,
      workoutDays: prev.workoutDays.includes(day) 
        ? prev.workoutDays.filter(d => d !== day)
        : [...prev.workoutDays, day]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        age: Number(form.age),
        weight: Number(form.weight),
        height: Number(form.height)
      };
      await saveUser(data);
      showToast('Profile saved successfully!', 'success');
      if (!user) {
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      showToast('Error saving profile. Is the server running?', 'error');
    }
    setSaving(false);
  }

  function showToast(message, type) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="animate-fade-in-up">
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
      
      <div className="page-header">
        <h1 className="page-title">{user ? 'Profile Settings' : 'Create Your Profile'} ⚙️</h1>
        <p className="page-subtitle">
          {user ? 'Update your fitness profile and preferences' : 'Set up your profile to get personalized recommendations'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          {/* Personal Info */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>👤 Personal Information</h3>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input className="form-input" type="number" name="age" value={form.age} onChange={handleChange} placeholder="25" min="13" max="100" required />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input className="form-input" type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="70" min="20" required />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input className="form-input" type="number" name="height" value={form.height} onChange={handleChange} placeholder="175" min="100" required />
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>🎯 Fitness Goals</h3>
            
            <div className="form-group">
              <label className="form-label">Goal</label>
              <select className="form-select" name="goal" value={form.goal} onChange={handleChange}>
                <option value="lose_fat">🔥 Lose Fat (Calorie Deficit)</option>
                <option value="maintain">⚖️ Maintain Weight</option>
                <option value="build_muscle">💪 Build Muscle (Calorie Surplus)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select className="form-select" name="activityLevel" value={form.activityLevel} onChange={handleChange}>
                <option value="sedentary">Sedentary (Desk job, little exercise)</option>
                <option value="light">Light (Exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                <option value="active">Active (Exercise 6-7 days/week)</option>
                <option value="very_active">Very Active (Intense daily exercise)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Preference</label>
              <select className="form-select" name="dietaryPreference" value={form.dietaryPreference} onChange={handleChange}>
                <option value="any">No Restriction</option>
                <option value="vegetarian">🥦 Vegetarian</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="keto">🥩 Keto</option>
                <option value="paleo">🍖 Paleo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Program</label>
              <select className="form-select" name="preferredProgram" value={form.preferredProgram} onChange={handleChange}>
                <option value="full_body">Full Body (3 days/week)</option>
                <option value="ppl">Push Pull Legs (6 days/week)</option>
                <option value="upper_lower">Upper/Lower Split (4 days/week)</option>
                <option value="bro_split">Home HIIT (4 days/week)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workout Days */}
        <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>📅 Workout Days</h3>
          <div className="exercise-selector">
            {weekdays.map(day => (
              <button
                key={day}
                type="button"
                className={`exercise-chip ${form.workoutDays.includes(day) ? 'active' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>
            Selected: {form.workoutDays.length} days per week
          </p>
        </div>

        {/* User Stats (if exists) */}
        {user && (
          <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>📊 Calculated Nutrition</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-lg)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>BMR</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>{user.bmr}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>kcal/day</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>TDEE</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--accent)' }}>{user.tdee}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>kcal/day</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>Target</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--success)' }}>{user.dailyCalories}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>kcal/day</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>Protein</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--primary-light)' }}>{user.macros?.protein}g</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>Carbs</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--accent)' }}>{user.macros?.carbs}g</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', marginBottom: 'var(--space-xs)' }}>Fat</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--warning)' }}>{user.macros?.fat}g</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? '⏳ Saving...' : user ? '💾 Update Profile' : '🚀 Create Profile'}
          </button>
          {user && (
            <button type="button" className="btn btn-outline" onClick={clearUser}>
              🔄 Switch User
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
