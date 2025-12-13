//la syntaxe commun Js
const express=require('express');//fonction pour creere notre serveur
const cors=require('cors');
const requestLogger = require('./middleware/request-logger');
//const BiblioService = require('./services/biblio-service');
const MySQLRepository = require('./database/db');
const UserService = require('./services/user-service');
const MasterService = require('./services/master-service');
const CoursService = require('./services/cours-service');
const SeanceService = require('./services/seance-service');
const PresenceService = require('./services/peresence-service');
const AbsenceService = require('./services/absence-service');
const InscriptionService = require('./services/inscription-service');
const PresenceRouter = require('./routes/presence-router');
//const BiblioService = require('./services/biblio-service');
//const AuthorsRouter = require('./routes/authors.router');
//const DocumentsRouter = require('./routes/documents-router');
require('dotenv').config();

class Server{
    //cons de initialisation
    constructor(port=3000){
        this.port=port;
        this.db = new MySQLRepository('gestion_presence');
        this.userService = new UserService(this.db);
        this.masterService = new MasterService(this.db);
        this.coursService = new CoursService(this.db);
        this.seanceService = new SeanceService(this.db);
        this.presenceService = new PresenceService(this.db);
        this.absenceService = new AbsenceService(this.db);
        this.inscriptionService = new InscriptionService(this.db);
        this.presenceRouter = new PresenceRouter(this.userService, this.masterService, this.coursService, this.seanceService, this.inscriptionService, this.presenceService, this.absenceService);
        //this.service = new BiblioService(this.db);
        //this.authorsRouter = new AuthorsRouter(this.service);
        //this.documentsRouter = new DocumentsRouter(this.service);
       
        this.app=express();
        this.config();
        this.routes();
    }

    config(){
        // 1. CORS - doit être en premier
        this.app.use(cors());
        
        // 2. Parsers du body - AVANT le logger pour que req.body soit disponible
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // 3. Logger - APRÈS les parsers pour pouvoir logger req.body
        this.app.use(requestLogger);
        
        // 4. Fichiers statiques - peut être n'importe où
        this.app.use(express.static('public'));

        

    }

    routes(){
        this.app.get('/',(req, res) =>{
            res.send('<h1>Serveur Express (Node.js)<h1>');//envoyer du HTML
        } )
        //this.app.use('/biblio/authors', this.authorsRouter.router);
        
        this.app.use('/presences', this.presenceRouter.router);
        this.app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ message: 'Internal Server Error' });
        });

        
        
        
    }

    start(callback){
        if(callback == undefined){
            callback =() => {
                console.log('Serveur démarré sous le N de port: '+this.port+'...')
            }
        }
        this.db.open().then(msg => {
            console.log(msg);
            this.app.listen(this.port,callback);
        })
        
    }
}

//exportation
module.exports=Server;