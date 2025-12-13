const SeanceService = require('./seance-service');
const UserService = require('./user-service');
class PresenceService {
    constructor(db) {
        this.db = db;
        this.seanceService = new SeanceService(db);
        this.userService = new UserService(db);
    }

    async getPresenceById(id) {
        const { result } = await this.db.select('presences', 'id', id);
        if (!result[0]) return null;

        const presence = result[0];
        // Charger les relations
        presence.seance = await this.seanceService.getSeanceById(presence.seance_id);
        presence.etudiant = await this.userService.getUserById(presence.etudiant_id);
        
        return presence;
    }

    async getPresenceBySeanceAndEtudiant(seance_id, etudiant_id) {
        const { result } = await this.db.selectMulti('presences',{
            'seance_id' : seance_id,
            'etudiant_id' : etudiant_id
        })
        for (let presence of result) {
            presence.seance = await this.seanceService.getSeanceById(presence.seance_id);
            presence.etudiant = await this.userService.getUserById(presence.etudiant_id);
        }
        return  result ;
    }

    async getPresencesBySeance(seance_id) {
        const { result } = await this.db.select('presences', 'seance_id', seance_id);
        
        for (let presence of result) {
            presence.seance = await this.seanceService.getSeanceById(presence.seance_id);
            presence.etudiant = await this.userService.getUserById(presence.etudiant_id);
        }
    
        // ✅ Retourner un objet avec result
        return { result };
    }

    async getPresencesByEtudiant(etudiant_id) {
        const { result } = await this.db.select('presences', 'etudiant_id', etudiant_id);
        
        for (let presence of result) {
            presence.seance = await this.seanceService.getSeanceById(presence.seance_id);
            presence.etudiant = await this.userService.getUserById(presence.etudiant_id);
        }
        
        return result;
    }

    async getPresenceByCoursAndEtudiant(cours_id, etudiant_id) {
        // Récupérer les séances du cours
        const seances = await this.seanceService.getSeancesByCours(cours_id);
        const presences = [];
        for (let seance of seances) {
            const { result } = await this.getPresencesBySeance(seance.id);
            for (let presence of result) {
                if (presence.etudiant_id === etudiant_id) {
                    presences.push(presence);
                }
            }
        }
        return presences;
    }

    async getAllPresences() {
        const { result } = await this.db.select('presences');
        
        for (let presence of result) {
            presence.seance = await this.seanceService.getSeanceById(presence.seance_id);
            presence.etudiant = await this.userService.getUserById(presence.etudiant_id);
        }
        
        return result;
    }

    async getPresenceBySeanceAndEtudiant(seance_id, etudiant_id) {
        const { result } = await this.db.selectMulti('presences', {
            seance_id: seance_id,
            etudiant_id: etudiant_id
        });
        if (!result[0]) return null;
        const presence = result[0];
        // Charger les relations
        presence.seance = await this.seanceService.getSeanceById(presence.seance_id);
        presence.etudiant = await this.userService.getUserById(presence.etudiant_id);
        return presence;
    }

    async insertPresence(presence) {
        const row = {
            seance_id: presence.seance_id,
            etudiant_id: presence.etudiant_id,
            present: 1
        };
        
        const result = await this.db.insert('presences', row);
        return result.insertId;
    }

    async updatePresence(presence) {
        const existingPresence = await this.getPresenceById(presence.id);
        if (!existingPresence) {
            throw new Error(`La présence avec l'id ${presence.id} n'existe pas.`);
        }

        const row = {
            id: presence.id,
            seance_id: presence.seance_id,
            etudiant_id: presence.etudiant_id,
            present: presence.present
        };

        const result = await this.db.update('presences', row);
        return result.success;
    }

    async deletePresence(id) {
        const result = await this.db.delete('presences', id);
        return result.success;
    }
}
module.exports = PresenceService;