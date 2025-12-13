const UserService = require('./user-service');
const MasterService = require('./master-service');
class InscriptionService {
    constructor(db) {
        this.db = db;
        this.userService = new UserService(db);
        this.masterService = new MasterService(db);
    }

    async getInscriptionById(id) {
        const { result } = await this.db.select('inscriptions', 'id', id);
        if (!result[0]) return null;

        const inscription = result[0];
        // Charger les relations
        inscription.etudiant = await this.userService.getUserById(inscription.etudiant_id);
        inscription.master = await this.masterService.getMasterById(inscription.master_id);
        
        return inscription;
    }

    async getInscriptionsByEtudiant(etudiant_id) {
        const { result } = await this.db.select('inscriptions', 'etudiant_id', etudiant_id);
        
        for (let inscription of result) {
            inscription.etudiant = await this.userService.getUserById(inscription.etudiant_id);
            inscription.master = await this.masterService.getMasterById(inscription.master_id);
        }
        
        return result;
    }

    async getInscriptionsByMaster(master_id) {
        const { result } = await this.db.select('inscriptions', 'master_id', master_id);
        
        for (let inscription of result) {
            inscription.etudiant = await this.userService.getUserById(inscription.etudiant_id);
            inscription.master = await this.masterService.getMasterById(inscription.master_id);
        }
        
        return result;
    }

    async getInscriptionsByStatut(statut) {
        const { result } = await this.db.select('inscriptions', 'statut', statut);
        
        for (let inscription of result) {
            inscription.etudiant = await this.userService.getUserById(inscription.etudiant_id);
            inscription.master = await this.masterService.getMasterById(inscription.master_id);
        }
        
        return result;
    }

    async getAllInscriptions() {
        const { result } = await this.db.select('inscriptions');
        
        for (let inscription of result) {
            inscription.etudiant = await this.userService.getUserById(inscription.etudiant_id);
            inscription.master = await this.masterService.getMasterById(inscription.master_id);
        }
        
        return result;
    }

    async insertInscription(inscription) {
        const row = {
            etudiant_id: inscription.etudiant_id,
            master_id: inscription.master_id,
            statut: inscription.statut || 'en_attente'
        };
        
        const result = await this.db.insert('inscriptions', row);
        return result.insertId;
    }

    async updateInscription(inscription) {
        const existingInscription = await this.getInscriptionById(inscription.id);
        if (!existingInscription) {
            throw new Error(`L'inscription avec l'id ${inscription.id} n'existe pas.`);
        }

        const row = {
            id: inscription.id,
            etudiant_id: inscription.etudiant_id,
            master_id: inscription.master_id,
            statut: inscription.statut
        };

        const result = await this.db.update('inscriptions', row);
        return result.success;
    }

    async deleteInscription(id) {
        const result = await this.db.delete('inscriptions', id);
        return result.success;
    }

    async validerInscription(id) {
        const inscription = await this.getInscriptionById(id);
        if (!inscription) {
            throw new Error(`L'inscription avec l'id ${id} n'existe pas.`);
        }

        const row = { 
            id: id,
            etudiant_id: inscription.etudiant_id,
            master_id: inscription.master_id,
            statut: 'valide' 
        };
        const result = await this.db.update('inscriptions', row);
        return result.success;
    }

    async rejeterInscription(id) {
        const inscription = await this.getInscriptionById(id);
        if (!inscription) {
            throw new Error(`L'inscription avec l'id ${id} n'existe pas.`);
        }

        const row = { 
            id: id,
            etudiant_id: inscription.etudiant_id,
            master_id: inscription.master_id,
            statut: 'rejete' 
        };
        const result = await this.db.update('inscriptions', row);
        return result.success;
    }
}
module.exports = InscriptionService;