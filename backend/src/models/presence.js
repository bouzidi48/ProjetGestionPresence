
class Presence {
    constructor(id = null, seance = null, etudiant = null, present = false, date_enregistrement = null) {
        this._id = id;
        this._seance = seance; // Objet Seance
        this._etudiant = etudiant; // Objet User
        this._present = present;
        this._date_enregistrement = date_enregistrement;
    }

    // Getters
    get id() { return this._id; }
    get seance() { return this._seance; }
    get seance_id() { return this._seance ? this._seance.id : null; }
    get etudiant() { return this._etudiant; }
    get etudiant_id() { return this._etudiant ? this._etudiant.id : null; }
    get present() { return this._present; }
    get date_enregistrement() { return this._date_enregistrement; }

    // Setters
    set id(value) {
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
            throw new Error('L\'ID doit être un entier positif ou null');
        }
        this._id = value;
    }

    set seance(value) {
        if (value !== null && !(value instanceof Seance)) {
            throw new Error('La seance doit être une instance de Seance ou null');
        }
        this._seance = value;
    }

    set etudiant(value) {
        if (value !== null && !(value instanceof User)) {
            throw new Error('L\'etudiant doit être une instance de User ou null');
        }
        this._etudiant = value;
    }

    set present(value) {
        this._present = Boolean(value);
    }

    set date_enregistrement(value) {
        this._date_enregistrement = value;
    }

    toJSON() {
        return {
            id: this._id,
            seance_id: this.seance_id,
            seance: this._seance ? this._seance.toJSON() : null,
            etudiant_id: this.etudiant_id,
            etudiant: this._etudiant ? this._etudiant.toJSON() : null,
            present: this._present,
            date_enregistrement: this._date_enregistrement
        };
    }
}
module.exports = Presence;
