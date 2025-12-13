import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../services/seance_service.dart';
import '../../providers/auth_provider.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _selectedDate = DateTime.now();
  DateTime _focusedDate = DateTime.now();
  List<Map<String, dynamic>> _seances = [];
  bool _isLoading = true;
  String _viewMode = 'month'; // 'month' ou 'day'

  @override
  void initState() {
    super.initState();
    _loadSeances();
  }

  Future<void> _loadSeances() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final seances = await SeanceService.getAllSeances();
      setState(() {
        _seances = seances;
        _isLoading = false;
      });
    } catch (e) {
      print('Erreur chargement séances: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> _getSeancesForDay(DateTime date) {
    return _seances.where((seance) {
      if (seance['date_seance'] == null) return false;
      try {
        final seanceDate = DateTime.parse(seance['date_seance']);
        return seanceDate.year == date.year &&
               seanceDate.month == date.month &&
               seanceDate.day == date.day;
      } catch (e) {
        return false;
      }
    }).toList();
  }

  List<Map<String, dynamic>> _getSeancesForMonth(DateTime date) {
    return _seances.where((seance) {
      if (seance['date_seance'] == null) return false;
      try {
        final seanceDate = DateTime.parse(seance['date_seance']);
        return seanceDate.year == date.year &&
               seanceDate.month == date.month;
      } catch (e) {
        return false;
      }
    }).toList();
  }

  void _changeMonth(int delta) {
    setState(() {
      _focusedDate = DateTime(
        _focusedDate.year,
        _focusedDate.month + delta,
      );
    });
  }

  bool _isMesCours(Map<String, dynamic> seance) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.user?.id;
    
    // Vérifier si l'étudiant est inscrit à ce cours
    // Pour l'instant, on affiche tous les cours
    return true;
  }

  String _formatTime(String? timeString) {
    if (timeString == null || timeString.isEmpty) return 'N/A';
    try {
      return timeString.substring(0, 5);
    } catch (e) {
      return timeString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Calendrier des cours'),
        backgroundColor: AppTheme.surfaceColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSeances,
          ),
          IconButton(
            icon: Icon(
              _viewMode == 'month' ? Icons.view_day : Icons.calendar_month,
            ),
            onPressed: () {
              setState(() {
                _viewMode = _viewMode == 'month' ? 'day' : 'month';
              });
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Navigation mois
                Container(
                  padding: const EdgeInsets.all(16),
                  color: AppTheme.surfaceColor,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left),
                        onPressed: () => _changeMonth(-1),
                      ),
                      Text(
                        DateFormat('MMMM yyyy').format(_focusedDate),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: () => _changeMonth(1),
                      ),
                    ],
                  ),
                ),

                // Vue calendrier
                Expanded(
                  child: _viewMode == 'month'
                      ? _buildMonthView()
                      : _buildDayView(),
                ),
              ],
            ),
    );
  }

  Widget _buildMonthView() {
    final firstDayOfMonth = DateTime(_focusedDate.year, _focusedDate.month, 1);
    final lastDayOfMonth = DateTime(_focusedDate.year, _focusedDate.month + 1, 0);
    final daysInMonth = lastDayOfMonth.day;
    final firstWeekday = firstDayOfMonth.weekday % 7;

    return SingleChildScrollView(
      child: Column(
        children: [
          // En-têtes des jours
          Container(
            color: Colors.grey[200],
            child: Row(
              children: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
                  .map((day) => Expanded(
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              day,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),

          // Grille du calendrier
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 0.8,
            ),
            itemCount: firstWeekday + daysInMonth,
            itemBuilder: (context, index) {
              if (index < firstWeekday) {
                return Container();
              }

              final day = index - firstWeekday + 1;
              final date = DateTime(_focusedDate.year, _focusedDate.month, day);
              final seancesForDay = _getSeancesForDay(date);
              final isToday = DateTime.now().year == date.year &&
                  DateTime.now().month == date.month &&
                  DateTime.now().day == date.day;
              final isSelected = _selectedDate.year == date.year &&
                  _selectedDate.month == date.month &&
                  _selectedDate.day == date.day;

              return InkWell(
                onTap: () {
                  setState(() {
                    _selectedDate = date;
                    _viewMode = 'day';
                  });
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primaryColor.withOpacity(0.1)
                        : isToday
                            ? Colors.blue[50]
                            : null,
                    border: Border.all(
                      color: Colors.grey[300]!,
                      width: 0.5,
                    ),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$day',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isToday ? Colors.blue : Colors.black87,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Expanded(
                        child: ListView.builder(
                          itemCount: seancesForDay.length > 2 ? 2 : seancesForDay.length,
                          itemBuilder: (context, i) {
                            final seance = seancesForDay[i];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 2),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: _isMesCours(seance)
                                    ? Colors.green[100]
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(
                                seance['cours']?['nom'] ?? 'N/A',
                                style: const TextStyle(fontSize: 8),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          },
                        ),
                      ),
                      if (seancesForDay.length > 2)
                        Text(
                          '+${seancesForDay.length - 2}',
                          style: TextStyle(
                            fontSize: 8,
                            color: Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDayView() {
    final seancesForDay = _getSeancesForDay(_selectedDate);

    return Column(
      children: [
        // En-tête du jour sélectionné
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.primaryColor.withOpacity(0.1),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  setState(() {
                    _viewMode = 'month';
                  });
                },
              ),
              const SizedBox(width: 8),
              Text(
                DateFormat('EEEE dd MMMM yyyy').format(_selectedDate),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),

        // Liste des séances
        Expanded(
          child: seancesForDay.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.event_busy,
                        size: 64,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Aucun cours ce jour',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: seancesForDay.length,
                  itemBuilder: (context, index) {
                    final seance = seancesForDay[index];
                    final presenceEffectuee = seance['presence_effectuee'] == 1 ||
                        seance['presence_effectuee'] == true;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border(
                            left: BorderSide(
                              color: _isMesCours(seance)
                                  ? Colors.green
                                  : Colors.grey,
                              width: 4,
                            ),
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      seance['cours']?['nom'] ?? 'N/A',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (presenceEffectuee)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.green[100],
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.check_circle,
                                            size: 14,
                                            color: Colors.green[700],
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Effectuée',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.green[700],
                                              fontWeight: FontWeight.w600,
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
                                  const Icon(
                                    Icons.access_time,
                                    size: 16,
                                    color: Colors.grey,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${_formatTime(seance['heure_debut'])} - ${_formatTime(seance['heure_fin'])}',
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ],
                              ),
                              if (seance['salle'] != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.location_on,
                                      size: 16,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Salle ${seance['salle']}',
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ],
                                ),
                              ],
                              if (seance['cours']?['professeur'] != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.person,
                                      size: 16,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Prof: ${seance['cours']['professeur']['prenom']} ${seance['cours']['professeur']['nom']}',
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}