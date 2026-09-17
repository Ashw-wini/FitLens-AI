export default function ExerciseCard({ exercise, onSelect, compact = false }) {
  if (!exercise) return null;
  
  return (
    <div className="exercise-card" onClick={() => onSelect?.(exercise)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
      <div className="exercise-card-header">
        <span className="exercise-name">{exercise.name}</span>
        <span className={`badge badge-${exercise.difficulty === 'beginner' ? 'success' : exercise.difficulty === 'intermediate' ? 'warning' : 'danger'}`}>
          {exercise.difficulty}
        </span>
      </div>
      {!compact && (
        <>
          <div className="exercise-muscles">
            {(exercise.muscles || []).map(m => (
              <span key={m} className="muscle-tag">{m}</span>
            ))}
          </div>
          <div className="sets-reps" style={{ marginTop: '8px' }}>
            {exercise.sets || exercise.defaultSets || 3} sets × {exercise.reps || exercise.defaultReps || 10} reps
          </div>
          {exercise.instructions && (
            <p style={{ marginTop: '8px', fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              {exercise.instructions}
            </p>
          )}
        </>
      )}
    </div>
  );
}
