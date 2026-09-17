import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getWorkoutHistory, getMealHistory } from '../services/api';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [workoutStats, setWorkoutStats] = useState({ count: 0, calories: 0 });
  const [mealStats, setMealStats] = useState({ todayCalories: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  useEffect(() => {
    if (user?._id) {
      loadStats();
    }
  }, [user]);

  async function loadStats() {
    try {
      const [workouts, meals] = await Promise.all([
        getWorkoutHistory(user._id, 7),
        getMealHistory(user._id, 1)
      ]);
      
      setWorkoutStats({
        count: workouts.data.length,
        calories: workouts.data.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0)
      });
      
      if (meals.data.length > 0) {
        setMealStats({
          todayCalories: meals.data[0].dailyTotal?.calories || 0
        });
      }
    } catch (err) {
      // Server not running — use defaults
    }
  }

  if (!user) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height) - var(--space-xl) - var(--space-xl))' }}>
        {/* Compact Header + CTA */}
        <div className="card" style={{ 
          display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', 
          padding: 'var(--space-lg) var(--space-xl)',
          background: 'linear-gradient(135deg, rgba(108,92,231,0.12), rgba(0,210,255,0.08))',
          border: '1px solid rgba(108,92,231,0.25)',
          marginBottom: 'var(--space-lg)',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '3rem', flexShrink: 0 }}>💪</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: '4px', 
              background: 'linear-gradient(135deg, var(--text-primary), var(--accent))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome to FitLens AI
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
              Set up your profile to get personalized workout plans, meal suggestions, and AI-powered form correction.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/profile')} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            🚀 Create Your Profile
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)',
          flex: 1, minHeight: 0
        }} className="stagger-children">
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-lg)' }} onClick={() => setShowProfileModal(true)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(108,92,231,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🤖</div>
            <h3 style={{ marginBottom: 'var(--space-xs)', fontSize: 'var(--font-md)' }}>AI Form Correction</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.4 }}>
              Real-time skeleton tracking with posture analysis for injury prevention
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-lg)' }} onClick={() => setShowProfileModal(true)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,210,255,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🥗</div>
            <h3 style={{ marginBottom: 'var(--space-xs)', fontSize: 'var(--font-md)' }}>Smart Meal Plans</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.4 }}>
              Personalized nutrition based on your goals, calories, and dietary preferences
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-lg)' }} onClick={() => setShowProfileModal(true)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,230,118,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📅</div>
            <h3 style={{ marginBottom: 'var(--space-xs)', fontSize: 'var(--font-md)' }}>Workout Scheduling</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.4 }}>
              Custom weekly programs (PPL, Full Body, HIIT) tailored to your availability
            </p>
          </div>
        </div>

        {/* Profile Required Modal */}
        {showProfileModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setShowProfileModal(false)}>
            <div style={{
              background: 'linear-gradient(145deg, var(--bg-secondary), var(--bg-primary))',
              border: '1px solid rgba(108,92,231,0.3)',
              borderRadius: '16px', padding: '2.5rem', maxWidth: '420px', width: '90%',
              textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👤</div>
              <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Create a Profile First!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                You need to set up your profile before accessing this feature. It only takes a minute!
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => navigate('/profile')}
                  style={{ padding: '0.65rem 1.5rem', fontWeight: 600 }}>
                  🚀 Create Profile
                </button>
                <button onClick={() => setShowProfileModal(false)}
                  style={{
                    padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                    background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  const calorieProgress = user.dailyCalories > 0 
    ? Math.round((mealStats.todayCalories / user.dailyCalories) * 100) 
    : 0;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Hey, {user.name}! 👋</h1>
        <p className="page-subtitle">Here's your fitness overview for today</p>
      </div>

      <div className="stat-grid stagger-children">
        <StatCard icon="🔥" value={`${user.dailyCalories}`} label="Daily Calorie Target" variant="primary" />
        <StatCard icon="🏋️" value={workoutStats.count} label="Workouts This Week" variant="success" />
        <StatCard icon="⚡" value={`${workoutStats.calories}`} label="Calories Burned (Week)" variant="warning" />
        <StatCard icon="🍽️" value={`${mealStats.todayCalories}`} label="Calories Eaten Today" variant="danger" />
      </div>

      {/* Calorie Progress */}
      <div className="section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Calorie Progress</h3>
            <span className="badge badge-primary">{calorieProgress}%</span>
          </div>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div 
              className={`progress-fill ${calorieProgress > 100 ? 'danger' : calorieProgress > 80 ? 'warning' : 'primary'}`}
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <span>{mealStats.todayCalories} kcal consumed</span>
            <span>{Math.max(0, user.dailyCalories - mealStats.todayCalories)} kcal remaining</span>
          </div>
        </div>
      </div>

      {/* Macro Targets */}
      <div className="section">
        <h2 className="section-title">📊 Daily Macro Targets</h2>
        <div className="grid-3 stagger-children">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--success)' }}>
              {user.macros?.protein || 0}g
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>Protein</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--accent)' }}>
              {user.macros?.carbs || 0}g
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>Carbs</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--warning)' }}>
              {user.macros?.fat || 0}g
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>Fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">⚡ Quick Actions</h2>
        <div className="grid-3 stagger-children">
          <button className="card" onClick={() => navigate('/workout')} style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(108,92,231,0.3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>🎯</div>
            <h3>Start AI Workout</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
              Camera-based form correction
            </p>
          </button>
          <button className="card" onClick={() => navigate('/meals')} style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(0,210,255,0.3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>🍽️</div>
            <h3>Generate Meal Plan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
              AI-powered nutrition planner
            </p>
          </button>
          <button className="card" onClick={() => navigate('/schedule')} style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(0,230,118,0.3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>📅</div>
            <h3>View Schedule</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
              Your weekly workout plan
            </p>
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="section">
        <h2 className="section-title">📋 Your Profile</h2>
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-lg)' }}>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weight</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>{user.weight} kg</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Height</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>{user.height} cm</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BMR</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>{user.bmr} kcal</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TDEE</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>{user.tdee} kcal</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Goal</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>
                {user.goal === 'lose_fat' ? '🔥 Lose Fat' : user.goal === 'build_muscle' ? '💪 Build Muscle' : '⚖️ Maintain'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Program</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>
                {user.preferredProgram?.replace('_', ' ').toUpperCase() || 'Full Body'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
