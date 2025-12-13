import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const InscriptionsManagement = () => {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchInscriptions();
  }, []);

  const fetchInscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inscriptions/statut/en_attente`);
      const data = await response.json();
      if (data.success) {
        setInscriptions(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement inscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (inscription) => {
    if (!window.confirm(`Voulez-vous vraiment valider l'inscription de ${inscription.etudiant.prenom} ${inscription.etudiant.nom} ?`)) {
      return;
    }

    setActionLoading(inscription.id);
    try {
      // Valider l'inscription
      const response = await fetch(`${API_BASE_URL}/inscriptions/${inscription.id}/valider`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        // Activer l'utilisateur
        const activateResponse = await fetch(`${API_BASE_URL}/users/${inscription.etudiant_id}/activate`, {
          method: 'PUT'
        });
        const activateData = await activateResponse.json();

        if (activateData.success) {
          alert('Inscription validée et étudiant activé avec succès !');
          fetchInscriptions(); // Recharger la liste
        } else {
          alert('Inscription validée mais erreur lors de l\'activation de l\'étudiant');
        }
      } else {
        alert('Erreur lors de la validation de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejeter = async (inscription) => {
    if (!window.confirm(`Voulez-vous vraiment rejeter l'inscription de ${inscription.etudiant.prenom} ${inscription.etudiant.nom} ?`)) {
      return;
    }

    setActionLoading(inscription.id);
    try {
      const response = await fetch(`${API_BASE_URL}/inscriptions/${inscription.id}/rejeter`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        alert('Inscription rejetée avec succès');
        fetchInscriptions(); // Recharger la liste
      } else {
        alert('Erreur lors du rejet de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculs pagination
  const totalPages = Math.ceil(inscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInscriptions = inscriptions.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement des inscriptions...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Inscriptions en Attente</h3>
          <p className="text-sm text-gray-600 mt-1">
            Validez ou rejetez les demandes d'inscription
          </p>
        </div>
        {inscriptions.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
            <AlertCircle size={20} />
            <span className="font-semibold">{inscriptions.length}</span>
            <span>en attente</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Étudiant</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Master</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date demande</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInscriptions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={48} className="text-gray-300" />
                    <p className="text-lg">Aucune inscription en attente</p>
                    <p className="text-sm">Toutes les demandes ont été traitées</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentInscriptions.map(inscription => (
                <tr key={inscription.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium">
                      {inscription.etudiant?.prenom} {inscription.etudiant?.nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {inscription.etudiant?.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{inscription.master?.nom}</span>
                      <span className="text-xs text-gray-500">{inscription.master?.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(inscription.date_inscription)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValider(inscription)}
                        disabled={actionLoading === inscription.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded transition ${
                          actionLoading === inscription.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title="Valider l'inscription"
                      >
                        <CheckCircle size={16} />
                        {actionLoading === inscription.id ? 'En cours...' : 'Valider'}
                      </button>
                      <button
                        onClick={() => handleRejeter(inscription)}
                        disabled={actionLoading === inscription.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded transition ${
                          actionLoading === inscription.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title="Rejeter l'inscription"
                      >
                        <XCircle size={16} />
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
      {inscriptions.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(endIndex, inscriptions.length)} sur {inscriptions.length} inscription{inscriptions.length > 1 ? 's' : ''}
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
    </div>
  );
};

export default InscriptionsManagement;