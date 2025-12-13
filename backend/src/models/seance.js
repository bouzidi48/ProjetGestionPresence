
class Seance {
    constructor(id = null, cours = null, date_seance = null, heure_debut = null, heure_fin = null, salle = null, presence_effectuee = false) {
        this._id = id;
        this._cours = cours; // Objet Cours
        this._date_seance = date_seance;
        this._heure_debut = heure_debut;
        this._heure_fin = heure_fin;
        this._salle = salle
        this._presence_effectuee = presence_effectuee;
    }

    // Getters
    get id() { return this._id; }
    get cours() { return this._cours; }
    get cours_id() { return this._cours ? this._cours.id : null; }
    get date_seance() { return this._date_seance; }
    get heure_debut() { return this._heure_debut; }
    get heure_fin() { return this._heure_fin; }
    get presence_effectuee() { return this._presence_effectuee; }
    get salle() { return this._salle; }

    // Setters
    set id(value) {
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
            throw new Error('L\'ID doit être un entier positif ou null');
        }
        this._id = value;
    }

    set cours(value) {
        if (value !== null && !(value instanceof Cours)) {
            throw new Error('Le cours doit être une instance de Cours ou null');
        }
        this._cours = value;
    }

    set date_seance(value) {
        if (value !== null && !(value instanceof Date) && isNaN(Date.parse(value))) {
            throw new Error('La date_seance doit être une date valide');
        }
        this._date_seance = value;
    }

    set heure_debut(value) {
        this._heure_debut = value;
    }

    set heure_fin(value) {
        this._heure_fin = value;
    }

    set presence_effectuee(value) {
        this._presence_effectuee = Boolean(value);
    }

    set salle(value) {
        this._salle = value;
    }

    toJSON() {
        return {
            id: this._id,
            cours_id: this.cours_id,
            cours: this._cours ? this._cours.toJSON() : null,
            date_seance: this._date_seance,
            heure_debut: this._heure_debut,
            heure_fin: this._heure_fin,
            salle: this._salle,
            presence_effectuee: this._presence_effectuee
        };
    }
}
module.exports = Seance;