import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, FileText, Loader2, CheckCircle, XCircle, AlertCircle, File, Trash2, Search, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // États pour les types de fichiers sélectionnés
  const [fileTypes, setFileTypes] = useState({
    txt: true,
    html: true,
    htm: true,
    doc: true,
    docx: true,
    pdf: true
  });

  const handleFileTypeToggle = (type) => {
    setFileTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getAcceptedFormats = () => {
    const formats = [];
    if (fileTypes.txt) formats.push('.txt');
    if (fileTypes.html) formats.push('.html');
    if (fileTypes.htm) formats.push('.htm');
    if (fileTypes.doc) formats.push('.doc');
    if (fileTypes.docx) formats.push('.docx');
    if (fileTypes.pdf) formats.push('.pdf');
    return formats.join(',');
  };

  const isFileTypeAccepted = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return fileTypes[ext] === true;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const acceptedFiles = files.filter(file => isFileTypeAccepted(file.name));
    setSelectedFiles(acceptedFiles);
    setError('');
    
    if (acceptedFiles.length < files.length) {
      setError(`${files.length - acceptedFiles.length} fichier(s) ignoré(s) car leur type n'est pas sélectionné`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const acceptedFiles = files.filter(file => isFileTypeAccepted(file.name));
    setSelectedFiles(acceptedFiles);
    setError('');
    
    if (acceptedFiles.length < files.length) {
      setError(`${files.length - acceptedFiles.length} fichier(s) ignoré(s) car leur type n'est pas sélectionné`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndProcess = async () => {
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    setProcessing(true);
    setError('');
    setUploadProgress({});

    try {
      // Étape 1: Upload des fichiers vers le dossier data
      console.log('📤 Étape 1: Upload des fichiers...');
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'uploading', progress: 0 }
        }));

        const formData = new FormData();
        formData.append('file', file);

        try {
          const uploadResponse = await fetch('http://localhost:3001/documents/upload', {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadResponse.json();

          if (uploadData.success) {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { status: 'uploaded', progress: 100 }
            }));
            console.log(`✅ ${file.name} uploadé`);
          } else {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { status: 'error', progress: 0, error: uploadData.error }
            }));
            console.error(`❌ Erreur upload ${file.name}:`, uploadData.error);
          }
        } catch (err) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'error', progress: 0, error: err.message }
          }));
          console.error(`❌ Erreur upload ${file.name}:`, err);
        }
      }

      // Étape 2: Traiter tous les fichiers du dossier data
      console.log('⚙️ Étape 2: Traitement des fichiers...');
      
      const processResponse = await fetch('http://localhost:3001/documents/traiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const processData = await processResponse.json();
      console.log('Réponse du traitement:', processData);

      if (processData.success) {
        
          
          console.log('✅ Traitement terminé avec succès');
        setSelectedFiles([]);
        setUploadProgress({});
      } else {
        setError(processData.error || 'Erreur lors du traitement');
      }
    } catch (err) {
      console.error('Erreur globale:', err);
      setError('Erreur de connexion au serveur. Vérifiez que le serveur est démarré.');
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'txt') return '📝';
    if (ext === 'docx' || ext === 'doc') return '📃';
    if (ext === 'html' || ext === 'htm') return '🌐';
    return '📎';
  };

  const fileTypeConfig = [
    { key: 'txt', label: 'TXT', color: 'blue', icon: '📝' },
    { key: 'html', label: 'HTML', color: 'purple', icon: '🌐' },
    { key: 'htm', label: 'HTM', color: 'purple', icon: '🌐' },
    { key: 'doc', label: 'DOC', color: 'green', icon: '📃' },
    { key: 'docx', label: 'DOCX', color: 'green', icon: '📃' },
    { key: 'pdf', label: 'PDF', color: 'red', icon: '📄' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Upload className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Panneau d'Administration</h1>
                <p className="text-sm text-gray-600">Importation et traitement de documents</p>
              </div>
            </div>
            
            {/* Boutons de navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md"
              >
                <Search size={20} />
                Rechercher
              </button>
              <button
                onClick={() => navigate('/results')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md"
              >
                <BarChart3 size={20} />
                Résultats
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section de sélection des types de fichiers */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <FileText className="text-purple-600 flex-shrink-0 mt-1" size={28} />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Types de fichiers acceptés
              </h2>
              <p className="text-gray-600">
                Sélectionnez les types de fichiers que vous souhaitez importer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {fileTypeConfig.map(({ key, label, color, icon }) => (
              <button
                key={key}
                onClick={() => handleFileTypeToggle(key)}
                disabled={processing}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  fileTypes[key]
                    ? `border-${color}-500 bg-${color}-50`
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{icon}</span>
                  <span className={`text-sm font-semibold ${
                    fileTypes[key] ? `text-${color}-700` : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                  {fileTypes[key] && (
                    <CheckCircle className={`absolute top-2 right-2 text-${color}-600`} size={16} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {Object.values(fileTypes).filter(Boolean).length} type(s) sélectionné(s)
            </p>
            <button
              onClick={() => {
                const allSelected = Object.values(fileTypes).every(v => v);
                setFileTypes({
                  txt: !allSelected,
                  html: !allSelected,
                  htm: !allSelected,
                  doc: !allSelected,
                  docx: !allSelected,
                  pdf: !allSelected
                });
              }}
              disabled={processing}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {Object.values(fileTypes).every(v => v) ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
        </div>

        {/* Section d'upload */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <Upload className="text-blue-600 flex-shrink-0 mt-1" size={28} />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Importer des Documents
              </h2>
              <p className="text-gray-600">
                Sélectionnez des fichiers ou glissez-les dans la zone ci-dessous
              </p>
            </div>
          </div>

          {Object.values(fileTypes).some(v => v) ? (
            <>
              {/* Zone de drop */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Cliquez pour sélectionner ou glissez des fichiers ici
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Seuls les types sélectionnés ci-dessus seront acceptés
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={getAcceptedFormats()}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Boutons de sélection */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  disabled={processing}
                >
                  <File size={20} />
                  Sélectionner des fichiers
                </button>
                
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  disabled={processing}
                >
                  <FolderOpen size={20} />
                  Sélectionner un dossier
                </button>
                
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <div className="p-12 border-2 border-dashed border-yellow-300 rounded-xl bg-yellow-50 text-center">
              <AlertCircle className="mx-auto text-yellow-600 mb-4" size={48} />
              <p className="text-lg font-medium text-yellow-800 mb-2">
                Aucun type de fichier sélectionné
              </p>
              <p className="text-sm text-yellow-700">
                Veuillez sélectionner au moins un type de fichier ci-dessus pour commencer l'importation
              </p>
            </div>
          )}

          {/* Liste des fichiers sélectionnés */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  Fichiers sélectionnés ({selectedFiles.length})
                </h3>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadProgress({});
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  disabled={processing}
                >
                  Tout supprimer
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{getFileIcon(file.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      {uploadProgress[file.name] && (
                        <div className="flex items-center gap-2">
                          {uploadProgress[file.name].status === 'uploading' && (
                            <Loader2 className="animate-spin text-blue-600" size={18} />
                          )}
                          {uploadProgress[file.name].status === 'uploaded' && (
                            <CheckCircle className="text-green-600" size={18} />
                          )}
                          {uploadProgress[file.name].status === 'error' && (
                            <XCircle className="text-red-600" size={18} />
                          )}
                        </div>
                      )}
                    </div>
                    {!processing && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progression de l'upload */}
          {processing && Object.keys(uploadProgress).length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Progression</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(uploadProgress).map(([filename, progress]) => (
                  <div key={filename} className="flex items-center justify-between">
                    <span className="text-blue-800 truncate flex-1">{filename}</span>
                    <span className="ml-2">
                      {progress.status === 'uploading' && '⏳ Upload...'}
                      {progress.status === 'uploaded' && '✅ Uploadé'}
                      {progress.status === 'error' && '❌ Erreur'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton de traitement */}
          {selectedFiles.length > 0 && !processing && (
            <div className="mt-6">
              <button
                onClick={handleUploadAndProcess}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-lg shadow-lg"
              >
                <Upload size={24} />
                Uploader et Traiter {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Erreur</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Indicateur de traitement */}
          {processing && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-blue-800 font-medium">Traitement en cours</p>
                <p className="text-blue-700 text-sm mt-1">
                  Upload des fichiers puis traitement et insertion dans la base de données...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Guide d'utilisation */}
        {!processing && selectedFiles.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Guide d'utilisation</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>Sélectionnez les types de fichiers que vous souhaitez importer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>Cliquez sur "Sélectionner des fichiers" ou "Sélectionner un dossier"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>Ou glissez-déposez vos fichiers dans la zone de drop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>Vérifiez la liste des fichiers sélectionnés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    <span>Cliquez sur "Uploader et Traiter" et attendez les résultats</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>📁 Dossier de destination:</strong> Les fichiers seront stockés dans le dossier <code className="bg-green-100 px-1 rounded">data</code> du serveur avant traitement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}