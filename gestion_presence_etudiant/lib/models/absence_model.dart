class AbsenceModel {
  final int id;
  final int seanceId;
  final int etudiantId;
  final bool justifiee;
  final String? fichierJustificatifPath;
  final DateTime? dateSoumissionJustificatif;
  final String? commentaireResponsable;
  final DateTime dateCreation;
  
  // Informations de la séance
  final String? coursNom;
  final DateTime? seanceDate;
  final String? seanceHeureDebut;
  final String? seanceHeureFin;

  AbsenceModel({
    required this.id,
    required this.seanceId,
    required this.etudiantId,
    required this.justifiee,
    this.fichierJustificatifPath,
    this.dateSoumissionJustificatif,
    this.commentaireResponsable,
    required this.dateCreation,
    this.coursNom,
    this.seanceDate,
    this.seanceHeureDebut,
    this.seanceHeureFin,
  });

  factory AbsenceModel.fromJson(Map<String, dynamic> json) {
    return AbsenceModel(
      id: json['id'],
      seanceId: json['seance_id'],
      etudiantId: json['etudiant_id'],
      justifiee: json['justifiee'] ?? false,
      fichierJustificatifPath: json['fichier_justificatif_path'],
      dateSoumissionJustificatif: json['date_soumission_justificatif'] != null
          ? DateTime.parse(json['date_soumission_justificatif'])
          : null,
      commentaireResponsable: json['commentaire_responsable'],
      dateCreation: DateTime.parse(json['date_creation'] ?? DateTime.now().toIso8601String()),
      coursNom: json['cours_nom'],
      seanceDate: json['seance_date'] != null
          ? DateTime.parse(json['seance_date'])
          : null,
      seanceHeureDebut: json['seance_heure_debut'],
      seanceHeureFin: json['seance_heure_fin'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'seance_id': seanceId,
      'etudiant_id': etudiantId,
      'justifiee': justifiee,
      'fichier_justificatif_path': fichierJustificatifPath,
      'date_soumission_justificatif': dateSoumissionJustificatif?.toIso8601String(),
      'commentaire_responsable': commentaireResponsable,
      'date_creation': dateCreation.toIso8601String(),
    };
  }

  String get statut {
    if (justifiee) {
      return 'Justifiée';
    } else if (fichierJustificatifPath != null) {
      return 'En attente de validation';
    } else {
      return 'Non justifiée';
    }
  }

  bool get peutSoumettreJustificatif {
    return !justifiee && fichierJustificatifPath == null;
  }
}