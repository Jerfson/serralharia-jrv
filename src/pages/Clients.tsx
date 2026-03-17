import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Client } from '../types';

export const Clients = () => {
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    observation: '',
  });

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.document && c.document.includes(searchTerm)) ||
    c.phone.includes(searchTerm)
  );

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        document: client.document || '',
        phone: client.phone,
        email: client.email,
        address: client.address || '',
        observation: client.observation || '',
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', document: '', phone: '', email: '', address: '', observation: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Simple mask for phone (WhatsApp)
    if (name === 'phone') {
      const v = value.replace(/\D/g, '');
      let formatted = v;
      if (v.length > 2) formatted = `(${v.substring(0, 2)}) ${v.substring(2)}`;
      if (v.length > 7) formatted = `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7, 11)}`;
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    // Simple mask for CPF/CNPJ
    if (name === 'document') {
      const v = value.replace(/\D/g, '');
      let formatted = v;
      if (v.length <= 11) {
        // CPF
        if (v.length > 3) formatted = `${v.substring(0, 3)}.${v.substring(3)}`;
        if (v.length > 6) formatted = `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6)}`;
        if (v.length > 9) formatted = `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6, 9)}-${v.substring(9, 11)}`;
      } else {
        // CNPJ
        if (v.length > 2) formatted = `${v.substring(0, 2)}.${v.substring(2)}`;
        if (v.length > 5) formatted = `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5)}`;
        if (v.length > 8) formatted = `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5, 8)}/${v.substring(8)}`;
        if (v.length > 12) formatted = `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5, 8)}/${v.substring(8, 12)}-${v.substring(12, 14)}`;
      }
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await updateClient(editingClient.id, formData);
    } else {
      await addClient(formData);
    }
    handleCloseForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2" size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, documento ou telefone..."
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
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-500">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome/Empresa</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ (Opcional)</label>
                <input
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rua, número, bairro, cidade..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
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
                  placeholder="Ex: Cliente prefere contato por WhatsApp..."
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
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{client.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenForm(client)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      // Removed window.confirm due to iframe restrictions
                      await deleteClient(client.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 flex-1">
                {client.document && <p><span className="font-medium text-gray-900">Doc:</span> {client.document}</p>}
                <p><span className="font-medium text-gray-900">Tel:</span> {client.phone}</p>
                {client.email && <p className="truncate"><span className="font-medium text-gray-900">Email:</span> {client.email}</p>}
                {client.address && <p className="line-clamp-1"><span className="font-medium text-gray-900">End:</span> {client.address}</p>}
                {client.observation && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Observação</p>
                    <p className="text-gray-700 line-clamp-2" title={client.observation}>{client.observation}</p>
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
