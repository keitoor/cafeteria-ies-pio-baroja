import { memo } from 'react';

function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="search-bar">
      <span className="search-bar-icon">🔍</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default memo(SearchBar);
