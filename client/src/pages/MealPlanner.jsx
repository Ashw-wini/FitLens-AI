import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getMealPlan } from '../services/api';
import MealCard from '../components/MealCard';

export default function MealPlanner() {
  const { user } = useUser();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?._id) {
      generatePlan();
    }
  }, [user]);

  async function generatePlan() {
    if (!user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMealPlan(user._id);
      setMealPlan(res.data);
    } catch (err) {
      setError('Could not generate meal plan. Is the server running?');
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="empty-state animate-fade-in-up">
        <div className="empty-state-icon">🥗</div>
        <h3>Set Up Your Profile First</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Create your profile to get personalized meal plans</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Meal Planner 🥗</h1>
        <p className="page-subtitle">AI-generated meals based on your {user.dailyCalories} kcal target</p>
      </div>

      {/* Calorie & Macro Summary */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
          <div>
            <h3 className="card-title">Daily Nutrition Target</h3>
            <p className="card-subtitle">
              {user.dietaryPreference === 'any' ? 'No dietary restriction' : 
               user.dietaryPreference.charAt(0).toUpperCase() + user.dietaryPreference.slice(1)} 
              &nbsp;•&nbsp; 
              {user.goal === 'lose_fat' ? '🔥 Fat Loss' : user.goal === 'build_muscle' ? '💪 Muscle Gain' : '⚖️ Maintenance'}
            </p>
          </div>
          <button className="btn btn-accent" onClick={generatePlan} disabled={loading}>
            {loading ? '⏳ Generating...' : '🔄 Regenerate Plan'}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user.dailyCalories}
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase' }}>Calories</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--success)' }}>{user.macros?.protein}g</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase' }}>Protein</div>
            <div className="progress-bar" style={{ marginTop: '6px', height: '4px' }}>
              <div className="progress-fill success" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--accent)' }}>{user.macros?.carbs}g</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase' }}>Carbs</div>
            <div className="progress-bar" style={{ marginTop: '6px', height: '4px' }}>
              <div className="progress-fill primary" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--warning)' }}>{user.macros?.fat}g</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase' }}>Fat</div>
            <div className="progress-bar" style={{ marginTop: '6px', height: '4px' }}>
              <div className="progress-fill warning" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>{error}</div>}

      {loading && (
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Generating your personalized meal plan...</div>
        </div>
      )}

      {/* Meal Plan */}
      {mealPlan && !loading && (
        <>
          <div className="grid-2 stagger-children">
            {mealPlan.meals.map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </div>

          {/* Daily Total */}
          <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>📊 Plan Totals vs Target</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-lg)' }}>
              {[
                { label: 'Calories', plan: mealPlan.dailyTotal.calories, target: mealPlan.targetCalories, unit: 'kcal', color: 'var(--primary-light)' },
                { label: 'Protein', plan: mealPlan.dailyTotal.protein, target: mealPlan.targetMacros.protein, unit: 'g', color: 'var(--success)' },
                { label: 'Carbs', plan: mealPlan.dailyTotal.carbs, target: mealPlan.targetMacros.carbs, unit: 'g', color: 'var(--accent)' },
                { label: 'Fat', plan: mealPlan.dailyTotal.fat, target: mealPlan.targetMacros.fat, unit: 'g', color: 'var(--warning)' },
              ].map(item => {
                const percent = Math.round((item.plan / item.target) * 100);
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 700 }}>{item.plan} / {item.target}{item.unit}</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%`, background: item.color }}></div>
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>{percent}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
