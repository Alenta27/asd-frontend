import React from 'react';

const FilterBar = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="awareness-filter-bar" role="tablist" aria-label="Awareness video categories">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={selectedCategory === category}
          className={`awareness-filter-btn ${selectedCategory === category ? 'active' : ''}`}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
