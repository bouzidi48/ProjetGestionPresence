
class Absence {
    constructor(id = null, presence = null, etudiant = null, seance = null, justifiee = false, fichier_justificatif_path = null, date_soumission_justificatif = null, commentaire_responsable = null) {
        this._id = id;
        this._presence = presence; // Objet Presence
        this._etudiant = etudiant; // Objet User
        this._seance = seance; // Objet Seance
        this._justifiee = justifiee;
        this._fichier_justificatif_path = fichier_justificatif_path;
        this._date_soumission_justificatif = date_soumission_justificatif;
        this._commentaire_responsable = commentaire_responsable;
    }

    // Getters
    get id() { return this._id; }
    get presence() { return this._presence; }
    get presence_id() { return this._presence ? this._presence.id : null; }
    get etudiant() { return this._etudiant; }
    get etudiant_id() { return this._etudiant ? this._etudiant.id : null; }
    get seance() { return this._seance; }
    get seance_id() { return this._seance ? this._seance.id : null; }
    get justifiee() { return this._justifiee; }
    get fichier_justificatif_path() { return this._fichier_justificatif_path; }
    get date_soumission_justificatif() { return this._date_soumission_justificatif; }
    get commentaire_responsable() { return this._commentaire_responsable; }

    // Setters
    set id(value) {
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
            throw new Error('L\'ID doit être un entier positif ou null');
        }
        this._id = value;
    }

    set presence(value) {
        if (value !== null && !(value instanceof Presence)) {
            throw new Error('La presence doit être une instance de Presence ou null');
        }
        this._presence = value;
    }

    set etudiant(value) {
        if (value !== null && !(value instanceof User)) {
            throw new Error('L\'etudiant doit être une instance de User ou null');
        }
        this._etudiant = value;
    }

    set seance(value) {
        if (value !== null && !(value instanceof Seance)) {
            throw new Error('La seance doit être une instance de Seance ou null');
        }
        this._seance = value;
    }

    set justifiee(value) {
        this._justifiee = Boolean(value);
    }

    set fichier_justificatif_path(value) {
        this._fichier_justificatif_path = value;
    }

    set date_soumission_justificatif(value) {
        this._date_soumission_justificatif = value;
    }

    set commentaire_responsable(value) {
        this._commentaire_responsable = value;
    }

    toJSON() {
        return {
            id: this._id,
            presence_id: this.presence_id,
            presence: this._presence ? this._presence.toJSON() : null,
            etudiant_id: this.etudiant_id,
            etudiant: this._etudiant ? this._etudiant.toJSON() : null,
            seance_id: this.seance_id,
            seance: this._seance ? this._seance.toJSON() : null,
            justifiee: this._justifiee,
            fichier_justificatif_path: this._fichier_justificatif_path,
            date_soumission_justificatif: this._date_soumission_justificatif,
            commentaire_responsable: this._commentaire_responsable
        };
    }
}
module.exports = Absence;