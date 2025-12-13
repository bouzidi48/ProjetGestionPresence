const PresenceService = require('./peresence-service');
const UserService = require('./user-service');
const SeanceService = require('./seance-service');
class AbsenceService {
    constructor(db) {
        this.db = db;
        this.presenceService = new PresenceService(db);
        this.userService = new UserService(db);
        this.seanceService = new SeanceService(db);
    }

    async getAbsenceById(id) {
        const { result } = await this.db.select('absences', 'id', id);
        if (!result[0]) return null;

        const absence = result[0];
        absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
        absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        
        return absence;
    }

    async getAbsencesByEtudiant(etudiant_id) {
        const { result } = await this.db.select('absences', 'etudiant_id', etudiant_id);
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAbsenceByCoursAndEtudiant(cours_id, etudiant_id) {
        // Récupérer les séances du cours
        const seances = await this.seanceService.getSeancesByCours(cours_id);
        const absences = [];
        for (let seance of seances) {
            const result = await this.getAbsencesBySeance(seance.id);
            for (let absence of result) {
                if (absence.etudiant_id === etudiant_id) {
                    absences.push(absence);
                }
            }
        }
        return absences;
    }

    async getAbsencesBySeance(seance_id) {
        const { result } = await this.db.select('absences', 'seance_id', seance_id);
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAbsencesNonJustifiees() {
        const { result } = await this.db.select('absences', 'justifiee', null);
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAbsencesByEtudiantJustifier(etudiant_id) {
        const { result } = await this.db.selectMulti('absences', {
            'etudiant_id' : etudiant_id,
            'justifiee' : 1
        });
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAbsencesByEtudiantNonJustifier(etudiant_id) {
        const { result } = await this.db.selectMulti('absences', {
            'etudiant_id' : etudiant_id,
            'justifiee' : 0
        });
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAllAbsencesNonJustifiees() {
        const { result } = await this.db.select('absences','justifiee' , null);
        console.log(result);
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAbsencesByEtudiantEnAttente(etudiant_id) {
        const { result } = await this.db.selectMulti('absences', {
            'etudiant_id' : etudiant_id,
            'justifiee' : null
        });
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async getAllAbsences() {
        const { result } = await this.db.select('absences');
        
        for (let absence of result) {
            absence.etudiant = await this.userService.getUserById(absence.etudiant_id);
            absence.seance = await this.seanceService.getSeanceById(absence.seance_id);
        }
        
        return result;
    }

    async insertAbsence(absence) {
        const row = {
            etudiant_id: absence.etudiant_id,
            seance_id: absence.seance_id,
            justifiee: null,
            fichier_justificatif_path: absence.fichier_justificatif_path || null,
            date_soumission_justificatif: absence.date_soumission_justificatif || null,
            commentaire_responsable: absence.commentaire_responsable || null
        };
        
        const result = await this.db.insert('absences', row);
        return result.insertId;
    }

    async updateAbsence(absence) {
        const existingAbsence = await this.getAbsenceById(absence.id);
        if (!existingAbsence) {
            throw new Error(`L'absence avec l'id ${absence.id} n'existe pas.`);
        }

        const row = {
            id: absence.id,
            etudiant_id: absence.etudiant_id,
            seance_id: absence.seance_id,
            justifiee: absence.justifiee,
            fichier_justificatif_path: absence.fichier_justificatif_path,
            date_soumission_justificatif: absence.date_soumission_justificatif,
            commentaire_responsable: absence.commentaire_responsable
        };

        const result = await this.db.update('absences', row);
        return result.success;
    }

    async deleteAbsence(id) {
        const result = await this.db.delete('absences', id);
        return result.success;
    }

    async soumettreJustificatif(absence_id, fichier_path) {
        const absence = await this.getAbsenceById(absence_id);
        if (!absence) {
            throw new Error(`L'absence avec l'id ${absence_id} n'existe pas.`);
        }

        const row = {
            id: absence_id,
            etudiant_id: absence.etudiant_id,
            seance_id: absence.seance_id,
            justifiee: absence.justifiee,
            fichier_justificatif_path: fichier_path,
            date_soumission_justificatif: new Date(),
            commentaire_responsable: absence.commentaire_responsable
        };

        const result = await this.db.update('absences', row);
        return result.success;
    }

    async validerJustificatif(absence_id, commentaire = null) {
        const absence = await this.getAbsenceById(absence_id);
        if (!absence) {
            throw new Error(`L'absence avec l'id ${absence_id} n'existe pas.`);
        }

        const row = {
            id: absence_id,
            etudiant_id: absence.etudiant_id,
            seance_id: absence.seance_id,
            justifiee: 1,
            fichier_justificatif_path: absence.fichier_justificatif_path,
            date_soumission_justificatif: absence.date_soumission_justificatif,
            commentaire_responsable: commentaire
        };

        const result = await this.db.update('absences', row);
        return result.success;
    }

    async rejeterJustificatif(absence_id, commentaire) {
        const absence = await this.getAbsenceById(absence_id);
        if (!absence) {
            throw new Error(`L'absence avec l'id ${absence_id} n'existe pas.`);
        }

        const row = {
            id: absence_id,
            etudiant_id: absence.etudiant_id,
            seance_id: absence.seance_id,
            justifiee: 0,
            fichier_justificatif_path: absence.fichier_justificatif_path,
            date_soumission_justificatif: absence.date_soumission_justificatif,
            commentaire_responsable: commentaire
        };

        const result = await this.db.update('absences', row);
        return result.success;
    }
}

module.exports = AbsenceService;
