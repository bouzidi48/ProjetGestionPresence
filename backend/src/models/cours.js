
class Cours {
    constructor(id = null, nom = '', code = '', master = null, professeur = null, description = null) {
        this._id = id;
        this._nom = nom;
        this._code = code;
        this._master = master; // Objet Master
        this._professeur = professeur; // Objet User
        this._description = description;
    }

    // Getters
    get id() { return this._id; }
    get nom() { return this._nom; }
    get code() { return this._code; }
    get master() { return this._master; }
    get master_id() { return this._master ? this._master.id : null; }
    get professeur() { return this._professeur; }
    get professeur_id() { return this._professeur ? this._professeur.id : null; }
    get description() { return this._description; }

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

    set master(value) {
        if (value !== null && !(value instanceof Master)) {
            throw new Error('Le master doit être une instance de Master ou null');
        }
        this._master = value;
    }

    set professeur(value) {
        if (value !== null && !(value instanceof User)) {
            throw new Error('Le professeur doit être une instance de User ou null');
        }
        this._professeur = value;
    }

    set description(value) {
        this._description = value;
    }

    toJSON() {
        return {
            id: this._id,
            nom: this._nom,
            code: this._code,
            master_id: this.master_id,
            master: this._master ? this._master.toJSON() : null,
            professeur_id: this.professeur_id,
            professeur: this._professeur ? this._professeur.toJSON() : null,
            description: this._description
        };
    }
}
module.exports = Cours;