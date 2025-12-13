
class Inscription {
    constructor(id = null, etudiant = null, master = null, date_inscription = null, statut = 'en_attente') {
        this._id = id;
        this._etudiant = etudiant; // Objet User
        this._master = master; // Objet Master
        this._date_inscription = date_inscription;
        this._statut = statut;
    }

    // Getters
    get id() { return this._id; }
    get etudiant() { return this._etudiant; }
    get etudiant_id() { return this._etudiant ? this._etudiant.id : null; }
    get master() { return this._master; }
    get master_id() { return this._master ? this._master.id : null; }
    get date_inscription() { return this._date_inscription; }
    get statut() { return this._statut; }

    // Setters
    set id(value) {
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
            throw new Error('L\'ID doit être un entier positif ou null');
        }
        this._id = value;
    }

    set etudiant(value) {
        if (value !== null && !(value instanceof User)) {
            throw new Error('L\'etudiant doit être une instance de User ou null');
        }
        this._etudiant = value;
    }

    set master(value) {
        if (value !== null && !(value instanceof Master)) {
            throw new Error('Le master doit être une instance de Master ou null');
        }
        this._master = value;
    }

    set date_inscription(value) {
        this._date_inscription = value;
    }

    set statut(value) {
        const validStatuts = ['en_attente', 'valide', 'rejete'];
        if (!validStatuts.includes(value)) {
            throw new Error('Statut invalide. Doit être: en_attente, valide ou rejete');
        }
        this._statut = value;
    }

    toJSON() {
        return {
            id: this._id,
            etudiant_id: this.etudiant_id,
            etudiant: this._etudiant ? this._etudiant.toJSON() : null,
            master_id: this.master_id,
            master: this._master ? this._master.toJSON() : null,
            date_inscription: this._date_inscription,
            statut: this._statut
        };
    }
}
module.exports = Inscription;