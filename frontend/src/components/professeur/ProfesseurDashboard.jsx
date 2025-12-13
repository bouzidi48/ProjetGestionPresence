import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/presences';

const ProfesseurDashboard = ({ user }) => {
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' ou 'day'
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Modal pour ajouter/modifier une séance
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' ou 'edit'
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [cours, setCours] = useState([]);
  
  // Tooltip
  const [hoveredSeance, setHoveredSeance] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Form data
  const [formData, setFormData] = useState({
    cours_id: '',
    date_seance: '',
    heure_debut: '',
    heure_fin: '',
    salle: ''
  });

  useEffect(() => {
    fetchSeances();
    fetchMesCours();
  }, [currentDate]);

  const fetchSeances = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/seances`);
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

  const fetchMesCours = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cours/professeur/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setCours(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    }
  };

  const handleMarquerPresence = async (seanceId, coursId, event) => {
    event.stopPropagation();
    
    if (!confirm('Êtes-vous sûr de vouloir marquer cette séance comme présence effectuée ?')) return;

    try {
      // ✅ D'abord, charger les étudiants du cours
      const etudiantsResponse = await fetch(`${API_BASE_URL}/cours/${coursId}/etudiants`);
      const etudiantsData = await etudiantsResponse.json();
      
      if (!etudiantsData.success) {
        alert('Erreur lors du chargement des étudiants');
        return;
      }

      const etudiants = etudiantsData.data || [];

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
        fetchSeances();
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
      cours_id: '',
      date_seance: '',
      heure_debut: '',
      heure_fin: '',
      salle: ''
    });
    setShowModal(true);
  };

  const handleEditSeance = (seance, event) => {
    if (event) event.stopPropagation();
    
    setModalMode('edit');
    setSelectedSeance(seance);
    let dateFormatted = '';
    if (seance.date_seance) {
      const date = new Date(seance.date_seance);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateFormatted = `${year}-${month}-${day}`;
    }
    setFormData({
      cours_id: seance.cours_id,
      date_seance: dateFormatted,
      heure_debut: seance.heure_debut,
      heure_fin: seance.heure_fin,
      salle: seance.salle || ''
    });
    setShowModal(true);
  };

  const handleDeleteSeance = async (seanceId, event) => {
    if (event) event.stopPropagation();
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/seances/${seanceId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        alert('Séance supprimée avec succès');
        fetchSeances();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async () => {
    if (!formData.cours_id || !formData.date_seance || !formData.heure_debut || !formData.heure_fin) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

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
        alert(modalMode === 'add' ? 'Séance ajoutée avec succès' : 'Séance modifiée avec succès');
        setShowModal(false);
        fetchSeances();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const getSeancesForMonth = () => {
    return seances.filter(seance => {
      const seanceDate = new Date(seance.date_seance);
      return seanceDate.getMonth() === currentDate.getMonth() &&
             seanceDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getSeancesForDay = (date) => {
    if (!date) return [];
    return getSeancesForMonth().filter(seance => {
      const seanceDate = new Date(seance.date_seance);
      return seanceDate.getDate() === date.getDate();
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setView('day');
  };

  const handleBackToMonth = () => {
    setView('month');
    setSelectedDay(null);
  };

  const handleMouseEnterSeance = (seance, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setHoveredSeance(seance);
  };

  const handleMouseLeaveSeance = () => {
    setHoveredSeance(null);
  };

  const generateHourSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const getSeancesForHour = (hour) => {
    if (!selectedDay) return [];
    return getSeancesForDay(selectedDay).filter(seance => {
      const heureDebut = parseInt(seance.heure_debut.split(':')[0]);
      const heureFin = parseInt(seance.heure_fin.split(':')[0]);
      const minuteFin = parseInt(seance.heure_fin.split(':')[1]);
      
      if (minuteFin >= 0) {
        return hour >= heureDebut && hour <= heureFin;
      }
      return hour >= heureDebut && hour <= heureFin;
    });
  };

  const calculateSeanceHeight = (seance) => {
    const [heureDebut, minuteDebut] = seance.heure_debut.split(':').map(Number);
    const [heureFin, minuteFin] = seance.heure_fin.split(':').map(Number);
    return (60 / 60) * 80 * (heureFin - heureDebut + 1);
  };

  const calculateSeanceTop = (seance) => {
    const [heureDebut, minuteDebut] = seance.heure_debut.split(':').map(Number);
    const minutesFromHourStart = minuteDebut;
    return (minutesFromHourStart / 60) * 80;
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* En-tête avec navigation */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === 'day' && (
              <button
                onClick={handleBackToMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {view === 'month' && (
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="text-2xl font-bold">
              {view === 'month' 
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : selectedDay && `${dayNames[selectedDay.getDay()]} ${selectedDay.getDate()} ${monthNames[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`
              }
            </h3>
            {view === 'month' && (
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          <button
            onClick={handleAddSeance}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={20} />
            Ajouter une séance
          </button>
        </div>
      </div>

      {/* Vue Calendrier Mensuel */}
      {view === 'month' && (
        <>
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Chargement du calendrier...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-100 border-b">
                {dayNames.map(day => (
                  <div key={day} className="p-4 text-center font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-y">
                {generateCalendarDays().map((date, index) => {
                  const daySeances = date ? getSeancesForDay(date) : [];
                  const isToday = date && date.toDateString() === new Date().toDateString();
                  const isMesCours = (seance) => seance.cours?.professeur_id === user.id;

                  return (
                    <div
                      key={index}
                      onClick={() => date && handleDayClick(date)}
                      className={`min-h-[120px] p-2 ${!date ? 'bg-gray-50' : 'cursor-pointer hover:bg-gray-50'} ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                            {date.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {daySeances.slice(0, 3).map(seance => {
                              const presenceEffectuee = seance.presence_effectuee === 1 || seance.presence_effectuee === true;
                              
                              return (
                                <div
                                  key={seance.id}
                                  className={`text-xs p-1.5 rounded relative ${
                                    isMesCours(seance) 
                                      ? 'bg-green-100 border-l-2 border-green-500' 
                                      : 'bg-gray-100 border-l-2 border-gray-400'
                                  }`}
                                >
                                  <div className="font-semibold truncate flex items-center justify-between">
                                    <span>{seance.cours?.nom || 'N/A'}</span>
                                    {presenceEffectuee && (
                                      <CheckCircle size={12} className="text-green-600" />
                                    )}
                                  </div>
                                  <div className="text-gray-600">
                                    {formatTime(seance.heure_debut)} - {formatTime(seance.heure_fin)}
                                  </div>
                                </div>
                              );
                            })}
                            {daySeances.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{daySeances.length - 3} autres
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-l-2 border-green-500"></div>
              <span>Mes cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-l-2 border-gray-400"></div>
              <span>Autres cours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span>Présence effectuée</span>
            </div>
          </div>
        </>
      )}

      {/* Vue Journalière */}
      {view === 'day' && selectedDay && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {generateHourSlots().map(hour => {
              const hourSeances = getSeancesForHour(hour);
              const isMesCours = (seance) => seance.cours?.professeur_id === user.id;

              return (
                <div key={hour} className="flex border-b">
                  <div className="w-20 flex-shrink-0 p-4 bg-gray-50 text-sm font-medium text-gray-600 border-r">
                    {hour}:00
                  </div>

                  <div className="flex-1 relative" style={{ minHeight: '80px' }}>
                    {hourSeances.map(seance => {
                      const isStartHour = parseInt(seance.heure_debut.split(':')[0]) === hour;
                      const presenceEffectuee = seance.presence_effectuee === 1 || seance.presence_effectuee === true;
                      
                      return isStartHour && (
                        <div
                          key={seance.id}
                          onMouseEnter={(e) => handleMouseEnterSeance(seance, e)}
                          onMouseLeave={handleMouseLeaveSeance}
                          className={`absolute left-2 right-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
                            isMesCours(seance)
                              ? 'bg-green-100 border-l-4 border-green-500'
                              : 'bg-gray-100 border-l-4 border-gray-400'
                          }`}
                          style={{
                            top: `${calculateSeanceTop(seance)}px`,
                            height: `${calculateSeanceHeight(seance)}px`,
                            zIndex: 10
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm">
                              {seance.cours?.nom || 'N/A'}
                            </div>
                            {presenceEffectuee && (
                              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                <CheckCircle size={14} />
                                <span>Effectuée</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <Users size={14} />
                            <span>Prof: {seance.cours?.professeur?.nom || 'N/A'} {seance.cours?.professeur?.prenom || 'N/A'}</span>
                          </div>
                          
                          <div className="text-xs text-gray-600 mt-1">
                            {formatTime(seance.heure_debut)} - {formatTime(seance.heure_fin)}
                          </div>
                          
                          {seance.salle && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                              <MapPin size={12} />
                              {seance.salle}
                            </div>
                          )}
                          
                          {isMesCours(seance) && (
                            <div className="flex gap-2 mt-2">
                              {!presenceEffectuee && (
                                <button
                                  onClick={(e) => handleMarquerPresence(seance.id, seance.cours_id, e)}
                                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center gap-1"
                                  title="Marquer présence"
                                >
                                  <CheckCircle size={14} />
                                  <span className="text-xs">Marquer</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleEditSeance(seance, e)}
                                className="p-1 bg-white rounded hover:bg-blue-200 transition"
                                title="Modifier"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteSeance(seance.id, e)}
                                className="p-1 bg-white rounded hover:bg-red-200 transition"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Ajouter/Modifier Séance */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Ajouter une séance' : 'Modifier la séance'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cours *
                </label>
                <select
                  value={formData.cours_id}
                  onChange={(e) => setFormData({...formData, cours_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionnez un cours</option>
                  {cours.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date_seance}
                  onChange={(e) => setFormData({...formData, date_seance: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure début *
                  </label>
                  <input
                    type="time"
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure fin *
                  </label>
                  <input
                    type="time"
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salle
                </label>
                <input
                  type="text"
                  value={formData.salle}
                  onChange={(e) => setFormData({...formData, salle: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: A101"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {modalMode === 'add' ? 'Ajouter' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredSeance && (
        <div
          className="fixed z-[100] bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-sm"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none'
          }}
        >
          <div className="space-y-2">
            <div className="font-bold text-lg border-b border-gray-700 pb-2 flex items-center justify-between">
              <span>{hoveredSeance.cours?.nom || 'N/A'}</span>
              {(hoveredSeance.presence_effectuee === 1 || hoveredSeance.presence_effectuee === true) && (
                <CheckCircle size={16} className="text-green-400" />
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} />
              <span>{formatTime(hoveredSeance.heure_debut)} - {formatTime(hoveredSeance.heure_fin)}</span>
            </div>
            
            {hoveredSeance.salle && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} />
                <span>Salle {hoveredSeance.salle}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} />
              <span>Prof: {hoveredSeance.cours?.professeur?.nom || 'N/A'} {hoveredSeance.cours?.professeur?.prenom || 'N/A'}</span>
            </div>
            
            {hoveredSeance.cours?.code && (
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
                Code: {hoveredSeance.cours.code}
              </div>
            )}
            
            {(hoveredSeance.presence_effectuee === 1 || hoveredSeance.presence_effectuee === true) && (
              <div className="text-xs text-green-400 pt-2 border-t border-gray-700">
                ✓ Présence effectuée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfesseurDashboard;