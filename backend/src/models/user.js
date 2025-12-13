class User {
    constructor(id = null, nom = '', prenom = '', email = '', password_hash = '', role = 'etudiant', image_faciale_path = null, date_creation = null, actif = true) {
        this._id = id;
        this._nom = nom;
        this._prenom = prenom;
        this._email = email;
        this._password_hash = password_hash;
        this._role = role;
        this._image_faciale_path = image_faciale_path;
        this._date_creation = date_creation;
        this._actif = actif;
    }

    // Getters
    get id() { return this._id; }
    get nom() { return this._nom; }
    get prenom() { return this._prenom; }
    get email() { return this._email; }
    get password_hash() { return this._password_hash; }
    get role() { return this._role; }
    get image_faciale_path() { return this._image_faciale_path; }
    get date_creation() { return this._date_creation; }
    get actif() { return this._actif; }

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

    set prenom(value) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error('Le prénom doit être une chaîne non vide');
        }
        this._prenom = value.trim();
    }

    set email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('Email invalide');
        }
        this._email = value.toLowerCase();
    }

    set password_hash(value) {
        this._password_hash = value;
    }

    set role(value) {
        const validRoles = ['responsable', 'professeur', 'etudiant'];
        if (!validRoles.includes(value)) {
            throw new Error('Rôle invalide. Doit être: responsable, professeur ou etudiant');
        }
        this._role = value;
    }

    set image_faciale_path(value) {
        this._image_faciale_path = value;
    }

    set date_creation(value) {
        this._date_creation = value;
    }

    set actif(value) {
        this._actif = Boolean(value);
    }

    toJSON() {
        return {
            id: this._id,
            nom: this._nom,
            prenom: this._prenom,
            email: this._email,
            password_hash: this._password_hash,
            role: this._role,
            image_faciale_path: this._image_faciale_path,
            date_creation: this._date_creation,
            actif: this._actif
        };
    }
}



module.exports = User;