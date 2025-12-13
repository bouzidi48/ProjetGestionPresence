import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, UserPlus } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const CoursManagement = () => {
  const [cours, setCours] = useState([]);
  const [masters, setMasters] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCours, setEditingCours] = useState(null);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [coursToAffect, setCoursToAffect] = useState(null);
  const [selectedProfesseur, setSelectedProfesseur] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    master_id: '',
    professeur_id: '',
    description: ''
  });

  useEffect(() => {
    fetchCours();
    fetchMasters();
    fetchProfesseurs();
  }, []);

  const fetchCours = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours`);
      const data = await response.json();
      if (data.success) setCours(data.data || []);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    }
  };

  const fetchMasters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/masters`);
      const data = await response.json();
      if (data.success) setMasters(data.data || []);
    } catch (error) {
      console.error('Erreur chargement masters:', error);
    }
  };

  const fetchProfesseurs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/role/professeur`);
      const data = await response.json();
      if (data.success) setProfesseurs(data.data || []);
    } catch (error) {
      console.error('Erreur chargement professeurs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      code: '',
      master_id: '',
      professeur_id: '',
      description: ''
    });
    setEditingCours(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.code || !formData.master_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingCours) {
        // Mode modification
        const response = await fetch(`${API_BASE_URL}/cours/${editingCours.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          alert('Cours modifié avec succès');
          resetForm();
          fetchCours();
        } else {
          alert(data.error || 'Erreur lors de la modification');
        }
      } else {
        // Mode création
        const response = await fetch(`${API_BASE_URL}/cours`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          alert('Cours créé avec succès');
          resetForm();
          fetchCours();
        } else {
          alert(data.error || 'Erreur lors de la création');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'opération');
    }
  };

  const handleEdit = (cours) => {
    setEditingCours(cours);
    setFormData({
      nom: cours.nom,
      code: cours.code,
      master_id: cours.master_id,
      professeur_id: cours.professeur_id || '',
      description: cours.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/cours/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('Cours supprimé avec succès');
        fetchCours();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression cours:', error);
      alert('Erreur lors de la suppression du cours');
    }
  };

  const handleAffecterProfesseur = (cours) => {
    setCoursToAffect(cours);
    setSelectedProfesseur('');
    setShowAffectationModal(true);
  };

  const submitAffectation = async () => {
    if (!selectedProfesseur) {
      alert('Veuillez sélectionner un professeur');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cours/${coursToAffect.id}/affecter-professeur`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professeur_id: parseInt(selectedProfesseur) })
      });
      const data = await response.json();
      if (data.success) {
        alert('Professeur affecté avec succès');
        setShowAffectationModal(false);
        setCoursToAffect(null);
        setSelectedProfesseur('');
        fetchCours();
      } else {
        alert(data.error || 'Erreur lors de l\'affectation');
      }
    } catch (error) {
      console.error('Erreur affectation professeur:', error);
      alert('Erreur lors de l\'affectation du professeur');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Liste des Cours</h3>
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
            '+ Nouveau Cours'
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h4 className="text-lg font-semibold mb-4">
            {editingCours ? 'Modifier le Cours' : 'Créer un Cours'}
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du cours *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Intelligence Artificielle"
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
                  placeholder="Ex: IA101"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Master *
                </label>
                <select
                  value={formData.master_id}
                  onChange={(e) => setFormData({ ...formData, master_id: e.target.value })}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un master</option>
                  {masters.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom} ({m.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professeur
                </label>
                <select
                  value={formData.professeur_id}
                  onChange={(e) => setFormData({ ...formData, professeur_id: e.target.value })}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un professeur (optionnel)</option>
                  {professeurs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Description du cours (optionnel)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                {editingCours ? 'Modifier' : 'Créer'}
              </button>
              {editingCours && (
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

      {/* Modal d'affectation de professeur */}
      {showAffectationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Affecter un Professeur</h4>
              <button
                onClick={() => {
                  setShowAffectationModal(false);
                  setCoursToAffect(null);
                  setSelectedProfesseur('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Cours: <span className="font-medium">{coursToAffect?.nom}</span>
              </p>
              <p className="text-sm text-gray-600">
                Code: <span className="font-medium">{coursToAffect?.code}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un professeur *
              </label>
              <select
                value={selectedProfesseur}
                onChange={(e) => setSelectedProfesseur(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choisir un professeur</option>
                {professeurs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitAffectation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Affecter
              </button>
              <button
                onClick={() => {
                  setShowAffectationModal(false);
                  setCoursToAffect(null);
                  setSelectedProfesseur('');
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                Annuler
              </button>
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Master</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Professeur</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cours.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Aucun cours enregistré
                </td>
              </tr>
            ) : (
              cours.map(c => (
                <tr 
                  key={c.id} 
                  className={`border-t hover:bg-gray-50 transition ${
                    editingCours?.id === c.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-medium">{c.code}</td>
                  <td className="px-6 py-4">{c.nom}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {c.master?.nom || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {c.professeur?.prenom && c.professeur?.nom 
                      ? `${c.professeur.prenom} ${c.professeur.nom}`
                      : 'Non affecté'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!c.professeur_id && (
                        <button
                          onClick={() => handleAffecterProfesseur(c)}
                          className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded transition"
                          title="Affecter un professeur"
                        >
                          <UserPlus size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(c)}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
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

      {cours.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total: {cours.length} cours
        </div>
      )}
    </div>
  );
};

export default CoursManagement;