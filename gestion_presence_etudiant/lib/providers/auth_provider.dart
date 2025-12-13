import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;
  int? _pendingEtudiantId;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _token != null && _user != null;
  int? get pendingEtudiantId => _pendingEtudiantId;

  // Vérifier si l'utilisateur est connecté au démarrage
  Future<bool> checkAuth() async {
    try {
      _isLoading = true;
      notifyListeners();

      _token = await _storageService.getToken();
      if (_token != null) {
        final userData = await _storageService.getUser();
        if (userData != null) {
          _user = UserModel.fromJson(userData);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }

      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Connexion
  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await _authService.login(email, password);

      if (response.success && response.data != null) {
        _token = response.data!.token;
        _user = response.data!.user;

        // Sauvegarder dans le stockage local
        await _storageService.saveToken(_token!);
        await _storageService.saveUser(_user!.toJson());

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.error ?? 'Erreur de connexion';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Erreur: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Dans auth_provider.dart

  Future<bool> register({
    required String nom,
    required String prenom,
    required String email,
    required String password,
    required String photoPath,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      _pendingEtudiantId = null;  // ← AJOUTER
      notifyListeners();

      final response = await _authService.register(
        nom: nom,
        prenom: prenom,
        email: email,
        password: password,
        photoPath: photoPath,
      );

      _isLoading = false;

      if (response.success && response.data != null) {  // ← Vérifier data
        _pendingEtudiantId = response.data;  // ← AJOUTER - stocker l'ID
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.error ?? 'Erreur d\'inscription';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Erreur: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearPendingEtudiantId() {
    _pendingEtudiantId = null;
    notifyListeners();
  }

  // Déconnexion
  Future<void> logout() async {
    _user = null;
    _token = null;
    _errorMessage = null;
    _pendingEtudiantId = null;  // ← AJOUTER
    await _storageService.logout();
    notifyListeners();
  }

  // Réinitialiser le message d'erreur
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}