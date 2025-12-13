const UserService  = require('./user-service');
class MasterService {
    constructor(db) {
        this.db = db;
        this.userService = new UserService(db);
    }

    async getMasterById(id) {
        const { result } = await this.db.select('masters', 'id', id);
        if (!result[0]) return null;

        const master = result[0];
        // Charger le responsable
        master.responsable = await this.userService.getUserById(master.responsable_id);
        
        return master;
    }

    async getMasterByCode(code) {
        const { result } = await this.db.select('masters', 'code', code);
        if (!result[0]) return null;

        const master = result[0];
        master.responsable = await this.userService.getUserById(master.responsable_id);
        
        return master;
    }

    async getMastersByResponsable(responsable_id) {
        const { result } = await this.db.select('masters', 'responsable_id', responsable_id);
        
        // Charger les responsables pour chaque master
        for (let master of result) {
            master.responsable = await this.userService.getUserById(master.responsable_id);
        }
        
        return result;
    }

    async getAllMasters() {
        const { result } = await this.db.select('masters');
        
        // Charger les responsables pour chaque master
        for (let master of result) {
            master.responsable = await this.userService.getUserById(master.responsable_id);
        }
        
        return result;
    }

    async insertMaster(master) {
        const row = {
            nom: master.nom,
            code: master.code,
            responsable_id: master.responsable_id,
            annee_universitaire: master.annee_universitaire
        };
        
        const result = await this.db.insert('masters', row);
        return result.insertId;
    }

    async updateMaster(master) {
        const existingMaster = await this.getMasterById(master.id);
        if (!existingMaster) {
            throw new Error(`Le master avec l'id ${master.id} n'existe pas.`);
        }

        const row = {
            id: master.id,
            nom: master.nom,
            code: master.code,
            responsable_id: master.responsable_id,
            annee_universitaire: master.annee_universitaire
        };

        const result = await this.db.update('masters', row);
        return result.success;
    }

    async deleteMaster(id) {
        const result = await this.db.delete('masters', id);
        return result.success;
    }
}
module.exports = MasterService;