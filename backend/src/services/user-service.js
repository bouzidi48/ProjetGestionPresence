const bcrypt = require('bcryptjs');
class UserService {
    constructor(db) {
        this.db = db;
    }

    async authenticate(email, password) {
        try {
            // 1. Récupérer l'utilisateur par email
            const user = await this.getUserByEmail(email);
        
            if (!user) {
                console.log('❌ Utilisateur non trouvé');
                return null;
            }

            

            // 2. Vérifier le mot de passe avec async/await
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
            console.log('🔑 Mot de passe valide:', isPasswordValid);

            if (!isPasswordValid) {
                console.log('❌ Mot de passe incorrect');
                return null;
            }

            

            if (!user.actif) {
                console.log('❌ Compte désactivé');
                return null;
            }

            console.log('✅ Authentification réussie pour:', user.email);

            // 4. Retourner l'utilisateur sans le mot de passe
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        
        } catch (error) {
            console.error('❌ Erreur authentification:', error);
            throw error;
        }
    }

    // Dans UserService.js

    async register(user) {
        // 1. Vérifier si l'email existe déjà
        const existingUser = await this.getUserByEmail(user.email);
        if (existingUser) {
            throw new Error('L\'email est déjà utilisé.');
        }
    
        // 2. Vérifier que les étudiants ont une photo (double vérification)
        if (user.role === 'etudiant' && !user.image_faciale_path) {
            throw new Error('Une photo est obligatoire pour les étudiants');
        }
    
        // 3. Hasher le mot de passe
        const passwordHash = await bcrypt.hash(user.password, 10);
        user.password_hash = passwordHash;
        delete user.password; // Supprimer le mot de passe en clair
    
        // 4. ✅ Conserver image_faciale_path (déjà dans user)
        // Pas besoin de le modifier, il vient de Cloudinary via req.file.path
    
        // 5. Insérer l'utilisateur en base
        const userId = await this.insertUser(user);
    
        console.log(`✅ Utilisateur ${user.role} créé avec ID: ${userId}`);
        if (user.image_faciale_path) {
            console.log(`📸 Photo: ${user.image_faciale_path}`);
        }
    
        return userId;
    }

    async getUserById(id) {
        const { result } = await this.db.select('users', 'id', id);
        if (!result[0]) return null;
        return result[0];
    }

    async getUsersByRoleActiveAndMaster(role, master_id) {
        const { result } = await this.db.selectMulti('users', {
            role: role,
            actif: 1,
        });
        // Filtrer les étudiants inscrits au master spécifié
        const filteredUsers = [];
        
        for (let user of result) {
            const inscriptionData = await this.db.selectMulti('inscriptions', {
                etudiant_id: user.id,
                master_id: master_id,
                statut: 'valide'
            });
            if (inscriptionData.result.length > 0) {
                filteredUsers.push(user);
            }
        }
        return filteredUsers;
    }

    async getUserByEmail(email) {
        const { result } = await this.db.select('users', 'email', email);
        if (!result[0]) return null;
        return result[0];
    }

    async getUsersByRole(role) {
        const { result } = await this.db.select('users', 'role', role);
        return result;
    }

    async getUsersByRoleActive(role) {
        const { result } = await this.db.selectMulti('users', {
            role: role,
            actif: 1
        });
        return result;
    }

    async getAllUsers() {
        const { result } = await this.db.select('users');
        return result;
    }

    async insertUser(user) {
        const row = {
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            password_hash: user.password_hash,
            role: user.role,
            image_faciale_path: user.image_faciale_path || null,
            actif: user.actif !== undefined ? user.actif : 1
        };
        
        const result = await this.db.insert('users', row);
        return result.insertId;
    }

    

    async updateUser(user) {
        const existingUser = await this.getUserById(user.id);
        if (!existingUser) {
            throw new Error(`L'utilisateur avec l'id ${user.id} n'existe pas.`);
        }

        const row = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            password_hash: user.password_hash,
            role: user.role,
            image_faciale_path: user.image_faciale_path,
            actif: user.actif
        };

        const result = await this.db.update('users', row);
        return result.success;
    }

    async deleteUser(id) {
        const result = await this.db.delete('users', id);
        return result.success;
    }

    async activateUser(id) {
        const user = await this.getUserById(id);
        if (!user) {
            throw new Error(`L'utilisateur avec l'id ${id} n'existe pas.`);
        }

        const row = { 
            id: id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            password_hash: user.password_hash,
            role: user.role,
            image_faciale_path: user.image_faciale_path,
            actif: true 
        };
        const result = await this.db.update('users', row);
        return result.success;
    }

    async deactivateUser(id) {
        const user = await this.getUserById(id);
        if (!user) {
            throw new Error(`L'utilisateur avec l'id ${id} n'existe pas.`);
        }

        const row = { 
            id: id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            password_hash: user.password_hash,
            role: user.role,
            image_faciale_path: user.image_faciale_path,
            actif: false 
        };
        const result = await this.db.update('users', row);
        return result.success;
    }
}

module.exports = UserService;
