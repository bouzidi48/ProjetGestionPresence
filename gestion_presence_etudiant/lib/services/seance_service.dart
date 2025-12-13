import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class SeanceService {
  static Future<List<Map<String, dynamic>>> getAllSeances() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/seances'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          return List<Map<String, dynamic>>.from(data['data']);
        }
      }
      throw Exception('Erreur lors de la récupération des séances');
    } catch (e) {
      print('Erreur API getAllSeances: $e');
      rethrow;
    }
  }

  static Future<List<Map<String, dynamic>>> getSeancesByCours(int coursId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/seances/cours/$coursId'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          return List<Map<String, dynamic>>.from(data['data']);
        }
      }
      return [];
    } catch (e) {
      print('Erreur API getSeancesByCours: $e');
      return [];
    }
  }
}