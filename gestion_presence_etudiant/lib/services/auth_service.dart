import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';  // ← AJOUTER
import '../config/api_config.dart';
import '../models/api_response.dart';

class AuthService {
  // Connexion
  Future<ApiResponse<AuthResponse>> login(String email, String password) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.login}');
      
      final response = await http.post(
        url,
        headers: ApiConfig.getHeaders(),
        body: json.encode({
          'email': email,
          'password': password,
        }),
      ).timeout(ApiConfig.connectTimeout);

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse.success(
          AuthResponse.fromJson(data),
          message: data['message'],
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Identifiants incorrects',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } catch (e) {
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  // Inscription avec photo
  Future<ApiResponse<int>> register({
    required String nom,
    required String prenom,
    required String email,
    required String password,
    required String photoPath,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.register}');
      
      print('🔗 URL: $url');
      print('📸 Photo path: $photoPath');
      
      // ✅ Vérifier que le fichier existe
      final file = File(photoPath);
      if (!await file.exists()) {
        throw Exception('Le fichier photo n\'existe pas: $photoPath');
      }
      
      final fileSize = await file.length();
      print('📦 Taille du fichier: $fileSize bytes');
      
      if (fileSize == 0) {
        throw Exception('Le fichier photo est vide');
      }
      
      // Créer une requête multipart
      var request = http.MultipartRequest('POST', url);
      
      // ✅ Ajouter les champs texte AVANT le fichier
      request.fields['nom'] = nom;
      request.fields['prenom'] = prenom;
      request.fields['email'] = email;
      request.fields['password'] = password;
      request.fields['role'] = 'etudiant';
      
      print('📝 Champs envoyés:');
      print('   nom: $nom');
      print('   prenom: $prenom');
      print('   email: $email');
      print('   role: etudiant');
      
      // ✅ Ajouter la photo avec le bon content type
      var photo = http.MultipartFile.fromBytes(
        'photo',
        await file.readAsBytes(),
        filename: 'photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
        contentType: MediaType('image', 'jpeg'),
      );
      
      request.files.add(photo);
      
      print('📸 Photo ajoutée:');
      print('   Nom: ${photo.filename}');
      print('   Taille: ${photo.length} bytes');
      print('   Type: ${photo.contentType}');
      
      print('📤 Envoi de la requête...');
      
      // Envoyer la requête avec timeout
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('Délai d\'attente dépassé');
        },
      );
      
      // Convertir en Response
      var response = await http.Response.fromStream(streamedResponse);
      
      print('📥 Réponse reçue:');
      print('   Status: ${response.statusCode}');
      print('   Body: ${response.body}');
      
      // Parser la réponse
      final data = json.decode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        print('✅ Inscription réussie !');
        print('id : '+data['id'].toString());
        return ApiResponse.success(
          data['id'] as int,  // ← Change ici - retourne directement l'ID
          message: data['message'] ?? 'Inscription réussie',
        );
      } else {
        print('❌ Erreur serveur: ${data['error']}');
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de l\'inscription',
        );
      }
    } on SocketException catch (e) {
      print('❌ Erreur réseau: $e');
      return ApiResponse.error('Pas de connexion internet');
    } on TimeoutException catch (e) {
      print('❌ Timeout: $e');
      return ApiResponse.error('Délai d\'attente dépassé');
    } catch (e, stackTrace) {
      print('❌ Erreur inattendue: $e');
      print('Stack trace: $stackTrace');
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  
}