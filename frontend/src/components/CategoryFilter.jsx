import { mockCategories } from '../services/mockData';

export default function CategoryFilter({ active, onChange, inline = false }) {
  if (inline) {
    return (
      <>
        {mockCategories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-pill ${active === cat.id ? 'active' : ''}`}
            onClick={() => onChange(cat.id)}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </>
    );
  }

  return (
    <div className="category-filter">
      {mockCategories.map((cat) => (
        <button
          key={cat.id}
          className={`cat-pill ${active === cat.id ? 'active' : ''}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.emoji} {cat.name}
        </button>
      ))}
    </div>
  );
}
