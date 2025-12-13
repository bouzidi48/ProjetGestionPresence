const MasterService = require('./master-service');
const UserService = require('./user-service');
class CoursService {
    constructor(db) {
        this.db = db;
        this.masterService = new MasterService(db);
        this.userService = new UserService(db);
    }

    async getCoursById(id) {
        const { result } = await this.db.select('cours', 'id', id);
        if (!result[0]) return null;

        const cours = result[0];
        // Charger les relations
        cours.master = await this.masterService.getMasterById(cours.master_id);
        cours.professeur = cours.professeur_id ? await this.userService.getUserById(cours.professeur_id) : null;
        
        return cours;
    }

    async getCoursByCode(code) {
        const { result } = await this.db.select('cours', 'code', code);
        if (!result[0]) return null;

        const cours = result[0];
        cours.master = await this.masterService.getMasterById(cours.master_id);
        cours.professeur = cours.professeur_id ? await this.userService.getUserById(cours.professeur_id) : null;
        
        return cours;
    }

    async getCoursByMaster(master_id) {
        const { result } = await this.db.select('cours', 'master_id', master_id);
        
        for (let cours of result) {
            cours.master = await this.masterService.getMasterById(cours.master_id);
            cours.professeur = cours.professeur_id ? await this.userService.getUserById(cours.professeur_id) : null;
        }
        
        return result;
    }

    async getCoursByProfesseur(professeur_id) {
        const { result } = await this.db.select('cours', 'professeur_id', professeur_id);
        
        for (let cours of result) {
            cours.master = await this.masterService.getMasterById(cours.master_id);
            cours.professeur = await this.userService.getUserById(cours.professeur_id);
        }
        
        return result;
    }

    async getAllCours() {
        const { result } = await this.db.select('cours');
        
        for (let cours of result) {
            cours.master = await this.masterService.getMasterById(cours.master_id);
            cours.professeur = cours.professeur_id ? await this.userService.getUserById(cours.professeur_id) : null;
        }
        
        return result;
    }

    async getEtudiantsByCoursId(coursId) {
        const cours = await this.getCoursById(coursId);
        if (!cours) {
            throw new Error(`Le cours avec l'id ${coursId} n'existe pas.`);
        }
        const masterId = cours.master_id;
        const etudiants = await this.userService.getUsersByRoleActiveAndMaster('etudiant', masterId);
        return etudiants;
    }

    async insertCours(cours) {
        const row = {
            nom: cours.nom,
            code: cours.code,
            master_id: cours.master_id,
            professeur_id: cours.professeur_id || null,
            description: cours.description || null
        };
        
        const result = await this.db.insert('cours', row);
        return result.insertId;
    }

    async updateCours(cours) {
        const existingCours = await this.getCoursById(cours.id);
        if (!existingCours) {
            throw new Error(`Le cours avec l'id ${cours.id} n'existe pas.`);
        }

        const row = {
            id: cours.id,
            nom: cours.nom,
            code: cours.code,
            master_id: cours.master_id,
            professeur_id: cours.professeur_id,
            description: cours.description
        };

        const result = await this.db.update('cours', row);
        return result.success;
    }

    async deleteCours(id) {
        const result = await this.db.delete('cours', id);
        return result.success;
    }

    async affecterProfesseur(cours_id, professeur_id) {
        const cours = await this.getCoursById(cours_id);
        if (!cours) {
            throw new Error(`Le cours avec l'id ${cours_id} n'existe pas.`);
        }

        const row = { 
            id: cours_id,
            nom: cours.nom,
            code: cours.code,
            master_id: cours.master_id,
            professeur_id: professeur_id,
            description: cours.description
        };
        const result = await this.db.update('cours', row);
        return result.success;
    }
}
module.exports = CoursService;