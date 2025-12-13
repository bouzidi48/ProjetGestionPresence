class ApiConfig {
  // 🔧 IMPORTANT : Changez cette URL selon votre configuration
  // Pour émulateur Android : http://10.0.2.2:3000/api
  // Pour device physique : http://VOTRE_IP:3000/api (ex: http://192.168.1.10:3000/api)
  // Pour iOS simulateur : http://localhost:3000/api
  
  static const String baseUrl = 'http://10.210.71.51:3001/presences';
  
  // Endpoints Auth
  static const String login = '/users/authenticate';
  static const String register = '/users/register';
  
  // Endpoints Étudiant
  static const String etudiantAbsences = '/etudiant/absences';
  static const String etudiantProfile = '/etudiant/profile';
  
  // Endpoints Absences
  static const String absences = '/absences';
  static String absenceJustificatif(int id) => '/absences/$id/justificatif';
  static String absenceStatut(int id) => '/absences/$id/statut';
  
  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Headers
  static Map<String, String> getHeaders({String? token}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }
  
  static Map<String, String> getMultipartHeaders({String? token}) {
    final headers = {
      'Accept': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }
}