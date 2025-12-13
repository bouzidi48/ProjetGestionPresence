import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Plus, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, Filter } from 'lucide-react';


const API_BASE_URL = 'http://localhost:3001/presences';

const SeancesManagement = ({ user }) => {
  const [cours, setCours] = useState([]);
  const [seances, setSeances] = useState([]);
  const [filteredSeances, setFilteredSeances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCours, setSelectedCours] = useState(null);
  const [etudiants, setEtudiants] = useState([])
  // Filtre de présence
  const [presenceFilter, setPresenceFilter] = useState('tous'); // 'tous', 'effectuee', 'en_attente'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [formData, setFormData] = useState({
    cours_id: '',
    date_seance: '',
    heure_debut: '',
    heure_fin: '',
    salle: ''
  });

  useEffect(() => {
    fetchMesCours();
  }, []);

  useEffect(() => {
    if (selectedCours) {
      fetchSeancesByCours(selectedCours.id);
      fetchEtudiantsByCours(selectedCours.id);
    }
  }, [selectedCours]);

  // Appliquer le filtre quand les séances ou le filtre changent
  useEffect(() => {
    applyFilter();
  }, [seances, presenceFilter]);

  const applyFilter = () => {
    let filtered = [...seances];
    
    if (presenceFilter === 'effectuee') {
      filtered = filtered.filter(s => s.presence_effectuee === true || s.presence_effectuee === 1);
    } else if (presenceFilter === 'en_attente') {
      filtered = filtered.filter(s => s.presence_effectuee === false || s.presence_effectuee === 0);
    }
    
    setFilteredSeances(filtered);
    setCurrentPage(1); // Réinitialiser à la première page
  };

  const fetchMesCours = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cours/professeur/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setCours(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedCours(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeancesByCours = async (coursId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/seances/cours/${coursId}`);
      const data = await response.json();
      if (data.success) {
        setSeances(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEtudiantsByCours = async (coursId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours/${coursId}/etudiants`);
      const data = await response.json();
      if (data.success) {
        setEtudiants(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement étudiants par cours:', error);
      setEtudiants([]);
    }
  };

  const handleMarquerPresence = async (seanceId) => {
    if (!confirm('Êtes-vous sûr de vouloir marquer cette séance comme présence effectuée ?')) return;

    try {
      // ✅ D'abord, charger les étudiants du cours si ce n'est pas déjà fait
      if (etudiants.length === 0) {
        await fetchEtudiantsByCours(selectedCours.id);
      }

      // ✅ Parcourir les étudiants et créer des absences pour ceux qui n'ont pas de présence
      for (let etudiant of etudiants) {
        try {
          const res = await fetch(`${API_BASE_URL}/presences/seance/${seanceId}/etudiant/${etudiant.id}`, {
            method: 'GET'
          });
          const data = await res.json();
        
          // ✅ Si l'étudiant n'a pas de présence enregistrée, créer une absence
          if (data.success === false || !data.data) {
            await fetch(`${API_BASE_URL}/absences`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                etudiant_id: etudiant.id,
                seance_id: seanceId,
                justifiee: null,
                // presence_id peut être null ou omis si pas de présence
              })
            });
            console.log(`Absence créée pour l'étudiant ${etudiant.id}`);
          }
        } catch (err) {
          console.error(`Erreur pour l'étudiant ${etudiant.id}:`, err);
        }
      }

      // ✅ Marquer la séance comme effectuée
      const response = await fetch(`${API_BASE_URL}/seances/${seanceId}/marquer-presence`, {
        method: 'PUT'
      });

      const data = await response.json();
    
      if (data.success) {
        alert('Présence marquée comme effectuée avec succès');
        fetchSeancesByCours(selectedCours.id);
      } else {
        alert('Erreur : ' + (data.error || 'Échec de la mise à jour'));
      }
    } catch (error) {
      console.error('Erreur marquage présence:', error);
      alert('Erreur lors du marquage de la présence');
    }
  };

  const handleAddSeance = () => {
    setModalMode('add');
    setFormData({
      cours_id: selectedCours?.id || '',
      date_seance: '',
      heure_debut: '',
      heure_fin: '',
      salle: ''
    });
    setShowModal(true);
  };

  const handleEditSeance = (seance) => {
    setModalMode('edit');
    setSelectedSeance(seance);
    setFormData({
      cours_id: seance.cours_id,
      date_seance: seance.date_seance,
      heure_debut: seance.heure_debut,
      heure_fin: seance.heure_fin,
      salle: seance.salle || ''
    });
    setShowModal(true);
  };

  const handleDeleteSeance = async (seanceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/seances/${seanceId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('Séance supprimée avec succès');
        fetchSeancesByCours(selectedCours.id);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = modalMode === 'add' 
        ? `${API_BASE_URL}/seances`
        : `${API_BASE_URL}/seances/${selectedSeance.id}`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(modalMode === 'add' ? 'Séance ajoutée' : 'Séance modifiée');
        setShowModal(false);
        fetchSeancesByCours(selectedCours.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.slice(0, 5);
  };

  // Pagination sur les séances filtrées
  const totalPages = Math.ceil(filteredSeances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSeances = filteredSeances.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = (current, total) => {
    const pages = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  // Statistiques pour les badges de filtre
  const statsPresence = {
    tous: seances.length,
    effectuee: seances.filter(s => s.presence_effectuee === true || s.presence_effectuee === 1).length,
    en_attente: seances.filter(s => s.presence_effectuee === false || s.presence_effectuee === 0).length
  };

  return (
    <div>
      {/* Sélection du cours et filtre */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez un cours
            </label>
            <select
              value={selectedCours?.id || ''}
              onChange={(e) => {
                const coursSelected = cours.find(c => c.id === parseInt(e.target.value));
                setSelectedCours(coursSelected);
                setCurrentPage(1);
                setPresenceFilter('tous');
              }}
              className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {cours.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddSeance}
            disabled={!selectedCours}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
          >
            <Plus size={20} />
            Ajouter une séance
          </button>
        </div>

        {/* Filtres de présence */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Filter size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
          
          <button
            onClick={() => setPresenceFilter('tous')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              presenceFilter === 'tous'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({statsPresence.tous})
          </button>

          <button
            onClick={() => setPresenceFilter('effectuee')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              presenceFilter === 'effectuee'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Effectuées ({statsPresence.effectuee})
          </button>

          <button
            onClick={() => setPresenceFilter('en_attente')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              presenceFilter === 'en_attente'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({statsPresence.en_attente})
          </button>
        </div>
      </div>

      {/* Liste des séances */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Horaires</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Salle</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Présence</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : currentSeances.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  {presenceFilter === 'tous' 
                    ? 'Aucune séance pour ce cours'
                    : `Aucune séance ${presenceFilter === 'effectuee' ? 'effectuée' : 'en attente'}`
                  }
                </td>
              </tr>
            ) : (
              currentSeances.map(seance => {
                const presenceEffectuee = seance.presence_effectuee === true || seance.presence_effectuee === 1;
                
                return (
                  <tr key={seance.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{formatDate(seance.date_seance)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{formatTime(seance.heure_debut)} - {formatTime(seance.heure_fin)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {seance.salle || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        presenceEffectuee
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {presenceEffectuee ? 'Effectuée' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!presenceEffectuee && (
                          <button
                            onClick={() => handleMarquerPresence(seance.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="Marquer comme effectuée"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditSeance(seance)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSeance(seance.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredSeances.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredSeances.length)} sur {filteredSeances.length}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToPreviousPage} disabled={currentPage === 1} className={`p-2 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
              <ChevronLeft size={20} />
            </button>
            {getPageNumbers(currentPage, totalPages).map((page, index) => (
              <button key={index} onClick={() => typeof page === 'number' && goToPage(page)} disabled={page === '...'} className={`px-3 py-1 rounded ${page === currentPage ? 'bg-green-600 text-white' : page === '...' ? 'text-gray-400 cursor-default' : 'text-gray-700 hover:bg-gray-100'}`}>
                {page}
              </button>
            ))}
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Ajouter une séance' : 'Modifier la séance'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={formData.date_seance} onChange={(e) => setFormData({...formData, date_seance: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure début *</label>
                  <input type="time" value={formData.heure_debut} onChange={(e) => setFormData({...formData, heure_debut: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin *</label>
                  <input type="time" value={formData.heure_fin} onChange={(e) => setFormData({...formData, heure_fin: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                <input type="text" value={formData.salle} onChange={(e) => setFormData({...formData, salle: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Ex: A101" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">{modalMode === 'add' ? 'Ajouter' : 'Modifier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeancesManagement;