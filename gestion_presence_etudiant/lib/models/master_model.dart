class Master {
  final int masterId;
  final String nom;
  final String code;
  final int? responsableId;
  final String? anneeUniversitaire;
  final Responsable? responsable;

  Master({
    required this.masterId,
    required this.nom,
    required this.code,
    this.responsableId,
    this.anneeUniversitaire,
    this.responsable,
  });

  factory Master.fromJson(Map<String, dynamic> json) {
    return Master(
      masterId: json['id'],  
      nom: json['nom'],
      code: json['code'],
      responsableId: json['responsable_id'], 
      anneeUniversitaire: json['annee_universitaire'],
      responsable: json['responsable'] != null 
          ? Responsable.fromJson(json['responsable'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': masterId,
      'nom': nom,
      'code': code,
      'responsable_id': responsableId,
      'annee_universitaire': anneeUniversitaire,
    };
  }

  @override
  String toString() {
    return 'Master{id: $masterId, nom: $nom, code: $code}';
  }
}

// ============================================================
// MODÈLE RESPONSABLE (à ajouter si pas déjà existant)
// ============================================================
class Responsable {
  final int id;
  final String nom;
  final String prenom;
  final String email;
  final String role;
  final String? imageFacialePath;
  final DateTime? dateCreation;
  final bool actif;

  Responsable({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    required this.role,
    this.imageFacialePath,
    this.dateCreation,
    this.actif = true,
  });

  factory Responsable.fromJson(Map<String, dynamic> json) {
    return Responsable(
      id: json['id'],
      nom: json['nom'],
      prenom: json['prenom'],
      email: json['email'],
      role: json['role'],
      imageFacialePath: json['image_faciale_path'],
      dateCreation: json['date_creation'] != null 
          ? DateTime.parse(json['date_creation'])
          : null,
      actif: json['actif'] == 1 || json['actif'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nom': nom,
      'prenom': prenom,
      'email': email,
      'role': role,
      'image_faciale_path': imageFacialePath,
      'date_creation': dateCreation?.toIso8601String(),
      'actif': actif ? 1 : 0,
    };
  }

  String get fullName => '$prenom $nom';

  @override
  String toString() {
    return 'Responsable{id: $id, nom: $nom, prenom: $prenom}';
  }
}