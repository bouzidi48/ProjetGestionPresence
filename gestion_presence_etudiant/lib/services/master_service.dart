import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/master_model.dart';
import '../models/api_response.dart';

class MasterService {
  // Récupérer tous les masters
  Future<ApiResponse<List<Master>>> getAllMasters() async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/masters');
      
      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(),
      ).timeout(ApiConfig.connectTimeout);

      final data = json.decode(response.body);
      print('statut'+data.toString());
      print('data'+data['data'].toString());

      if (response.statusCode == 200 && data['success'] == true) {
        List<Master> masters = (data['data'] as List)
            .map((item) => Master.fromJson(item))
            .toList();
        print('1');
        print(masters.toString());

        return ApiResponse.success(
          masters,
          message: 'Masters récupérés avec succès',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de la récupération des masters',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } catch (e) {
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  // Créer une inscription à un master
  Future<ApiResponse<int>> createInscription({
    required int etudiantId,
    required int masterId,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/inscriptions');
      
      final response = await http.post(
        url,
        headers: ApiConfig.getHeaders(),
        body: json.encode({
          'etudiant_id': etudiantId,
          'master_id': masterId,
          'statut': 'en_attente',
        }),
      ).timeout(ApiConfig.connectTimeout);

      final data = json.decode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        return ApiResponse.success(
          data['id'],
          message: data['message'] ?? 'Inscription créée avec succès',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de l\'inscription',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } catch (e) {
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }
}