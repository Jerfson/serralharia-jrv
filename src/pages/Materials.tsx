import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Material } from '../types';

export const Materials = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    unit: 'un' as 'un' | 'kg' | 'mt' | 'par' | 'jg',
    costPrice: '',
    supplier: '',
    observation: '',
  });

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        unit: material.unit,
        costPrice: material.costPrice.toString(),
        supplier: material.supplier,
        observation: material.observation || '',
      });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', unit: 'un', costPrice: '', supplier: '', observation: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMaterial(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      costPrice: parseFloat(formData.costPrice.replace(',', '.')),
    };
    if (editingMaterial) {
      await updateMaterial(editingMaterial.id, data);
    } else {
      await addMaterial(data);
    }
    handleCloseForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Catálogo de Materiais</h2>
        <button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2" size={20} />
          Novo Material
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou fornecedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </h3>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-500">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Material</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="mt">Metro (mt)</option>
                    <option value="par">Par (par)</option>
                    <option value="jg">Jogo (jg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    required
                    value={formData.costPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea
                  name="observation"
                  value={formData.observation}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ex: Material comprado apenas sob encomenda..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum material encontrado.
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{material.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenForm(material)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      // Removed window.confirm due to iframe restrictions
                      await deleteMaterial(material.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 flex-1">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-900">Custo:</span>
                  <span className="font-bold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(material.costPrice)} / {material.unit}
                  </span>
                </p>
                {material.supplier && (
                  <p className="truncate"><span className="font-medium text-gray-900">Fornecedor:</span> {material.supplier}</p>
                )}
                {material.observation && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Observação</p>
                    <p className="text-gray-700 line-clamp-2" title={material.observation}>{material.observation}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
