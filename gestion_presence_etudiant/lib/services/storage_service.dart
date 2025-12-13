import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Sauvegarder le token
  Future<bool> saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_tokenKey, token);
    } catch (e) {
      print('Erreur sauvegarde token: $e');
      return false;
    }
  }

  // Récupérer le token
  Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenKey);
    } catch (e) {
      print('Erreur récupération token: $e');
      return null;
    }
  }

  // Sauvegarder les données utilisateur
  Future<bool> saveUser(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = json.encode(userData);
      return await prefs.setString(_userKey, userJson);
    } catch (e) {
      print('Erreur sauvegarde user: $e');
      return false;
    }
  }

  // Récupérer les données utilisateur
  Future<Map<String, dynamic>?> getUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userKey);
      if (userJson != null) {
        return json.decode(userJson);
      }
      return null;
    } catch (e) {
      print('Erreur récupération user: $e');
      return null;
    }
  }

  // Vérifier si l'utilisateur est connecté
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // Déconnexion
  Future<bool> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
      await prefs.remove(_userKey);
      return true;
    } catch (e) {
      print('Erreur logout: $e');
      return false;
    }
  }

  // Nettoyer toutes les données
  Future<bool> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.clear();
    } catch (e) {
      print('Erreur clear all: $e');
      return false;
    }
  }
}