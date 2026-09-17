export default function MealCard({ meal }) {
  if (!meal) return null;
  
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎'
  };

  return (
    <div className="meal-card">
      <div className="meal-card-header">
        <span className="meal-name">
          {mealIcons[meal.mealType] || '🍽️'} {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
        </span>
        <span className="badge badge-primary">{meal.totalCalories} kcal</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(meal.foods || []).map((food, i) => (
          <div key={i} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 'var(--font-sm)', color: 'var(--text-secondary)',
            padding: '4px 0', borderBottom: '1px solid var(--border)'
          }}>
            <span>{food.name}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>{food.servingSize}</span>
          </div>
        ))}
      </div>
      <div className="meal-macros" style={{ marginTop: '12px' }}>
        <span className="macro-item">P: <span>{meal.totalProtein}g</span></span>
        <span className="macro-item">C: <span>{meal.totalCarbs}g</span></span>
        <span className="macro-item">F: <span>{meal.totalFat}g</span></span>
      </div>
    </div>
  );
}
