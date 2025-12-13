class UserModel {
  final int id;
  final String nom;
  final String prenom;
  final String email;
  final String? imageFacialePath;
  final String role;
  final int actif;
  final DateTime dateCreation;

  UserModel({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    this.imageFacialePath,
    required this.role,
    required this.actif,
    required this.dateCreation,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      nom: json['nom'],
      prenom: json['prenom'],
      email: json['email'],
      imageFacialePath: json['image_faciale_path'],
      role: json['role'],
      actif: json['actif'] ?? 1,
      dateCreation: DateTime.parse(json['date_creation']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nom': nom,
      'prenom': prenom,
      'email': email,
      'image_faciale_path': imageFacialePath,
      'role': role,
      'actif': actif,
      'date_creation': dateCreation.toIso8601String(),
    };
  }

  String get fullName => '$prenom $nom';
}

class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }
}

class RegisterRequest {
  final String nom;
  final String prenom;
  final String email;
  final String password;
  

  RegisterRequest({
    required this.nom,
    required this.prenom,
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'nom': nom,
      'prenom': prenom,
      'email': email,
      'password': password,
      'role': 'etudiant',
    };
  }
}