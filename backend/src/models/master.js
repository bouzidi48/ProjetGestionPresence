class Master {
    constructor(id = null, nom = '', code = '', responsable = null, annee_universitaire = '') {
        this._id = id;
        this._nom = nom;
        this._code = code;
        this._responsable = responsable; // Objet User
        this._annee_universitaire = annee_universitaire;
    }

    // Getters
    get id() { return this._id; }
    get nom() { return this._nom; }
    get code() { return this._code; }
    get responsable() { return this._responsable; }
    get responsable_id() { return this._responsable ? this._responsable.id : null; }
    get annee_universitaire() { return this._annee_universitaire; }

    // Setters
    set id(value) {
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
            throw new Error('L\'ID doit être un entier positif ou null');
        }
        this._id = value;
    }

    set nom(value) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error('Le nom doit être une chaîne non vide');
        }
        this._nom = value.trim();
    }

    set code(value) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error('Le code doit être une chaîne non vide');
        }
        this._code = value.trim().toUpperCase();
    }

    set responsable(value) {
        if (value !== null && !(value instanceof User)) {
            throw new Error('Le responsable doit être une instance de User ou null');
        }
        this._responsable = value;
    }

    set annee_universitaire(value) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error('L\'année universitaire doit être une chaîne non vide');
        }
        this._annee_universitaire = value.trim();
    }

    toJSON() {
        return {
            id: this._id,
            nom: this._nom,
            code: this._code,
            responsable_id: this.responsable_id,
            responsable: this._responsable ? this._responsable.toJSON() : null,
            annee_universitaire: this._annee_universitaire
        };
    }
}
module.exports = Master;