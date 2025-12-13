import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, X, UserCheck, Calendar, Clock, ChevronLeft, ChevronRight, Filter, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const PrisePresence = ({ user }) => {
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState(null);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modal caméra
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [identifiedStudent, setIdentifiedStudent] = useState(null);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchMesCours();
  }, []);

  useEffect(() => {
    if (selectedCours) {
      fetchSeancesByCours(selectedCours.id);
    }
  }, [selectedCours]);

  // Nettoyer le stream quand le modal se ferme
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
        const seancesEnAttente = (data.data || []).filter(seance => 
          seance.presence_effectuee === false || seance.presence_effectuee === 0
        );
        setSeances(seancesEnAttente);
      }
    } catch (error) {
      console.error('Erreur chargement séances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = async (seance) => {
    setSelectedSeance(seance);
    setShowCameraModal(true);
    setError('');
    setIdentifiedStudent(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Erreur accès caméra:', err);
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    setError('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Capturer l'image
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Convertir en blob
    canvas.toBlob(async (blob) => {
      try {
        const formData = new FormData();
        formData.append('photo', blob, 'capture.jpg');
        formData.append('seance_id', selectedSeance.id);
        formData.append('cours_id', selectedCours.id);

        const response = await fetch(`${API_BASE_URL}/face-recognition/identify`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          setIdentifiedStudent(data.etudiant);
          setError('');
        } else {
          setError(data.error || 'Aucune correspondance trouvée');
          setIdentifiedStudent(null);
        }
      } catch (err) {
        console.error('Erreur identification:', err);
        setError('Erreur lors de l\'identification');
      } finally {
        setCapturing(false);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleValidatePresence = async () => {
    if (!identifiedStudent) return;

    try {
      const response = await fetch(`${API_BASE_URL}/presences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seance_id: selectedSeance.id,
          etudiant_id: identifiedStudent.id
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Présence enregistrée avec succès !');
        setIdentifiedStudent(null);
        // Réinitialiser pour la prochaine capture
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Erreur validation:', err);
      setError('Erreur lors de la validation');
    }
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
    setSelectedSeance(null);
    setIdentifiedStudent(null);
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.slice(0, 5);
  };

  const totalPages = Math.ceil(seances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSeances = seances.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Prise de Présence</h3>
        
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-gray-600" />
          <select
            value={selectedCours?.id || ''}
            onChange={(e) => {
              const coursSelected = cours.find(c => c.id === parseInt(e.target.value));
              setSelectedCours(coursSelected);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Horaires</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Salle</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : currentSeances.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  Aucune séance en attente de prise de présence
                </td>
              </tr>
            ) : (
              currentSeances.map(seance => (
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
                    <button
                      onClick={() => handleOpenCamera(seance)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Camera size={16} />
                      Prendre présence
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {seances.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, seances.length)} sur {seances.length}
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

      {/* Modal Caméra */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Reconnaissance Faciale</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedSeance?.date_seance)} • {formatTime(selectedSeance?.heure_debut)} - {formatTime(selectedSeance?.heure_fin)}
                  </p>
                </div>
                <button onClick={handleCloseCamera} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-96 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {identifiedStudent && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Étudiant identifié :</h4>
                  <div className="flex items-center gap-3">
                    {identifiedStudent.image ? (
                      <>
                        <img 
                          src={identifiedStudent.image} 
                          alt={`${identifiedStudent.prenom} ${identifiedStudent.nom}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />     
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold border-2 border-green-300">
                        {identifiedStudent.prenom?.charAt(0)}{identifiedStudent.nom?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {identifiedStudent.prenom} {identifiedStudent.nom}
                      </p>
                      <p className="text-sm text-gray-600">{identifiedStudent.email}</p>
                      <p className="text-xs text-green-700 mt-1">
                        Similarité: {identifiedStudent.similarity?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!identifiedStudent ? (
                  <button
                    onClick={captureAndIdentify}
                    disabled={capturing || !stream}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    <Camera size={20} />
                    {capturing ? 'Identification...' : 'Capturer et Identifier'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIdentifiedStudent(null)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Réessayer
                    </button>
                    <button
                      onClick={handleValidatePresence}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Check size={20} />
                      Valider la présence
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrisePresence;