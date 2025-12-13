import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_file/open_file.dart';
import '../../config/app_theme.dart';
import '../../services/absence_api_service.dart';

class AbsenceDetailScreen extends StatefulWidget {
  final Map<String, dynamic> absence;

  const AbsenceDetailScreen({
    super.key,
    required this.absence,
  });

  @override
  State<AbsenceDetailScreen> createState() => _AbsenceDetailScreenState();
}

class _AbsenceDetailScreenState extends State<AbsenceDetailScreen> {
  final AbsenceService _absenceService = AbsenceService();
  File? _selectedFile;
  bool _isUploading = false;
  bool _isDownloading = false;

  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (result != null) {
        setState(() {
          _selectedFile = File(result.files.single.path!);
        });
      }
    } catch (e) {
      _showError('Erreur lors de la sélection du fichier: $e');
    }
  }

  Future<void> _submitJustificatif() async {
    if (_selectedFile == null) {
      _showError('Veuillez sélectionner un fichier');
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      final response = await _absenceService.uploadJustificatif(
        widget.absence['id'],
        _selectedFile!.path,
      );

      if (mounted) {
        if (response.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.message ?? 'Justificatif soumis avec succès'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.pop(context, true);
        } else {
          _showError(response.error ?? 'Échec de la soumission du justificatif');
        }
      }
    } catch (e) {
      _showError('Erreur lors de l\'envoi: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  Future<void> _downloadJustificatif() async {
  setState(() {
    _isDownloading = true;
  });

  try {
    final filePath = widget.absence['fichier_justificatif_path'];
    print('📂 Chemin du fichier: $filePath');
    
    if (filePath == null) {
      _showError('Aucun fichier à télécharger');
      return;
    }

    // Télécharger le fichier (SANS demander de permissions)
    final savedPath = await _absenceService.downloadJustificatif(filePath);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Fichier téléchargé: ${savedPath.split('/').last}'),
          backgroundColor: AppTheme.successColor,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'Ouvrir',
            textColor: Colors.white,
            onPressed: () async {
              final result = await OpenFile.open(savedPath);
              print('📱 Résultat ouverture: ${result.message}');
            },
          ),
        ),
      );
    }
  } catch (e) {
    print('❌ Erreur téléchargement: $e');
    _showError('Erreur lors du téléchargement: $e');
  } finally {
    if (mounted) {
      setState(() {
        _isDownloading = false;
      });
    }
  }
}

  void _showError(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.errorColor,
      ),
    );
  }

  String _getStatusText() {
    if (widget.absence['justifiee'] == 1 || widget.absence['justifiee'] == true) {
      return 'Justifiée';
    } else if (widget.absence['justifiee'] == null) {
      return 'En attente de validation';
    } else {
      return 'Non justifiée';
    }
  }

  Color _getStatusColor() {
    if (widget.absence['justifiee'] == 1 || widget.absence['justifiee'] == true) {
      return AppTheme.successColor;
    } else if (widget.absence['justifiee'] == null) {
      return AppTheme.warningColor;
    } else {
      return AppTheme.errorColor;
    }
  }

  IconData _getStatusIcon() {
    if (widget.absence['justifiee'] == 1 || widget.absence['justifiee'] == true) {
      return Icons.check_circle;
    } else if (widget.absence['justifiee'] == null) {
      return Icons.schedule;
    } else {
      return Icons.cancel;
    }
  }

  // ✅ Vérifier si on peut uploader un fichier
  bool _canUploadFile() {
    final justifiee = widget.absence['justifiee'];
    final fichierPath = widget.absence['fichier_justificatif_path'];
    
    // On peut uploader si:
    // 1. justifiee == null && fichier_justificatif_path == null (première soumission)
    // 2. justifiee == null && fichier_justificatif_path != null (remplacement du fichier en attente)
    return justifiee == null;
  }

  // ✅ Vérifier si un fichier existe déjà
  bool _hasExistingFile() {
    return widget.absence['fichier_justificatif_path'] != null;
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();
    final statusIcon = _getStatusIcon();
    final statusText = _getStatusText();

    String formattedDate = 'Date inconnue';
    if (widget.absence['seance'] != null &&
        widget.absence['seance']['date_seance'] != null) {
      try {
        final date = DateTime.parse(widget.absence['seance']['date_seance']);
        formattedDate = DateFormat('dd/MM/yyyy').format(date);
      } catch (e) {
        print('Erreur parsing date: $e');
      }
    }

    // ✅ Formater la date de soumission du justificatif
    String? dateSubmission;
    if (widget.absence['date_soumission_justificatif'] != null) {
      try {
        final date = DateTime.parse(widget.absence['date_soumission_justificatif']);
        dateSubmission = DateFormat('dd/MM/yyyy à HH:mm').format(date);
      } catch (e) {
        print('Erreur parsing date soumission: $e');
      }
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Détails de l\'absence'),
        backgroundColor: AppTheme.surfaceColor,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Carte de statut
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: statusColor.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    statusIcon,
                    size: 60,
                    color: statusColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ],
              ),
            ),

            // Informations de la séance
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Informations',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(
                    Icons.school,
                    'Cours',
                    widget.absence['seance']?['cours']?['nom'] ?? 'N/A',
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    Icons.calendar_today,
                    'Date',
                    formattedDate,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    Icons.access_time,
                    'Horaire',
                    '${widget.absence['seance']?['heure_debut'] ?? 'N/A'} - ${widget.absence['seance']?['heure_fin'] ?? 'N/A'}',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ✅ Section justificatif avec logique complète
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.upload_file,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Justificatif',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ✅ CAS 1: Fichier existe déjà (peu importe le statut de validation)
                  if (_hasExistingFile()) ...[
                    // Afficher la date de soumission
                    if (dateSubmission != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.check_circle_outline,
                              color: AppTheme.primaryColor,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Justificatif soumis le',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                  Text(
                                    dateSubmission,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Bouton de téléchargement
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isDownloading ? null : _downloadJustificatif,
                        icon: _isDownloading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.download),
                        label: Text(
                          _isDownloading
                              ? 'Téléchargement...'
                              : 'Télécharger le justificatif',
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: AppTheme.primaryColor,
                        ),
                      ),
                    ),

                    // ✅ Si justifiee == null, possibilité de remplacer le fichier
                    if (_canUploadFile()) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.warningColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: AppTheme.warningColor,
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Text(
                                'Vous pouvez remplacer le justificatif en attente de validation',
                                style: TextStyle(fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      _buildUploadSection(),
                    ],
                  ]
                  // ✅ CAS 2: Pas de fichier et validation terminée (justifiee == 0 ou 1)
                  else if (!_canUploadFile()) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.block,
                            color: AppTheme.errorColor,
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'L\'absence a été traitée. Vous ne pouvez plus soumettre de justificatif.',
                              style: TextStyle(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ]
                  // ✅ CAS 3: Pas de fichier et justifiee == null (première soumission)
                  else ...[
                    _buildUploadSection(),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ✅ Widget réutilisable pour la section d'upload
  Widget _buildUploadSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Formats acceptés: PDF, JPG, PNG',
          style: TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),

        const SizedBox(height: 16),

        if (_selectedFile != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.insert_drive_file,
                  color: AppTheme.successColor,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedFile!.path.split('/').last,
                    style: const TextStyle(fontSize: 14),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    setState(() {
                      _selectedFile = null;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        OutlinedButton.icon(
          onPressed: _pickFile,
          icon: const Icon(Icons.attach_file),
          label: Text(
            _selectedFile == null
                ? 'Choisir un fichier'
                : 'Changer le fichier',
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            side: const BorderSide(color: AppTheme.primaryColor),
          ),
        ),

        if (_selectedFile != null) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isUploading ? null : _submitJustificatif,
              icon: _isUploading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.white,
                        ),
                      ),
                    )
                  : const Icon(Icons.send),
              label: Text(
                _isUploading
                    ? 'Envoi en cours...'
                    : _hasExistingFile()
                        ? 'Remplacer le justificatif'
                        : 'Soumettre le justificatif',
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppTheme.primaryColor,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}