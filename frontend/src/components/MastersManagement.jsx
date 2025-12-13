import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const MastersManagement = ({ user }) => {
  const [masters, setMasters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    annee_universitaire: '2024-2025'
  });

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/masters`);
      const data = await response.json();
      if (data.success) setMasters(data.data || []);
    } catch (error) {
      console.error('Erreur chargement masters:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.code) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!user || !user.id) {
      alert('Erreur: utilisateur non authentifié');
      return;
    }

    try {
      if (editingMaster) {
        // Mode modification
        const response = await fetch(`${API_BASE_URL}/masters/${editingMaster.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, responsable_id: user.id })
        });
        const data = await response.json();
        if (data.success) {
          alert('Master modifié avec succès');
          resetForm();
          fetchMasters();
        } else {
          alert(data.error || 'Erreur lors de la modification');
        }
      } else {
        // Mode création
        const response = await fetch(`${API_BASE_URL}/masters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, responsable_id: user.id })
        });
        const data = await response.json();
        if (data.success) {
          alert('Master créé avec succès');
          resetForm();
          fetchMasters();
        } else {
          alert(data.error || 'Erreur lors de la création');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  const handleEdit = (master) => {
    setEditingMaster(master);
    setFormData({
      nom: master.nom,
      code: master.code,
      annee_universitaire: master.annee_universitaire
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce master ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/masters/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('Master supprimé avec succès');
        fetchMasters();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression master:', error);
      alert('Erreur lors de la suppression du master');
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', code: '', annee_universitaire: '2024-2025' });
    setEditingMaster(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Liste des Masters</h3>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
        >
          {showForm ? (
            <>
              <X size={18} />
              Annuler
            </>
          ) : (
            '+ Nouveau Master'
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h4 className="text-lg font-semibold mb-4">
            {editingMaster ? 'Modifier le Master' : 'Créer un Master'}
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du master *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Master Informatique"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  placeholder="Ex: MIAGE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année universitaire
              </label>
              <input
                type="text"
                placeholder="Ex: 2024-2025"
                value={formData.annee_universitaire}
                onChange={(e) => setFormData({ ...formData, annee_universitaire: e.target.value })}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                {editingMaster ? 'Modifier' : 'Créer'}
              </button>
              {editingMaster && (
                <button 
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Annuler la modification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Année</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {masters.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  Aucun master enregistré
                </td>
              </tr>
            ) : (
              masters.map(master => (
                <tr 
                  key={master.id} 
                  className={`border-t hover:bg-gray-50 transition ${
                    editingMaster?.id === master.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-medium">{master.code}</td>
                  <td className="px-6 py-4">{master.nom}</td>
                  <td className="px-6 py-4 text-gray-600">{master.annee_universitaire}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(master)}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(master.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {masters.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total: {masters.length} master{masters.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default MastersManagement;