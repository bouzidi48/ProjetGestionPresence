import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, ExternalLink, Loader2, Cloud, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function DocumentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAndMode, setIsAndMode] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [wordCloudData, setWordCloudData] = useState({});
  const [loadingWordCloud, setLoadingWordCloud] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // États pour l'autocomplétion
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fermer les suggestions si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction pour récupérer les suggestions
  const fetchSuggestions = async (term) => {
    if (!term.trim() || term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const response = await fetch(`http://localhost:3001/documents/rechercher/${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setSuggestions(data.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur récupération suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Attendre 300ms après que l'utilisateur arrête de taper

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setExpandedDoc(null);
    setWordCloudData({});
    setCurrentPage(1);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);

    try {
      const endpoint = isAndMode ? 'rechercherAnd' : 'rechercherOr';
      const response = await fetch(`http://localhost:3001/documents/${endpoint}/${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.mot);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    handleSearch(suggestion.mot);
  };

  const handleKeyPress = (e) => {
    // Navigation dans les suggestions avec les flèches
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } else if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const openDocument = (chemin) => {
    window.open(`http://localhost:3001/documents/afficher/${encodeURIComponent(chemin)}`, '_blank');
  };

  const toggleWordCloud = async (e, docId) => {
    e.stopPropagation();
    
    if (expandedDoc === docId) {
      setExpandedDoc(null);
      return;
    }

    setExpandedDoc(docId);

    if (wordCloudData[docId]) {
      return;
    }

    setLoadingWordCloud(prev => ({ ...prev, [docId]: true }));

    try {
      const response = await fetch(`http://localhost:3001/documents/${docId}/nuage-mots`);
      const data = await response.json();
      
      if (data.success) {
        setWordCloudData(prev => ({ ...prev, [docId]: data.data || [] }));
      } else {
        setWordCloudData(prev => ({ ...prev, [docId]: [] }));
      }
    } catch (error) {
      console.error('Erreur récupération nuage de mots:', error);
      setWordCloudData(prev => ({ ...prev, [docId]: [] }));
    } finally {
      setLoadingWordCloud(prev => ({ ...prev, [docId]: false }));
    }
  };

  const getWordSize = (frequence, maxFreq, minFreq) => {
    const minSize = 24;
    const maxSize = 72;
    
    if (maxFreq === minFreq) {
      return (minSize + maxSize) / 2;
    }
    
    const scale = (frequence - minFreq) / (maxFreq - minFreq);
    const logScale = Math.pow(scale, 0.7);
    
    return minSize + (maxSize - minSize) * logScale;
  };

  const getWordColor = (index) => {
    const colors = [
      'text-blue-600',
      'text-red-500',
      'text-purple-600',
      'text-green-600',
      'text-orange-500',
      'text-pink-600',
      'text-indigo-600',
      'text-teal-600',
      'text-rose-600',
      'text-cyan-600',
    ];
    return colors[index % colors.length];
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <strong key={index} className="font-bold text-blue-700">{part}</strong>
      ) : (
        part
      )
    );
  };

  const goToAdmin = () => {
    // Vous pouvez utiliser React Router ou simplement window.location
    window.location.href = '/admin'; // Ou utilisez navigate('/admin') avec React Router
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Bouton Admin fixe en haut à droite */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={goToAdmin}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 font-medium"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          Admin
        </button>
      </div>

      <div className="pt-20 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-2">
            Doc<span className="text-blue-600">Search</span>
          </h1>
          <p className="text-gray-600">Trouvez vos documents instantanément</p>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="relative" ref={searchRef}>
            <div className="flex items-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Search className="absolute left-6 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Rechercher un mot dans les documents..."
                className="w-full py-4 px-14 rounded-full text-lg focus:outline-none"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-14 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
              {loading && (
                <Loader2 className="absolute right-6 text-blue-600 animate-spin" size={20} />
              )}
            </div>

            {/* Suggestions d'autocomplétion */}
            {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
              <div 
                ref={suggestionsRef}
                className="absolute w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
              >
                {loadingSuggestions ? (
                  <div className="p-4 text-center">
                    <Loader2 className="inline-block animate-spin text-blue-600" size={20} />
                    <span className="ml-2 text-gray-600">Chargement...</span>
                  </div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`px-6 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                        index === selectedSuggestionIndex
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Search size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800 flex-grow">
                        {highlightMatch(suggestion.mot, searchTerm)}
                      </span>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transform transition-transform ${
                          index === selectedSuggestionIndex ? 'rotate-[-90deg]' : ''
                        }`}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
            
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                Rechercher
              </button>
              
              <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow">
                <span className={`text-sm font-medium transition-colors ${!isAndMode ? 'text-blue-600' : 'text-gray-500'}`}>
                  OR
                </span>
                <button
                  onClick={() => setIsAndMode(!isAndMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isAndMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAndMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium transition-colors ${isAndMode ? 'text-blue-600' : 'text-gray-500'}`}>
                  AND
                </span>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-3">
              {isAndMode 
                ? "Mode AND : tous les mots doivent être présents" 
                : "Mode OR : au moins un mot doit être présent"}
            </p>
          </div>
        </div>
      </div>

      {hasSearched && (
        <div className="max-w-3xl mx-auto px-4 pb-12">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="inline-block animate-spin text-blue-600" size={48} />
              <p className="mt-4 text-gray-600">Recherche en cours...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="text-sm text-gray-600 mb-4">
                {results.length} résultat{results.length > 1 ? 's' : ''} ({isAndMode ? 'AND' : 'OR'})
              </div>
              <div className="space-y-4">
                {results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((doc, index) => (
                  <div key={doc.id || index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => openDocument(doc.chemin)}
                    >
                      <div className="flex items-start gap-4">
                        <FileText className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl text-blue-600 hover:underline font-medium">
                              {doc.nom}
                            </h3>
                            <ExternalLink size={16} className="text-gray-400" />
                            <button
                              onClick={(e) => toggleWordCloud(e, doc.id)}
                              className="ml-2 p-1 hover:bg-blue-50 rounded-full transition-colors"
                              title={expandedDoc === doc.id ? "Masquer le nuage de mots" : "Voir le nuage de mots"}
                            >
                              {expandedDoc === doc.id ? (
                                <ChevronUp size={18} className="text-blue-600" />
                              ) : (
                                <Cloud size={18} className="text-blue-600" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-green-700 mb-2">
                            {doc.chemin}
                          </p>
                          {doc.description && (
                            <p className="text-gray-700 mb-2">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                            <span>Type: {doc.type}</span>
                            <span>•</span>
                            <span>{doc.nombre_mots_normalise} mots</span>
                            {doc.motsFrequence && doc.motsFrequence.length > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex flex-wrap gap-2">
                                  {doc.motsFrequence.map((motFreq, idx) => (
                                    <span key={idx} className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                      {motFreq.mot} ({motFreq.frequence})
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedDoc === doc.id && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {loadingWordCloud[doc.id] ? (
                          <div className="text-center py-8">
                            <Loader2 className="inline-block animate-spin text-blue-600" size={36} />
                            <p className="mt-3 text-gray-600">Chargement du nuage de mots...</p>
                          </div>
                        ) : wordCloudData[doc.id] && wordCloudData[doc.id].length > 0 ? (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <Cloud size={20} className="text-blue-600" />
                              Nuage de mots
                            </h4>
                            <div className="flex flex-wrap items-center justify-center gap-4 p-8 bg-white rounded-lg min-h-[300px]">
                              {(() => {
                                const frequencies = wordCloudData[doc.id].map(w => w.frequence);
                                const maxFreq = Math.max(...frequencies);
                                const minFreq = Math.min(...frequencies);
                                
                                return wordCloudData[doc.id].map((word, idx) => (
                                  <span
                                    key={idx}
                                    className={`font-bold ${getWordColor(idx)} hover:opacity-70 transition-opacity cursor-pointer`}
                                    style={{
                                      fontSize: `${getWordSize(word.frequence, maxFreq, minFreq)}px`,
                                      lineHeight: '0.5'
                                    }}
                                    title={`${word.mot} (${word.frequence} fois)`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSearchTerm(prev => {
                                        const current = prev.trim();
                                        return current ? `${current} ${word.mot}` : word.mot;
                                      });
                                    }}
                                  >
                                    {word.mot}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Cloud className="inline-block text-gray-300 mb-3" size={48} />
                            <p className="text-gray-600">Aucun mot trouvé pour ce document</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {results.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Précédent
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: Math.ceil(results.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(results.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(results.length / itemsPerPage)}
                    className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText className="inline-block text-gray-300 mb-4" size={64} />
              <p className="text-gray-600 text-lg">
                Aucun document trouvé pour "{searchTerm}"
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Essayez avec un autre mot-clé ou changez le mode de recherche
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}