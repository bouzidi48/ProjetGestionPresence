const CoursService = require('./cours-service');
class SeanceService {
    constructor(db) {
        this.db = db;
        this.coursService = new CoursService(db);
    }

    async getSeanceById(id) {
        const { result } = await this.db.select('seances', 'id', id);
        if (!result[0]) return null;

        const seance = result[0];
        // Charger le cours
        seance.cours = await this.coursService.getCoursById(seance.cours_id);
        
        return seance;
    }

    async getSeancesByCours(cours_id) {
        const { result } = await this.db.select('seances', 'cours_id', cours_id);
        
        for (let seance of result) {
            seance.cours = await this.coursService.getCoursById(seance.cours_id);
        }
        
        return result;
    }

    async getSeancesByDate(date_seance) {
        const { result } = await this.db.select('seances', 'date_seance', date_seance);
        
        for (let seance of result) {
            seance.cours = await this.coursService.getCoursById(seance.cours_id);
        }
        
        return result;
    }

    async getAllSeances() {
        const { result } = await this.db.select('seances');
        
        for (let seance of result) {
            seance.cours = await this.coursService.getCoursById(seance.cours_id);
        }
        
        return result;
    }

    async insertSeance(seance) {
        const row = {
            cours_id: seance.cours_id,
            date_seance: seance.date_seance,
            heure_debut: seance.heure_debut,
            heure_fin: seance.heure_fin,
            salle : seance.salle,
        };
        
        const result = await this.db.insert('seances', row);
        return result.insertId;
    }

    async updateSeance(seance) {
        const existingSeance = await this.getSeanceById(seance.id);
        if (!existingSeance) {
            throw new Error(`La séance avec l'id ${seance.id} n'existe pas.`);
        }

        const row = {
            id: seance.id,
            cours_id: seance.cours_id,
            date_seance: seance.date_seance,
            heure_debut: seance.heure_debut,
            heure_fin: seance.heure_fin,
            salle: seance.salle,
        };

        const result = await this.db.update('seances', row);
        return result.success;
    }

    async deleteSeance(id) {
        const result = await this.db.delete('seances', id);
        return result.success;
    }

    async marquerPresenceEffectuee(seance_id) {
        const seance = await this.getSeanceById(seance_id);
        if (!seance) {
            throw new Error(`La séance avec l'id ${seance_id} n'existe pas.`);
        }

        const row = { 
            id: seance_id,
            cours_id: seance.cours_id,
            date_seance: seance.date_seance,
            heure_debut: seance.heure_debut,
            heure_fin: seance.heure_fin,
            salle: seance.salle,
            presence_effectuee: 1 
        };
        const result = await this.db.update('seances', row);
        return result.success;
    }
}
module.exports = SeanceService;