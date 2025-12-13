// lib/providers/user_provider.dart

import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/user_service.dart';
import '../services/storage_service.dart';

class UserProvider with ChangeNotifier {
  final UserService _userService = UserService();
  final StorageService _storageService = StorageService();

  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // ============================================================
  // INITIALISATION
  // ============================================================
  
  /// Charger l'utilisateur et le token depuis le storage
  Future<void> loadUserFromStorage() async {
    try {
      _token = await _storageService.getToken();
      if (_token != null) {
        final userData = await _storageService.getUser();
        if (userData != null) {
          _user = UserModel.fromJson(userData);
          notifyListeners();
        }
      }
    } catch (e) {
      print('Erreur chargement user depuis storage: $e');
    }
  }

  /// Définir l'utilisateur (appelé après login)
  void setUser(UserModel user, String token) {
    _user = user;
    _token = token;
    notifyListeners();
  }

  // ============================================================
  // CHANGER LE MOT DE PASSE
  // ============================================================
  
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    if (_user == null || _token == null) {
      _errorMessage = 'Utilisateur non connecté';
      notifyListeners();
      return false;
    }

    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await _userService.changePassword(
        userId: _user!.id,
        currentPassword: currentPassword,
        newPassword: newPassword,
        token: _token,
      );

      _isLoading = false;

      if (response.success) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.error ?? 'Erreur lors du changement';
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

  // ============================================================
  // METTRE À JOUR LA PHOTO
  // ============================================================
  
  Future<bool> updatePhoto(String photoPath) async {
    if (_user == null || _token == null) {
      _errorMessage = 'Utilisateur non connecté';
      notifyListeners();
      return false;
    }

    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final response = await _userService.updatePhoto(
        userId: _user!.id,
        photoPath: photoPath,
        token: _token,
      );

      _isLoading = false;

      if (response.success && response.data != null) {
        // Mettre à jour l'utilisateur local
        _user = response.data!;
        
        // Sauvegarder dans le storage
        await _storageService.saveUser(_user!.toJson());
        
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.error ?? 'Erreur lors de la mise à jour';
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

  // ============================================================
  // METTRE À JOUR L'UTILISATEUR (GÉNÉRIQUE)
  // ============================================================
  
  Future<void> updateUser(UserModel updatedUser) async {
    _user = updatedUser;
    await _storageService.saveUser(updatedUser.toJson());
    notifyListeners();
  }

  // ============================================================
  // RAFRAÎCHIR LES DONNÉES UTILISATEUR
  // ============================================================
  
  Future<bool> refreshUser() async {
    if (_user == null || _token == null) {
      return false;
    }

    try {
      _isLoading = true;
      notifyListeners();

      final response = await _userService.getUserById(
        _user!.id,
        token: _token,
      );

      _isLoading = false;

      if (response.success && response.data != null) {
        _user = response.data!;
        await _storageService.saveUser(_user!.toJson());
        notifyListeners();
        return true;
      } else {
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ============================================================
  // DÉCONNEXION
  // ============================================================
  
  Future<void> logout() async {
    _user = null;
    _token = null;
    _errorMessage = null;
    await _storageService.logout();
    notifyListeners();
  }

  // ============================================================
  // RÉINITIALISER L'ERREUR
  // ============================================================
  
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}