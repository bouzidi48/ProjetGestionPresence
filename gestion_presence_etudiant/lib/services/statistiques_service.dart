import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../services/storage_service.dart';

class StatistiquesService {
  final StorageService _storageService = StorageService();

  // Récupérer les statistiques d'un étudiant
  Future<Map<String, dynamic>> getStatistiques(int etudiantId) async {
    try {
      final token = await _storageService.getToken();
      
      if (token == null) {
        throw Exception('Token non trouvé');
      }

      // Récupérer les présences
      final presencesUrl = Uri.parse(
        '${ApiConfig.baseUrl}/presences/etudiant/$etudiantId'
      );
      
      final presencesResponse = await http.get(
        presencesUrl,
        headers: ApiConfig.getHeaders(token: token),
      );

      // Récupérer les absences justifiées
      final justifieesUrl = Uri.parse(
        '${ApiConfig.baseUrl}/absences/etudiant/$etudiantId/justifier'
      );
      
      final justifieesResponse = await http.get(
        justifieesUrl,
        headers: ApiConfig.getHeaders(token: token),
      );

      // Récupérer les absences non justifiées
      final nonJustifieesUrl = Uri.parse(
        '${ApiConfig.baseUrl}/absences/etudiant/$etudiantId/nonjustifier'
      );
      
      final nonJustifieesResponse = await http.get(
        nonJustifieesUrl,
        headers: ApiConfig.getHeaders(token: token),
      );

      // Récupérer les absences en attente
      final enAttenteUrl = Uri.parse(
        '${ApiConfig.baseUrl}/absences/etudiant/$etudiantId/en_attente'
      );
      
      final enAttenteResponse = await http.get(
        enAttenteUrl,
        headers: ApiConfig.getHeaders(token: token),
      );

      // Parser les réponses
      int presences = 0;
      int absences = 0;
      int justifiees = 0;
      int enAttente = 0;

      if (presencesResponse.statusCode == 200) {
        final presencesData = json.decode(presencesResponse.body);
        if (presencesData['success'] == true && presencesData['data'] != null) {
          presences = (presencesData['data'] as List).length;
        }
      }

      if (justifieesResponse.statusCode == 200) {
        final justifieesData = json.decode(justifieesResponse.body);
        if (justifieesData['success'] == true && justifieesData['data'] != null) {
          justifiees = (justifieesData['data'] as List).length;
        }
      }

      if (nonJustifieesResponse.statusCode == 200) {
        final nonJustifieesData = json.decode(nonJustifieesResponse.body);
        if (nonJustifieesData['success'] == true && nonJustifieesData['data'] != null) {
          absences = (nonJustifieesData['data'] as List).length;
        }
      }

      if (enAttenteResponse.statusCode == 200) {
        final enAttenteData = json.decode(enAttenteResponse.body);
        if (enAttenteData['success'] == true && enAttenteData['data'] != null) {
          enAttente = (enAttenteData['data'] as List).length;
        }
      }
      

      print('presences: $presences');
    print('absences: $absences');
    print('justifiees: $justifiees');
    print('enAttente: $enAttente');

      return {
        'presences': presences,
        'absences': absences,
        'justifiees': justifiees,
        'enAttente': enAttente,
      };
    } catch (e) {
      print('Erreur récupération statistiques: $e');
      return {
        'presences': 0,
        'absences': 0,
        'justifiees': 0,
        'enAttente': 0,
      };
    }
  }
}