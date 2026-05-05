'use client';
import { useEffect, useState } from 'react';

export default function CategoryFilter({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  }, []);

  const handleClick = (id) => {
    setActiveCategory(id);
    onSelect(id);
  };

  return (
    <div className="filter-menu">
      {/* "All" button to show all posts */}
      <button 
        className={activeCategory === null ? 'active-all' : ''}
        onClick={() => handleClick(null)}
        style={{ 
          backgroundColor: activeCategory === null ? '#333' : 'transparent',
          color: activeCategory === null ? '#fff' : '#333',
          borderColor: '#333'
        }}
      >
        All
      </button>
      {/* Render category buttons */}
      {categories.map(cat => (
        <button 
          key={cat.id} 
          className={activeCategory === cat.id ? 'active' : ''}
          onClick={() => handleClick(cat.id)}
          style={{ 
            borderColor: cat.color,
            color: activeCategory === cat.id ? '#fff' : cat.color,
            backgroundColor: activeCategory === cat.id ? cat.color : 'transparent'
          }}
        >
          {cat.category_name}
        </button>
      ))}
    </div>
  );
}