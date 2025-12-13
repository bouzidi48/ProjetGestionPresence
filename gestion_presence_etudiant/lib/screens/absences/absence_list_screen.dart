import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/absence_api_service.dart';
import 'absence_detail_screen.dart';

class AbsenceListScreen extends StatefulWidget {
  const AbsenceListScreen({super.key});

  @override
  State<AbsenceListScreen> createState() => _AbsenceListScreenState();
}

class _AbsenceListScreenState extends State<AbsenceListScreen> {
  final AbsenceService _absenceService = AbsenceService();
  String _selectedFilter = 'Toutes';
  bool _isLoading = true;
  List<Map<String, dynamic>> _absences = [];

  @override
  void initState() {
    super.initState();
    _loadAbsences();
  }

  Future<void> _loadAbsences() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // ✅ Récupérer l'ID de l'étudiant connecté
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userId = authProvider.user?.id;

      if (userId == null) {
        throw Exception('Utilisateur non connecté');
      }

      // ✅ Charger les absences selon le filtre
      final response = _selectedFilter == 'Toutes'
          ? await _absenceService.getAbsencesEtudiant(userId)
          : await _absenceService.getAbsencesParStatut(
              userId,
              _selectedFilter == 'Non justifiées'
                  ? 'nonjustifier'
                  : _selectedFilter == 'En attente'
                      ? 'en_attente'
                      : 'justifier',
            );

      if (response.success && response.data != null) {
        setState(() {
          _absences = response.data!;
          _isLoading = false;
        });
      } else {
        throw Exception(response.error);
      }
    } catch (e) {
      print('Erreur chargement absences: $e');
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Mes absences'),
        backgroundColor: AppTheme.surfaceColor,
      ),
      body: Column(
        children: [
          // Filtres
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.surfaceColor,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Toutes'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Non justifiées'),
                  const SizedBox(width: 8),
                  _buildFilterChip('En attente'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Justifiées'),
                ],
              ),
            ),
          ),

          // Liste des absences
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _absences.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadAbsences,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _absences.length,
                          itemBuilder: (context, index) {
                            return _buildAbsenceCard(_absences[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = label;
          _loadAbsences(); // ✅ Recharger les absences quand on change de filtre
        });
      },
      backgroundColor: AppTheme.surfaceColor,
      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
      checkmarkColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryColor : const Color(0xFFE5E7EB),
      ),
    );
  }

  Widget _buildAbsenceCard(Map<String, dynamic> absence) {
    // ✅ Parser la date correctement
    DateTime? date;
    String formattedDate = 'Date inconnue';
    
    try {
      if (absence['seance'] != null && absence['seance']['date_seance'] != null) {
        date = DateTime.parse(absence['seance']['date_seance']);
        formattedDate = DateFormat('dd/MM/yyyy').format(date);
      }
    } catch (e) {
      print('Erreur parsing date: $e');
    }

    // ✅ Déterminer le statut
    Color statusColor;
    IconData statusIcon;
    String statusText;

    if (absence['justifiee'] == 1 || absence['justifiee'] == true) {
      statusColor = AppTheme.successColor;
      statusIcon = Icons.check_circle;
      statusText = 'Justifiée';
    } else if (absence['justifiee'] == null) {
      statusColor = AppTheme.warningColor;
      statusIcon = Icons.schedule;
      statusText = 'En attente';
    } else {
      statusColor = AppTheme.errorColor;
      statusIcon = Icons.cancel;
      statusText = 'Non justifiée';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      child: InkWell(
        onTap: () async {
          // ✅ Navigation avec callback pour recharger
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AbsenceDetailScreen(absence: absence),
            ),
          );
          
          // Si un justificatif a été soumis, recharger la liste
          if (result == true) {
            _loadAbsences();
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      absence['seance']?['cours']?['nom'] ?? 'Cours inconnu',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          statusIcon,
                          size: 14,
                          color: statusColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    formattedDate,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${absence['seance']?['heure_debut'] ?? 'N/A'} - ${absence['seance']?['heure_fin'] ?? 'N/A'}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),

              // ✅ Bouton uniquement pour les absences non justifiées
              if (absence['justifiee'] != 1 && 
                  absence['justifiee'] != true && 
                  absence['justifiee'] != null) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AbsenceDetailScreen(absence: absence),
                        ),
                      );
                      
                      if (result == true) {
                        _loadAbsences();
                      }
                    },
                    icon: const Icon(Icons.upload_file, size: 18),
                    label: const Text('Soumettre un justificatif'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 80,
            color: AppTheme.successColor.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'Aucune absence',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _selectedFilter == 'Toutes'
                ? 'Vous n\'avez aucune absence enregistrée'
                : 'Aucune absence dans cette catégorie',
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}