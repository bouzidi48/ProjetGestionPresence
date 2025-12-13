// lib/services/user_service.dart

import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config/api_config.dart';
import '../models/api_response.dart';
import '../models/user_model.dart';

class UserService {
  
  Future<ApiResponse<void>> changePassword({
    required int userId,
    required String currentPassword,
    required String newPassword,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId/change-password');
      
      print('🔐 Changement mot de passe pour user $userId');
      
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await http.put(
        url,
        headers: headers,
        body: json.encode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      ).timeout(const Duration(seconds: 30));

      print('📥 Response: ${response.statusCode}');
      
      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse.success(
          null,
          message: data['message'] ?? 'Mot de passe modifié',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors du changement de mot de passe',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } on TimeoutException {
      return ApiResponse.error('Délai d\'attente dépassé');
    } catch (e) {
      print('❌ Erreur: $e');
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  
  Future<ApiResponse<UserModel>> updatePhoto({
    required int userId,
    required String photoPath,
    String? token,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId/update-photo');
      
      print('📸 Mise à jour photo pour user $userId');
      print('   Path: $photoPath');

      // Vérifier que le fichier existe
      final file = File(photoPath);
      if (!await file.exists()) {
        throw Exception('Le fichier photo n\'existe pas');
      }

      final fileSize = await file.length();
      print('   Taille: $fileSize bytes');

      if (fileSize == 0) {
        throw Exception('Le fichier photo est vide');
      }

      // Créer la requête multipart
      var request = http.MultipartRequest('PUT', url);

      // Ajouter le token si disponible
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Ajouter la photo
      var photo = http.MultipartFile.fromBytes(
        'photo',
        await file.readAsBytes(),
        filename: 'photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
        contentType: MediaType('image', 'jpeg'),
      );
      request.files.add(photo);

      print('📤 Envoi...');

      // Envoyer
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
      );
      var response = await http.Response.fromStream(streamedResponse);

      print('📥 Response: ${response.statusCode}');
      
      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final updatedUser = UserModel.fromJson(data['user']);
        return ApiResponse.success(
          updatedUser,
          message: data['message'] ?? 'Photo mise à jour',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de la mise à jour',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } on TimeoutException {
      return ApiResponse.error('Délai d\'attente dépassé');
    } catch (e) {
      print('❌ Erreur: $e');
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  
  Future<ApiResponse<UserModel>> getUserById(int userId, {String? token}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/users/$userId');
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await http.get(url, headers: headers)
          .timeout(const Duration(seconds: 30));

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse.success(
          UserModel.fromJson(data['data']),
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur de récupération',
        );
      }
    } catch (e) {
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }
}