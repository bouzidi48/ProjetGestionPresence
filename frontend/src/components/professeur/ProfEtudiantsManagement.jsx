import React, { useState, useEffect } from 'react';
import { Eye, X, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter, Download, FileX } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const ProfEtudiantsManagement = ({ user }) => {
  const [etudiants, setEtudiants] = useState([]);
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [masterId, setMasterId] = useState(null);

  // Pagination pour la liste des étudiants
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Pagination pour les records dans le modal
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const modalItemsPerPage = 5;

  useEffect(() => {
    fetchMesCours();
  }, []);

  useEffect(() => {
    if (selectedCours) {
      fetchEtudiantsByCours(selectedCours);
      setCurrentPage(1);
    }
  }, [selectedCours]);

  const fetchMesCours = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours/professeur/${user.id}`);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setCours(data.data);
        
        // Sélectionner automatiquement le premier cours
        setSelectedCours(data.data[0].id);
        
        // Récupérer le master_id
        if (data.data[0].master_id) {
          setMasterId(data.data[0].master_id);
        }
      }
    } catch (error) {
      console.error('Erreur chargement cours:', error);
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

  const handleViewPresences = async (etudiant) => {
    setSelectedEtudiant(etudiant);
    setModalType('presences');
    setShowModal(true);
    setLoading(true);
    setRecords([]);
    setModalCurrentPage(1);

    try {
      const response = await fetch(
        `${API_BASE_URL}/presences/cours/${selectedCours}/etudiant/${etudiant.id}`
      );
      const data = await response.json();
      
      if (data.success) {
        const presencesArray = Array.isArray(data.data) ? data.data : [data.data];
        setRecords(presencesArray);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Erreur chargement présences:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAbsences = async (etudiant) => {
    setSelectedEtudiant(etudiant);
    setModalType('absences');
    setShowModal(true);
    setLoading(true);
    setRecords([]);
    setModalCurrentPage(1);

    try {
      const response = await fetch(
        `${API_BASE_URL}/absences/cours/${selectedCours}/etudiant/${etudiant.id}`
      );
      const data = await response.json();
      
      if (data.success) {
        const absencesArray = Array.isArray(data.data) ? data.data : [data.data];
        setRecords(absencesArray);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Erreur chargement absences:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEtudiant(null);
    setRecords([]);
    setModalType('');
    setModalCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.slice(0, 5);
  };

  // Calculs pagination étudiants
  const totalPages = Math.ceil(etudiants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEtudiants = etudiants.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Calculs pagination modal
  const modalTotalPages = Math.ceil(records.length / modalItemsPerPage);
  const modalStartIndex = (modalCurrentPage - 1) * modalItemsPerPage;
  const modalEndIndex = modalStartIndex + modalItemsPerPage;
  const currentRecords = records.slice(modalStartIndex, modalEndIndex);

  const goToModalPage = (page) => {
    setModalCurrentPage(page);
  };

  const goToPreviousModalPage = () => {
    if (modalCurrentPage > 1) setModalCurrentPage(modalCurrentPage - 1);
  };

  const goToNextModalPage = () => {
    if (modalCurrentPage < modalTotalPages) setModalCurrentPage(modalCurrentPage + 1);
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = (current, total) => {
    const pages = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
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

  // Obtenir le cours sélectionné
  const currentCours = cours.find(c => c.id === selectedCours);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Liste des Étudiants</h3>
        
        {/* Filtre par cours */}
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-gray-600" />
          <select
            value={selectedCours || ''}
            onChange={(e) => setSelectedCours(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {cours.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Prénom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEtudiants.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Aucun étudiant inscrit à ce cours
                </td>
              </tr>
            ) : (
              currentEtudiants.map(etudiant => (
                <tr key={etudiant.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="relative w-12 h-12">
                      {etudiant.image_faciale_path ? (
                        <>
                          <img 
                            src={etudiant.image_faciale_path} 
                            alt={`${etudiant.prenom} ${etudiant.nom}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                            style={{ display: 'none' }}
                          >
                            {etudiant.prenom?.[0]}{etudiant.nom?.[0]}
                          </div>
                        </>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                          {etudiant.prenom?.[0]}{etudiant.nom?.[0]}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{etudiant.nom}</td>
                  <td className="px-6 py-4">{etudiant.prenom}</td>
                  <td className="px-6 py-4 text-gray-600">{etudiant.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewPresences(etudiant)}
                        className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded transition"
                        title="Voir les présences"
                      >
                        <CheckCircle size={16} />
                        Présences
                      </button>
                      <button
                        onClick={() => handleViewAbsences(etudiant)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Voir les absences"
                      >
                        <XCircle size={16} />
                        Absences
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination étudiants */}
      {etudiants.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(endIndex, etudiants.length)} sur {etudiants.length} étudiant{etudiants.length > 1 ? 's' : ''}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              {getPageNumbers(currentPage, totalPages).map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                  className={`px-3 py-1 rounded ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : page === '...'
                      ? 'text-gray-400 cursor-default'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal pour afficher présences ou absences */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  {modalType === 'presences' ? (
                    <>
                      <CheckCircle className="text-green-600" size={20} />
                      Présences
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-600" size={20} />
                      Absences
                    </>
                  )}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEtudiant?.prenom} {selectedEtudiant?.nom}
                  {currentCours && (
                    <span className="ml-2 text-blue-600">
                      • {currentCours.nom}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {modalType === 'presences' ? (
                    <>
                      <CheckCircle className="text-gray-300 mb-3" size={48} />
                      <p className="text-gray-500 text-lg">
                        Aucune présence enregistrée pour ce cours
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-gray-300 mb-3" size={48} />
                      <p className="text-gray-500 text-lg">
                        Aucune absence enregistrée pour ce cours
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Horaires
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Salle
                        </th>
                        {modalType === 'presences' && (
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Statut
                          </th>
                        )}
                        {modalType === 'absences' && (
                          <>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Justifiée
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Justificatif
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Commentaire
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.map((record, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {formatDate(record.seance?.date_seance || record.date_absence)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.seance?.heure_debut && record.seance?.heure_fin
                              ? `${formatTime(record.seance.heure_debut)} - ${formatTime(record.seance.heure_fin)}`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.seance?.salle || '-'}
                          </td>
                          {modalType === 'presences' && (
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.present 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.present ? 'Présent' : 'Absent'}
                              </span>
                            </td>
                          )}
                          {modalType === 'absences' && (
                            <>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  record.justifiee === null 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : record.justifiee === 1 || record.justifiee === true
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}>
                                  {record.justifiee === null 
                                    ? 'En attente' 
                                    : record.justifiee === 1 || record.justifiee === true
                                    ? 'Oui' 
                                    : 'Non'
                                  }
                                </span>
                              </td>
                              
                              {/* ✅ Colonne Justificatif avec bouton de téléchargement */}
                              <td className="px-4 py-3 text-sm">
                                {record.fichier_justificatif_path ? (
                                  <a
                                    href={record.fichier_justificatif_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Voir le justificatif"
                                  >
                                    <Download size={14} />
                                    <span className="text-xs">Voir</span>
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                                    <FileX size={14} />
                                    Aucun fichier
                                  </span>
                                )}
                              </td>
                              
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {record.commentaire_responsable || '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {records.length > 0 && (
                    <>
                      Affichage de {modalStartIndex + 1} à {Math.min(modalEndIndex, records.length)} sur{' '}
                      <span className="font-semibold">{records.length}</span>{' '}
                      {modalType === 'presences' ? 'présence(s)' : 'absence(s)'}
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Pagination modal */}
                  {modalTotalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousModalPage}
                        disabled={modalCurrentPage === 1}
                        className={`p-1 rounded ${
                          modalCurrentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {getPageNumbers(modalCurrentPage, modalTotalPages).map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && goToModalPage(page)}
                          disabled={page === '...'}
                          className={`px-2 py-1 text-sm rounded ${
                            page === modalCurrentPage
                              ? 'bg-blue-600 text-white'
                              : page === '...'
                              ? 'text-gray-400 cursor-default'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={goToNextModalPage}
                        disabled={modalCurrentPage === modalTotalPages}
                        className={`p-1 rounded ${
                          modalCurrentPage === modalTotalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfEtudiantsManagement;