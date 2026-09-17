import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getSchedule } from '../services/api';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const { user } = useUser();
  const [schedule, setSchedule] = useState(null);
  const [programName, setProgramName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const todayIndex = new Date().getDay();
  const todayKey = WEEKDAYS[(todayIndex + 6) % 7]; // JS getDay: 0=Sun

  useEffect(() => {
    if (user?._id) loadSchedule();
  }, [user]);

  async function loadSchedule() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSchedule(user._id);
      setSchedule(res.data.schedule);
      setProgramName(res.data.program);
    } catch (err) {
      setError('Could not load schedule. Is the server running?');
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="empty-state animate-fade-in-up">
        <div className="empty-state-icon">📅</div>
        <h3>Set Up Your Profile First</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Create your profile to get a personalized workout schedule</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1 className="page-title">Workout Schedule 📅</h1>
            <p className="page-subtitle">
              {programName && `Program: ${programName}`} &nbsp;•&nbsp; {user.workoutDays?.length || 0} days/week
            </p>
          </div>
          <button className="btn btn-outline" onClick={loadSchedule} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>{error}</div>}

      {loading && (
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your schedule...</div>
        </div>
      )}

      {schedule && !loading && (
        <>
          {/* Weekly Overview */}
          <div className="schedule-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
            {WEEKDAYS.map((day, i) => {
              const dayPlan = schedule[day];
              const isToday = day === todayKey;
              const isWorkout = dayPlan?.type === 'workout';
              
              return (
                <div
                  key={day}
                  className={`schedule-day ${!isWorkout ? 'rest' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDay(day)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="schedule-day-label">
                    {DAY_LABELS[i]}
                    {isToday && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>•</span>}
                  </div>
                  <div className="schedule-day-title">
                    {isWorkout ? dayPlan.label : '😴 Rest'}
                  </div>
                  {isWorkout && dayPlan.exercises && (
                    <div>
                      {dayPlan.exercises.slice(0, 3).map((ex, j) => (
                        <div key={j} className="schedule-exercise-mini">
                          {ex.name || 'Exercise'}
                        </div>
                      ))}
                      {dayPlan.exercises.length > 3 && (
                        <div className="schedule-exercise-mini" style={{ color: 'var(--primary-light)' }}>
                          +{dayPlan.exercises.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Day Detail */}
          {selectedDay && schedule[selectedDay] && (
            <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--space-2xl)' }}>
              <div className="card-header">
                <h3 className="card-title">
                  {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} — {schedule[selectedDay].label}
                </h3>
                <span className={`badge ${schedule[selectedDay].type === 'workout' ? 'badge-success' : 'badge-warning'}`}>
                  {schedule[selectedDay].type === 'workout' ? 'Workout Day' : 'Rest Day'}
                </span>
              </div>

              {schedule[selectedDay].type === 'workout' && schedule[selectedDay].exercises && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {schedule[selectedDay].exercises.map((ex, i) => (
                    <div key={i} className="exercise-card">
                      <div className="exercise-card-header">
                        <span className="exercise-name">{ex.name || 'Exercise'}</span>
                        <span className="sets-reps">{ex.sets} × {ex.reps} reps</span>
                      </div>
                      {ex.muscles && (
                        <div className="exercise-muscles">
                          {ex.muscles.map(m => (
                            <span key={m} className="muscle-tag">{m}</span>
                          ))}
                        </div>
                      )}
                      {ex.instructions && (
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', marginTop: '8px', lineHeight: 1.5 }}>
                          {ex.instructions}
                        </p>
                      )}
                      {ex.formCues && ex.formCues.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {ex.formCues.map((cue, j) => (
                            <span key={j} style={{ 
                              fontSize: 'var(--font-xs)', 
                              padding: '2px 8px', 
                              background: 'rgba(0,210,255,0.1)', 
                              borderRadius: 'var(--radius-full)',
                              color: 'var(--accent)'
                            }}>
                              💡 {cue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {schedule[selectedDay].type === 'rest' && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🧘</div>
                  <p>Rest and recovery day. Focus on stretching, mobility work, or light walking.</p>
                </div>
              )}
            </div>
          )}

          {!selectedDay && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-secondary)' }}>
              <p>👆 Click on a day to see the full workout details</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
