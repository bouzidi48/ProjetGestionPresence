import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Calendar, User, BookOpen, ChevronLeft, ChevronRight, Download, Eye, X, MessageSquare } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const JustificatifsValidation = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal pour afficher le justificatif
  const [showModal, setShowModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);

  // Modal pour le commentaire
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentAction, setCommentAction] = useState(null); // 'valider' ou 'rejeter'
  const [commentText, setCommentText] = useState('');
  const [commentAbsenceId, setCommentAbsenceId] = useState(null);

  useEffect(() => {
    fetchAbsencesEnAttente();
  }, []);

  const fetchAbsencesEnAttente = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/absences/non-justifiees`);
      const data = await response.json();
      console.log('Données des absences en attente:', data);
      if (data.success) {
        setAbsences(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement absences:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCommentModal = (absenceId, action) => {
    setCommentAbsenceId(absenceId);
    setCommentAction(action);
    setCommentText('');
    setShowCommentModal(true);
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setCommentAbsenceId(null);
    setCommentAction(null);
    setCommentText('');
  };

  const handleConfirmAction = async () => {
    if (commentAction === 'valider') {
      await handleValider(commentAbsenceId, commentText);
    } else if (commentAction === 'rejeter') {
      await handleRejeter(commentAbsenceId, commentText);
    }
    closeCommentModal();
  };

  const handleValider = async (absenceId, commentaire = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/absences/${absenceId}/valider-justificatif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentaire })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Justificatif validé avec succès !');
        fetchAbsencesEnAttente();
      } else {
        alert('Erreur lors de la validation : ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation du justificatif');
    }
  };

  const handleRejeter = async (absenceId, commentaire = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/absences/${absenceId}/rejeter-justificatif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentaire })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Justificatif rejeté avec succès !');
        fetchAbsencesEnAttente();
      } else {
        alert('Erreur lors du rejet : ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet du justificatif');
    }
  };

  const handleViewJustificatif = (absence) => {
    setSelectedAbsence(absence);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAbsence(null);
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

  // Calculs pagination
  const totalPages = Math.ceil(absences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAbsences = absences.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Validation des Justificatifs</h3>
          <p className="text-sm text-gray-600 mt-1">
            Absences avec justificatif en attente de validation
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Étudiant
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Cours
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date absence
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Horaires
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Salle
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date soumission
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Justificatif
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="text-gray-500">Chargement...</div>
                </td>
              </tr>
            ) : currentAbsences.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="text-gray-300 mb-4" size={64} />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Aucun justificatif en attente
                    </h4>
                    <p className="text-gray-500">
                      Tous les justificatifs ont été traités ou il n'y a pas de nouvelles soumissions
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentAbsences.map((absence) => (
                <tr key={absence.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {absence.etudiant?.prenom} {absence.etudiant?.nom}
                        </div>
                        <div className="text-xs text-gray-500">
                          {absence.etudiant?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {absence.seance?.cours?.nom || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-900">
                        {formatDate(absence.seance?.date_seance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {absence.seance?.heure_debut && absence.seance?.heure_fin
                      ? `${formatTime(absence.seance.heure_debut)} - ${formatTime(absence.seance.heure_fin)}`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {absence.seance?.salle || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatDate(absence.date_soumission_justificatif)}
                  </td>
                  <td className="px-6 py-4">
                    {absence.fichier_justificatif_path ? (
                      <button
                        onClick={() => handleViewJustificatif(absence)}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                      >
                        <Eye size={14} />
                        Voir
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Aucun fichier</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCommentModal(absence.id, 'valider')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                        title="Valider le justificatif"
                      >
                        <CheckCircle size={14} />
                        Valider
                      </button>
                      <button
                        onClick={() => openCommentModal(absence.id, 'rejeter')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                        title="Rejeter le justificatif"
                      >
                        <XCircle size={14} />
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {absences.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(endIndex, absences.length)} sur {absences.length} justificatif{absences.length > 1 ? 's' : ''}
          </div>
          
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
        </div>
      )}

      {/* Modal pour le commentaire */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className={commentAction === 'valider' ? 'text-green-600' : 'text-red-600'} size={20} />
                {commentAction === 'valider' ? 'Valider le justificatif' : 'Rejeter le justificatif'}
              </h4>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire {commentAction === 'rejeter' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  commentAction === 'valider' 
                    ? 'Ajouter un commentaire (optionnel)...' 
                    : 'Veuillez expliquer la raison du rejet...'
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="4"
              />
              {commentAction === 'rejeter' && !commentText && (
                <p className="text-xs text-red-600 mt-1">
                  Le commentaire est obligatoire pour un rejet
                </p>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeCommentModal}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={commentAction === 'rejeter' && !commentText}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  commentAction === 'valider'
                    ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300'
                    : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {commentAction === 'valider' ? (
                  <>
                    <CheckCircle size={16} />
                    Valider
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Rejeter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour afficher le justificatif */}
      {showModal && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  Justificatif d'absence
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAbsence.etudiant?.prenom} {selectedAbsence.etudiant?.nom} - {selectedAbsence.seance?.cours?.nom}
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
              {/* Informations de l'absence */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-gray-900 mb-3">Informations</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Étudiant:</span>
                    <p className="font-medium">
                      {selectedAbsence.etudiant?.prenom} {selectedAbsence.etudiant?.nom}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedAbsence.etudiant?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cours:</span>
                    <p className="font-medium">{selectedAbsence.seance?.cours?.nom}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Salle:</span>
                    <p className="font-medium">{selectedAbsence.seance?.salle || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date d'absence:</span>
                    <p className="font-medium">{formatDate(selectedAbsence.seance?.date_seance)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Horaires:</span>
                    <p className="font-medium">
                      {selectedAbsence.seance?.heure_debut && selectedAbsence.seance?.heure_fin
                        ? `${formatTime(selectedAbsence.seance.heure_debut)} - ${formatTime(selectedAbsence.seance.heure_fin)}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date de soumission:</span>
                    <p className="font-medium">{formatDate(selectedAbsence.date_soumission_justificatif)}</p>
                  </div>
                </div>
              </div>

              {/* Fichier justificatif */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Fichier justificatif</h5>
                {selectedAbsence.fichier_justificatif_path ? (
                  <div className="space-y-3">
                    {/* Prévisualisation si c'est une image */}
                    {selectedAbsence.fichier_justificatif_path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <img
                          src={selectedAbsence.fichier_justificatif_path}
                          alt="Justificatif"
                          className="w-full h-auto max-h-[500px] object-contain"
                        />
                      </div>
                    ) : selectedAbsence.fichier_justificatif_path.match(/\.pdf$/i) ? (
                      <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '500px' }}>
                        <iframe
                          src={selectedAbsence.fichier_justificatif_path}
                          className="w-full h-full"
                          title="Justificatif PDF"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8 border rounded-lg bg-white">
                        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 mb-4">Aperçu non disponible pour ce type de fichier</p>
                      </div>
                    )}
                    
                    <a
                      href={selectedAbsence.fichier_justificatif_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Download size={16} />
                      Télécharger le fichier
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-lg bg-white">
                    <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Aucun fichier disponible</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    closeModal();
                    openCommentModal(selectedAbsence.id, 'rejeter');
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <XCircle size={18} />
                  Rejeter
                </button>
                <button
                  onClick={() => {
                    closeModal();
                    openCommentModal(selectedAbsence.id, 'valider');
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle size={18} />
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JustificatifsValidation;