import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText, BarChart3, AlertCircle, ArrowLeft, FolderOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResultsPage() {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            const response = await fetch('http://localhost:3001/documents/');
            const data = await response.json();
            
            if (data.success) {
                setResults(data.resultats);
            }
        } catch (error) {
            console.error('Erreur chargement résultats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (type) => {
        if (type === 'pdf') return '📄';
        if (type === 'txt') return '📝';
        if (type === 'docx' || type === 'doc') return '📃';
        if (type === 'html' || type === 'htm') return '🌐';
        return '📎';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Chargement des résultats...</p>
                </div>
            </div>
        );
    }

    if (!results || results.documentsTraites === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto text-gray-400 mb-4" size={64} />
                    <p className="text-gray-600 text-lg mb-2">Aucun résultat disponible</p>
                    <p className="text-gray-500 text-sm mb-4">Aucun document n'a encore été traité</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Aller à l'importation
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600 rounded-lg">
                                <CheckCircle className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Résultats du Traitement</h1>
                                <p className="text-sm text-gray-600">Détails des documents traités</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                Recherche
                            </button>
                            <button
                                onClick={() => navigate('/admin')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <ArrowLeft size={20} />
                                Admin
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistiques globales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Documents traités</p>
                                <p className="text-2xl font-bold text-gray-800">{results.documentsTraites}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Erreurs</p>
                                <p className="text-2xl font-bold text-gray-800">{results.documentsEnErreur}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Mots totaux</p>
                                <p className="text-2xl font-bold text-gray-800">{results.motsInseres}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BarChart3 className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Relations créées</p>
                                <p className="text-2xl font-bold text-gray-800">{results.relationsCreees}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Détails des documents */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText size={24} />
                            Détails des documents traités ({results.details.length})
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {results.details && results.details.length > 0 ? (
                            results.details.map((detail, index) => (
                                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {detail.erreur ? (
                                            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                                                <XCircle className="text-red-600" size={24} />
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                                                <span className="text-3xl">{getFileIcon(detail.type)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1">
                                            {/* En-tête du document */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <h4 className="font-semibold text-gray-800 text-lg">
                                                    {detail.nom}
                                                </h4>
                                                {detail.id && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                        ID: {detail.id}
                                                    </span>
                                                )}
                                                {detail.type && (
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded uppercase">
                                                        {detail.type}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Chemin du fichier */}
                                            {detail.chemin && (
                                                <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                                                    <FolderOpen className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                                                    <p className="text-xs text-gray-600 break-all font-mono">
                                                        {detail.chemin}
                                                    </p>
                                                </div>
                                            )}

                                            {detail.erreur ? (
                                                <p className="text-red-600 text-sm">{detail.erreur}</p>
                                            ) : detail.stats ? (
                                                <div className="space-y-3">
                                                    {/* Statistiques principales */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                            <p className="text-xs text-blue-600 mb-1 font-medium">Mots bruts</p>
                                                            <p className="text-xl font-bold text-blue-800">
                                                                {detail.stats.nombre_mots_brut}
                                                            </p>
                                                        </div>
                                                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                            <p className="text-xs text-green-600 mb-1 font-medium">Mots normalisés</p>
                                                            <p className="text-xl font-bold text-green-800">
                                                                {detail.stats.nombre_mots_normalise}
                                                            </p>
                                                        </div>
                                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                            <p className="text-xs text-purple-600 mb-1 font-medium">Mots uniques</p>
                                                            <p className="text-xl font-bold text-purple-800">
                                                                {detail.stats.nombre_mots_uniques}
                                                            </p>
                                                        </div>
                                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                                            <p className="text-xs text-red-600 mb-1 font-medium flex items-center gap-1">
                                                                <Trash2 size={12} />
                                                                Mots supprimés
                                                            </p>
                                                            <p className="text-xl font-bold text-red-800">
                                                                {detail.nombre_mots_supprimes || 0}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Barre de progression visuelle */}
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                                            <span>Traitement des mots</span>
                                                            <span className="font-medium">
                                                                {detail.stats.nombre_mots_normalise} / {detail.stats.nombre_mots_brut}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                                                                style={{ 
                                                                    width: `${(detail.stats.nombre_mots_normalise / detail.stats.nombre_mots_brut * 100).toFixed(1)}%` 
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                            <span>Taux de conservation: {((detail.stats.nombre_mots_normalise / detail.stats.nombre_mots_brut) * 100).toFixed(1)}%</span>
                                                            <span>Taux de suppression: {((detail.nombre_mots_supprimes / detail.stats.nombre_mots_brut) * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <AlertCircle className="inline-block text-gray-300 mb-3" size={48} />
                                <p className="text-gray-600">Aucun détail disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bouton pour nouveau traitement */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg"
                    >
                        Importer d'autres documents
                    </button>
                </div>

                {/* Résumé en bas de page */}
                <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Traitement terminé avec succès</h3>
                            <p className="text-sm text-gray-700">
                                {results.documentsTraites} document(s) ont été traités avec succès. 
                                {results.motsInseres > 0 && ` ${results.motsInseres} mots uniques sont présents dans la base de données.`}
                                {results.relationsCreees > 0 && ` ${results.relationsCreees} relations ont été créées entre les documents et les mots.`}
                                {results.documentsEnErreur > 0 && ` Attention : ${results.documentsEnErreur} document(s) ont rencontré des erreurs lors du traitement.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}