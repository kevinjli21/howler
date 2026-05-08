'use client';
import { useEffect, useState } from 'react';

export default function CategoryFilter({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = "All"

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  }, []);

  const handleClick = (id) => {
    // 1. If user clicks "All" while "All" is active, do nothing
    if (id === null && activeCategory === null) return;

    // 2. If user clicks a specific category that is ALREADY active, 
    // it "deselects" and goes back to "All" (null)
    if (id === activeCategory) {
      setActiveCategory(null);
      onSelect(null);
    } else {
      // 3. Otherwise, set the new active category
      setActiveCategory(id);
      onSelect(id);
    }
  };

  return (
    <div className="filter-menu">
      <button 
        // "All" is active if activeCategory is null
        className={activeCategory === null ? 'active-all' : ''}
        onClick={() => handleClick(null)}
        style={{ 
          // Using the UW Purple/White vibe we discussed for the "All" button
          backgroundColor: activeCategory === null ? '#4b2e83' : 'transparent',
          color: activeCategory === null ? '#fff' : '#4b2e83',
          borderColor: '#4b2e83',
          fontWeight: activeCategory === null ? 'bold' : 'bold'
        }}
      >
        All
      </button>

      {categories.map(cat => (
        <button 
          key={cat.id} 
          className={activeCategory === cat.id ? 'active' : ''}
          onClick={() => handleClick(cat.id)}
          style={{ 
            borderColor: cat.color,
            color: activeCategory === cat.id ? '#fff' : cat.color,
            backgroundColor: activeCategory === cat.id ? cat.color : 'transparent',
            // Subtle transition for that "frosted glass" feel
            transition: 'all 0.2s ease'
          }}
        >
          {cat.category_name}
        </button>
      ))}
    </div>
  );
}