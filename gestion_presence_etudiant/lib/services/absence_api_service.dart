import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../config/api_config.dart';
import '../models/api_response.dart';
import 'storage_service.dart';

class AbsenceService {
  final StorageService _storageService = StorageService();
  final Dio _dio = Dio();

  // Récupérer toutes les absences d'un étudiant
  Future<ApiResponse<List<Map<String, dynamic>>>> getAbsencesEtudiant(
    int etudiantId,
  ) async {
    try {
      final token = await _storageService.getToken();
      
      if (token == null) {
        return ApiResponse.error('Token non trouvé');
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/absences/etudiant/$etudiantId',
      );

      print('🔗 Récupération absences: $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(token: token),
      ).timeout(ApiConfig.connectTimeout);

      print('📥 Status: ${response.statusCode}');
      print('📥 Body: ${response.body}');

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final absences = List<Map<String, dynamic>>.from(data['data']);
        return ApiResponse.success(
          absences,
          message: 'Absences récupérées avec succès',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de la récupération des absences',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } on TimeoutException {
      return ApiResponse.error('Délai d\'attente dépassé');
    } catch (e) {
      print('❌ Erreur getAbsencesEtudiant: $e');
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  // Récupérer les absences par statut
  Future<ApiResponse<List<Map<String, dynamic>>>> getAbsencesParStatut(
    int etudiantId,
    String statut, // 'justifier', 'nonjustifier', 'en_attente'
  ) async {
    try {
      final token = await _storageService.getToken();
      
      if (token == null) {
        return ApiResponse.error('Token non trouvé');
      }

      String endpoint;
      switch (statut) {
        case 'justifier':
          endpoint = '/absences/etudiant/$etudiantId/justifier';
          break;
        case 'nonjustifier':
          endpoint = '/absences/etudiant/$etudiantId/nonjustifier';
          break;
        case 'en_attente':
          endpoint = '/absences/etudiant/$etudiantId/en_attente';
          break;
        default:
          return ApiResponse.error('Statut invalide: $statut');
      }

      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');

      print('🔗 Récupération absences ($statut): $url');

      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(token: token),
      ).timeout(ApiConfig.connectTimeout);

      print('📥 Status: ${response.statusCode}');

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final absences = List<Map<String, dynamic>>.from(data['data']);
        return ApiResponse.success(
          absences,
          message: 'Absences récupérées avec succès',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de la récupération des absences',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } on TimeoutException {
      return ApiResponse.error('Délai d\'attente dépassé');
    } catch (e) {
      print('❌ Erreur getAbsencesParStatut: $e');
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }

  // Upload d'un justificatif
  Future<ApiResponse<bool>> uploadJustificatif(
    int absenceId,
    String filePath,
  ) async {
    try {
      final token = await _storageService.getToken();
      
      if (token == null) {
        return ApiResponse.error('Token non trouvé');
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/absences/$absenceId/upload-justificatif',
      );

      print('🔗 URL: $url');
      print('📎 Fichier: $filePath');

      // ✅ Vérifier que le fichier existe
      final file = File(filePath);
      if (!await file.exists()) {
        return ApiResponse.error('Le fichier n\'existe pas: $filePath');
      }

      final fileSize = await file.length();
      print('📦 Taille du fichier: $fileSize bytes');

      if (fileSize == 0) {
        return ApiResponse.error('Le fichier est vide');
      }

      // Créer une requête multipart
      var request = http.MultipartRequest('POST', url);

      // ✅ Ajouter le token dans les headers
      request.headers.addAll(ApiConfig.getHeaders(token: token));

      // ✅ Déterminer le type de fichier
      String extension = filePath.split('.').last.toLowerCase();
      MediaType contentType;
      
      switch (extension) {
        case 'pdf':
          contentType = MediaType('application', 'pdf');
          break;
        case 'jpg':
        case 'jpeg':
          contentType = MediaType('image', 'jpeg');
          break;
        case 'png':
          contentType = MediaType('image', 'png');
          break;
        default:
          contentType = MediaType('application', 'octet-stream');
      }

      // ✅ Ajouter le fichier
      var justificatif = http.MultipartFile.fromBytes(
        'justificatif',
        await file.readAsBytes(),
        filename: 'justificatif_${DateTime.now().millisecondsSinceEpoch}.$extension',
        contentType: contentType,
      );

      request.files.add(justificatif);

      print('📎 Fichier ajouté:');
      print('   Nom: ${justificatif.filename}');
      print('   Taille: ${justificatif.length} bytes');
      print('   Type: ${justificatif.contentType}');
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

      if (response.statusCode == 200 && data['success'] == true) {
        print('✅ Justificatif uploadé avec succès !');
        return ApiResponse.success(
          true,
          message: data['message'] ?? 'Justificatif envoyé avec succès',
        );
      } else {
        print('❌ Erreur serveur: ${data['error']}');
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de l\'envoi du justificatif',
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

  Future<String> downloadJustificatif(String cloudinaryUrl) async {
  try {
    // Obtenir le répertoire de sauvegarde
    Directory directory;

    if (Platform.isAndroid) {
      directory = (await getExternalStorageDirectory())!;
      String newPath = '';
      List<String> paths = directory.path.split('/');
      for (int i = 1; i < paths.length; i++) {
        if (paths[i] != 'Android') {
          newPath += '/${paths[i]}';
        } else {
          break;
        }
      }
      newPath = '$newPath/Download';
      directory = Directory(newPath);
    } else {
      directory = await getApplicationDocumentsDirectory();
    }

    if (!directory.existsSync()) {
      directory.createSync(recursive: true);
    }

    // Extraire le nom du fichier depuis l’URL Cloudinary
    String fileName = cloudinaryUrl.split('/').last;
    String savePath = '${directory.path}/$fileName';

    print('🔗 Téléchargement depuis Cloudinary: $cloudinaryUrl');
    print('📁 Sauvegarde dans: $savePath');

    // Télécharger le fichier
    await _dio.download(
      cloudinaryUrl,
      savePath,
      onReceiveProgress: (received, total) {
        if (total != -1) {
          print("📥 Téléchargement: ${(received / total * 100).toInt()}%");
        }
      },
    );

    print('✅ Téléchargement terminé: $savePath');
    return savePath;
  } catch (e) {
    print("❌ Erreur: $e");
    throw Exception("Erreur lors du téléchargement");
  }
}


  // Supprimer un justificatif
  Future<ApiResponse<bool>> deleteJustificatif(int absenceId) async {
    try {
      final token = await _storageService.getToken();
      
      if (token == null) {
        return ApiResponse.error('Token non trouvé');
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/absences/$absenceId/delete-justificatif',
      );

      print('🔗 Suppression justificatif: $url');

      final response = await http.delete(
        url,
        headers: ApiConfig.getHeaders(token: token),
      ).timeout(ApiConfig.connectTimeout);

      print('📥 Status: ${response.statusCode}');

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse.success(
          true,
          message: data['message'] ?? 'Justificatif supprimé avec succès',
        );
      } else {
        return ApiResponse.error(
          data['error'] ?? 'Erreur lors de la suppression du justificatif',
        );
      }
    } on SocketException {
      return ApiResponse.error('Pas de connexion internet');
    } on TimeoutException {
      return ApiResponse.error('Délai d\'attente dépassé');
    } catch (e) {
      print('❌ Erreur deleteJustificatif: $e');
      return ApiResponse.error('Erreur: ${e.toString()}');
    }
  }
}