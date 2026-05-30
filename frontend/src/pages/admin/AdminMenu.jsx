import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { mockCategories } from '../../services/mockData';

const EMPTY = { name: '', description: '', price: '', category: 'bocadillos', emoji: '🥪', stock: 0, available: true, allergens: [] };

export default function AdminMenu() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.products.list();
      setProducts(res.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    const payload = { ...editing, price: Number(editing.price), stock: Number(editing.stock) };
    if (!payload.name || !payload.price) { toast.show('Nombre y precio son obligatorios', 'error'); return; }
    try {
      if (editing.id) {
        await api.products.update(editing.id, payload);
        toast.show('Producto actualizado ✓', 'success');
      } else {
        await api.products.create(payload);
        toast.show('Producto añadido ✓', 'success');
      }
      setEditing(null);
      refresh();
    } catch {
      toast.show('Error al guardar el producto', 'error');
    }
  };

  const remove = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    await api.products.remove(p.id);
    toast.show('Producto eliminado', 'success');
    refresh();
  };

  const toggleAvailable = async (p) => {
    await api.products.update(p.id, { available: !p.available });
    toast.show(p.available ? 'Producto desactivado' : 'Producto activado', 'success');
    refresh();
  };

  return (
    <div>
      <button className="admin-btn admin-btn-primary" style={{ marginBottom: 16, fontSize: 14 }}
        onClick={() => setEditing({ ...EMPTY })}>
        + Añadir producto
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#888', padding: 32 }}>Cargando...</div>
      ) : (
        products.map((p) => (
          <div key={p.id} className="admin-order" style={{ opacity: p.available ? 1 : .5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'DM Mono' }}>
                    {Number(p.price).toFixed(2)} €
                  </span>
                  <span style={{ color: p.stock <= 0 ? '#ff6b7a' : p.stock <= 3 ? '#ffa04d' : '#888' }}>
                    Stock: {p.stock}
                  </span>
                  <span style={{ color: p.available ? '#4dff7c' : '#888' }}>
                    {p.available ? 'Disponible' : 'Desactivado'}
                  </span>
                </div>
              </div>
            </div>
            <div className="admin-order-actions">
              <button className="admin-btn admin-btn-secondary" onClick={() => setEditing(p)}>Editar</button>
              <button className="admin-btn admin-btn-secondary" onClick={() => toggleAvailable(p)}>
                {p.available ? 'Desactivar' : 'Activar'}
              </button>
              <button className="admin-btn admin-btn-danger" onClick={() => remove(p)}>Eliminar</button>
            </div>
          </div>
        ))
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing.id ? '✏️ Editar producto' : '➕ Nuevo producto'}</h2>
            <div className="form-field">
              <label className="form-label">Emoji</label>
              <input className="form-input" value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nombre del producto" />
            </div>
            <div className="form-field">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Descripción breve" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-field flex-1">
                <label className="form-label">Precio (€) *</label>
                <input className="form-input" type="number" step="0.1" min="0" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </div>
              <div className="form-field flex-1">
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Categoría</label>
              <select className="form-input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {mockCategories.filter((c) => c.id !== 'todos').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} />
                Disponible para pedir
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
