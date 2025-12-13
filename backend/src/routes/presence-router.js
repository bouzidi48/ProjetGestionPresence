// backend/src/routes/PresenceRouter.js
const { Router } = require('express');
const multer = require('multer');  // ← AJOUTER
const faceRecognitionService = require('../services/face-recognition-service');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config'); // Ajustez le chemin
const { uploadStudentPhoto,uploadJustificatif } = require('../config/multer.config');
const bcrypt = require('bcryptjs');
const { image } = require('../config/cloudinary.config');


class PresenceRouter {
    constructor(
        userService, 
        masterService, 
        coursService, 
        seanceService, 
        inscriptionService, 
        presenceService, 
        absenceService
    ) {
        // Services
        this.userService = userService;
        this.masterService = masterService;
        this.coursService = coursService;
        this.seanceService = seanceService;
        this.inscriptionService = inscriptionService;
        this.presenceService = presenceService;
        this.absenceService = absenceService;
        
        // Router
        this.router = new Router();
        this.endPoints();
    }

    endPoints() {
        // ============================================================
        // ROUTES USERS
        // ============================================================
        
        /**
         * GET /users - Récupérer tous les utilisateurs
         */
        this.router.get('/users', async (req, res) => {
            try {
                const users = await this.userService.getAllUsers();
                res.json({
                    success: true,
                    data: users
                });
            } catch (error) {
                console.error('Erreur récupération users:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des utilisateurs'
                });
            }
        });


        // Dans votre router
        this.router.post('/users/authenticate', async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await this.userService.authenticate(email, password);
        
                if (user) {
                    // 🔑 GÉNÉRER LE TOKEN JWT
                    const token = jwt.sign(
                        { 
                            userId: user.user_id,
                            email: user.email,
                            role: user.role
                        },
                        jwtConfig.jwtSecret,
                        { expiresIn: jwtConfig.jwtExpiration }
                    );

                    // ✅ RENVOYER TOKEN + USER
                    res.json({
                        success: true,
                        data: {
                            token: token,
                            user: user
                        }
                    });
                } else {
                    res.status(401).json({
                        success: false,
                        error: 'Identifiants incorrects'
                    });
                }
            } catch (error) {
                console.error('Erreur authentification user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de l\'authentification'
                });
            }
        });

        this.router.post('/users/register', 
            (req, res, next) => {
            console.log('🚪 Entrée dans la route /users/register');
            console.log('📦 Headers:', req.headers);
            next();
        },
            uploadStudentPhoto.single('photo'),
            (req, res, next) => {
                console.log('📦 APRÈS Multer:');
                console.log('   Body:', req.body);
                console.log('   File:', req.file);
                next();
            },
            async (req, res) => {
                console.log('🎯 Entrée dans le handler principal');
        
                try {
                    console.log('1️⃣ Récupération userData...');
                    const userData = req.body;
                    console.log('   userData:', userData);
    
                    console.log('2️⃣ Vérification du fichier...');
                    if (req.file) {
                        userData.image_faciale_path = req.file.path;
                        console.log('   ✅ Photo uploadée:', req.file.path);
                    } else {
                        console.log('   ⚠️ Aucun fichier uploadé');
                    }
    
                    console.log('3️⃣ Vérification rôle étudiant...');
                    if (userData.role === 'etudiant' && !req.file) {
                        console.log('   ❌ Photo obligatoire manquante');
                        return res.status(400).json({
                            success: false,
                            error: 'Une photo est obligatoire pour les étudiants'
                        });
                    }
    
                    console.log('4️⃣ Appel userService.register...');
                    console.log('   Données envoyées:', userData);
            
                    const userId = await this.userService.register(userData);
                    console.log(userId)
            
                    console.log('5️⃣ Utilisateur créé avec ID:', userId);
    
                    res.status(201).json({
                        success: true,
                        message: 'Utilisateur enregistré avec succès',
                        id: userId,
                        image_url: req.file ? req.file.path : null
                    });
            
                    console.log('6️⃣ Réponse envoyée avec succès');
            
                } catch (error) {
                    console.error('❌ ERREUR DANS LE TRY/CATCH');
                    console.error('   Message:', error.message);
                    console.error('   Stack:', error.stack);
                    console.error('   Erreur complète:', error);
    
                    // Supprimer la photo de Cloudinary en cas d'erreur
                    if (req.file && req.file.filename) {
                        console.log('🗑️ Tentative de suppression Cloudinary...');
                        try {
                            await cloudinary.uploader.destroy(req.file.filename);
                            console.log('   ✅ Photo supprimée');
                        } catch (deleteError) {
                            console.error('   ❌ Erreur suppression:', deleteError);
                        }
                    }
    
                    if (error.message && error.message.includes('email')) {
                        return res.status(409).json({
                            success: false,
                            error: error.message
                        });
                    }
    
                    res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors de l\'enregistrement de l\'utilisateur'
                    });
                }
            }
        );

        /**
         * GET /users/:id - Récupérer un utilisateur par ID
         */
        this.router.get('/users/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const user = await this.userService.getUserById(id);
                
                if (user) {
                    res.json({
                        success: true,
                        data: user
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Utilisateur introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de l\'utilisateur'
                });
            }
        });

        /**
         * GET /users/email/:email - Récupérer un utilisateur par email
         */
        this.router.get('/users/email/:email', async (req, res) => {
            try {
                const email = decodeURIComponent(req.params.email);
                const user = await this.userService.getUserByEmail(email);
                
                if (user) {
                    res.json({
                        success: true,
                        data: user
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Utilisateur introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération user par email:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de l\'utilisateur'
                });
            }
        });

        /**
         * GET /users/role/:role - Récupérer les utilisateurs par rôle
         */
        this.router.get('/users/role/:role', async (req, res) => {
            try {
                const role = req.params.role;
                const users = await this.userService.getUsersByRole(role);
                res.json({
                    success: true,
                    data: users
                });
            } catch (error) {
                console.error('Erreur récupération users par role:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des utilisateurs'
                });
            }
        });

        /**
         * GET /users/role/:role - Récupérer les utilisateurs par rôle actif
         */
        this.router.get('/users/roleactif/:role', async (req, res) => {
            try {
                const role = req.params.role;
                const users = await this.userService.getUsersByRoleActive(role);
                res.json({
                    success: true,
                    data: users
                });
            } catch (error) {
                console.error('Erreur récupération users par role:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des utilisateurs'
                });
            }
        });

        /**
         * Get /users/roleactif/:role/master/:master_id - Récupérer les utilisateurs par rôle actif et master
         */
        this.router.get('/users/roleactif/:role/master/:master_id', async (req, res) => {
            try {
                const role = req.params.role;
                const master_id = parseInt(req.params.master_id);
                const users = await this.userService.getUsersByRoleActiveAndMaster(role, master_id);
                res.json({
                    success: true,
                    data: users
                });
            } catch (error) {
                console.error('Erreur récupération users par role et master:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des utilisateurs'
                });
            }
        });

        /**
         * POST /users - Créer un nouvel utilisateur
         * Body: { nom, prenom, email, password_hash, role, image_faciale_path?, actif? }
         */
        this.router.post('/users', async (req, res) => {
            try {
                const userId = await this.userService.insertUser(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Utilisateur créé avec succès',
                    id: userId
                });
            } catch (error) {
                console.error('Erreur création user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création de l\'utilisateur'
                });
            }
        });

        /**
         * PUT /users/:id - Mettre à jour un utilisateur
         */
        this.router.put('/users/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.userService.updateUser({ ...req.body, id });
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Utilisateur mis à jour avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour user:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        /**
          * PUT /users/:id/change-password - Changer le mot de passe
        * Body: { currentPassword, newPassword }
        */
        this.router.put('/users/:id/change-password', async (req, res) => {
            try {
                const userId = parseInt(req.params.id);
                const { currentPassword, newPassword } = req.body;

                console.log('🔐 Changement de mot de passe pour user:', userId);

                // Validation
                if (!currentPassword || !newPassword) {
                    return res.status(400).json({
                        success: false,
                        error: 'Mot de passe actuel et nouveau mot de passe requis'
                    });
                }

                if (newPassword.length < 6) {
                    return res.status(400).json({
                        success: false,
                        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
                    });
                }

                // Récupérer l'utilisateur
                const user = await this.userService.getUserById(userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        error: 'Utilisateur introuvable'
                    });
                }

                
                const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        
                if (!isValidPassword) {
                    return res.status(401).json({
                        success: false,
                        error: 'Mot de passe actuel incorrect'
                    });
                }

                // Hasher le nouveau mot de passe
                const newPasswordHash = await bcrypt.hash(newPassword, 10);

                // Mettre à jour
                const success = await this.userService.updateUser({
                    id: userId,
                    nom : user.nom,
                    prenom : user.prenom,
                    email : user.email,
                    role : user.role,
                    image_faciale_path : user.image_faciale_path,
                    date_creation : user.date_creation,
                    actif : user.actif,
                    password_hash: newPasswordHash
                });

                if (success) {
                    console.log('✅ Mot de passe changé avec succès');
                    res.json({
                        success: true,
                        message: 'Mot de passe modifié avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('❌ Erreur changement mot de passe:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors du changement de mot de passe'
                });
            }
        });

        /**
        * PUT /users/:id/update-photo - Mettre à jour la photo de profil
        * Multipart form-data avec photo
        */
        this.router.put('/users/:id/update-photo', 
            uploadStudentPhoto.single('photo'),
            async (req, res) => {
                try {
                    const userId = parseInt(req.params.id);
            
                    console.log('📸 Mise à jour photo pour user:', userId);

                    if (!req.file) {
                        return res.status(400).json({
                            success: false,
                            error: 'Aucune photo fournie'
                        });
                    }

                    // Récupérer l'ancienne photo
                    const user = await this.userService.getUserById(userId);
                    const oldPhotoPath = user?.image_faciale_path;

                    // Mettre à jour avec la nouvelle photo

                    const success = await this.userService.updateUser({
                        id: userId,
                        nom : user.nom,
                        prenom : user.prenom,
                        email : user.email,
                        role : user.role,
                        image_faciale_path: req.file.path,
                        date_creation : user.date_creation,
                        actif : user.actif,
                        password_hash: user.password_hash
                    });

                    if (success) {
                        console.log('✅ Photo mise à jour:', req.file.path);

                        // Supprimer l'ancienne photo de Cloudinary (optionnel)
                        if (oldPhotoPath) {
                            try {
                                // Extraire le public_id depuis l'URL Cloudinary
                                const publicId = oldPhotoPath.split('/').slice(-2).join('/').split('.')[0];
                                await cloudinary.uploader.destroy(publicId);
                                console.log('🗑️ Ancienne photo supprimée de Cloudinary');
                            } catch (deleteError) {
                                console.error('⚠️ Erreur suppression ancienne photo:', deleteError);
                                // Ne pas bloquer la requête si la suppression échoue
                            }
                        }

                        // Récupérer l'utilisateur mis à jour
                        const updatedUser = await this.userService.getUserById(userId);

                        res.json({
                            success: true,
                            message: 'Photo mise à jour avec succès',
                            image_url: req.file.path,
                            user: updatedUser
                        });
                    } else {
                        // Supprimer la nouvelle photo si la mise à jour échoue
                        try {
                            await cloudinary.uploader.destroy(req.file.filename);
                        } catch (deleteError) {
                            console.error('⚠️ Erreur suppression photo:', deleteError);
                        }

                        res.status(400).json({
                            success: false,
                            error: 'Échec de la mise à jour'
                        });
                    }
                } catch (error) {
                    console.error('❌ Erreur mise à jour photo:', error);

                    // Nettoyer la photo uploadée en cas d'erreur
                    if (req.file && req.file.filename) {
                        try {
                            await cloudinary.uploader.destroy(req.file.filename);
                        } catch (deleteError) {
                            console.error('⚠️ Erreur suppression photo:', deleteError);
                        }
                    }

                    res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors de la mise à jour de la photo'
                    });
                }
            }
        );

        /**
         * DELETE /users/:id - Supprimer un utilisateur
         */
        this.router.delete('/users/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.userService.deleteUser(id);
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Utilisateur supprimé avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression user:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression de l\'utilisateur'
                });
            }
        });

        /**
         * PUT /users/:id/activate - Activer un utilisateur
         */
        this.router.put('/users/:id/activate', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.userService.activateUser(id);
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Utilisateur activé avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de l\'activation'
                    });
                }
            } catch (error) {
                console.error('Erreur activation user:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        

        /**
         * PUT /users/:id/deactivate - Désactiver un utilisateur
         */
        this.router.put('/users/:id/deactivate', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.userService.deactivateUser(id);
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Utilisateur désactivé avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la désactivation'
                    });
                }
            } catch (error) {
                console.error('Erreur désactivation user:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // ============================================================
        // ROUTES MASTERS
        // ============================================================

        /**
         * GET /masters - Récupérer tous les masters
         */
        this.router.get('/masters', async (req, res) => {
            try {
                const masters = await this.masterService.getAllMasters();
                console.log(masters)
                res.json({
                    success: true,
                    data: masters
                });
            } catch (error) {
                console.error('Erreur récupération masters:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des masters'
                });
            }
        });

        /**
         * GET /masters/:id - Récupérer un master par ID
         */
        this.router.get('/masters/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const master = await this.masterService.getMasterById(id);
                
                if (master) {
                    res.json({
                        success: true,
                        data: master
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Master introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération master:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération du master'
                });
            }
        });

        /**
         * GET /masters/code/:code - Récupérer un master par code
         */
        this.router.get('/masters/code/:code', async (req, res) => {
            try {
                const code = req.params.code;
                const master = await this.masterService.getMasterByCode(code);
                
                if (master) {
                    res.json({
                        success: true,
                        data: master
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Master introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération master par code:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération du master'
                });
            }
        });

        /**
         * GET /masters/responsable/:responsable_id - Récupérer les masters d'un responsable
         */
        this.router.get('/masters/responsable/:responsable_id', async (req, res) => {
            try {
                const responsable_id = parseInt(req.params.responsable_id);
                const masters = await this.masterService.getMastersByResponsable(responsable_id);
                res.json({
                    success: true,
                    data: masters
                });
            } catch (error) {
                console.error('Erreur récupération masters par responsable:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des masters'
                });
            }
        });

        /**
         * POST /masters - Créer un nouveau master
         * Body: { nom, code, responsable_id, annee_universitaire }
         */
        this.router.post('/masters', async (req, res) => {
            try {
                const masterId = await this.masterService.insertMaster(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Master créé avec succès',
                    id: masterId
                });
            } catch (error) {
                console.error('Erreur création master:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création du master'
                });
            }
        });

        /**
         * PUT /masters/:id - Mettre à jour un master
         */
        this.router.put('/masters/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.masterService.updateMaster({ ...req.body, id });
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Master mis à jour avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour master:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        /**
         * DELETE /masters/:id - Supprimer un master
         */
        this.router.delete('/masters/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.masterService.deleteMaster(id);
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Master supprimé avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression master:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression du master'
                });
            }
        });

        // ============================================================
        // ROUTES COURS
        // ============================================================

        /**
         * GET /cours - Récupérer tous les cours
         */
        this.router.get('/cours', async (req, res) => {
            try {
                const cours = await this.coursService.getAllCours();
                res.json({
                    success: true,
                    data: cours
                });
            } catch (error) {
                console.error('Erreur récupération cours:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des cours'
                });
            }
        });

        /**
         * GET /cours/:id - Récupérer un cours par ID
         */
        this.router.get('/cours/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const cours = await this.coursService.getCoursById(id);
                
                if (cours) {
                    res.json({
                        success: true,
                        data: cours
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Cours introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération cours:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération du cours'
                });
            }
        });

        /**
         * GET /cours/code/:code - Récupérer un cours par code
         */
        this.router.get('/cours/code/:code', async (req, res) => {
            try {
                const code = req.params.code;
                const cours = await this.coursService.getCoursByCode(code);
                
                if (cours) {
                    res.json({
                        success: true,
                        data: cours
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Cours introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération cours par code:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération du cours'
                });
            }
        });

        /**
         * GET /cours/master/:master_id - Récupérer les cours d'un master
         */
        this.router.get('/cours/master/:master_id', async (req, res) => {
            try {
                const master_id = parseInt(req.params.master_id);
                const cours = await this.coursService.getCoursByMaster(master_id);
                res.json({
                    success: true,
                    data: cours
                });
            } catch (error) {
                console.error('Erreur récupération cours par master:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des cours'
                });
            }
        });

        /**
         * Get /cours/${coursId}/etudiants - Récupérer les étudiants inscrits à un cours
         */
        this.router.get('/cours/:coursId/etudiants', async (req, res) => {
            try {
                const coursId = parseInt(req.params.coursId);
                const etudiants = await this.coursService.getEtudiantsByCoursId(coursId);
                res.json({
                    success: true,
                    data: etudiants
                });
            }
            catch (error) {
                console.error('Erreur récupération étudiants par cours:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des étudiants'
                });
            }
        });

        /**
         * GET /cours/professeur/:professeur_id - Récupérer les cours d'un professeur
         */
        this.router.get('/cours/professeur/:professeur_id', async (req, res) => {
            try {
                const professeur_id = parseInt(req.params.professeur_id);
                const cours = await this.coursService.getCoursByProfesseur(professeur_id);
                res.json({
                    success: true,
                    data: cours
                });
            } catch (error) {
                console.error('Erreur récupération cours par professeur:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des cours'
                });
            }
        });

        /**
         * POST /cours - Créer un nouveau cours
         * Body: { nom, code, master_id, professeur_id?, description? }
         */
        this.router.post('/cours', async (req, res) => {
            try {
                const coursId = await this.coursService.insertCours(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Cours créé avec succès',
                    id: coursId
                });
            } catch (error) {
                console.error('Erreur création cours:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création du cours'
                });
            }
        });

        /**
         * PUT /cours/:id - Mettre à jour un cours
         */
        this.router.put('/cours/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.coursService.updateCours({ ...req.body, id });
                if (success) {
                    res.json({
                        success: true,
                        message: 'Cours mis à jour avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour cours:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        /**
         * DELETE /cours/:id - Supprimer un cours
         */
        this.router.delete('/cours/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.coursService.deleteCours(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Cours supprimé avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression cours:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression du cours'
                });
            }
        });

        /*
            * PUT /cours/:id/affecter-professeur - Affecter un professeur à un cours
            Body: { professeur_id }
            */
        this.router.put('/cours/:id/affecter-professeur', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const { professeur_id } = req.body;
                const success = await this.coursService.affecterProfesseur(id, professeur_id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Professeur affecté au cours avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de l\'affectation'
                    });
                }
            } catch (error) {
                console.error('Erreur affectation professeur au cours:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        // ============================================================
        // ROUTES SEANCES
        // ============================================================
        /**
         * GET /seances - Récupérer toutes les séances
         */
        this.router.get('/seances', async (req, res) => {
            try {
                const seances = await this.seanceService.getAllSeances();
                res.json({
                    success: true,
                    data: seances
                });
            } catch (error) {
                console.error('Erreur récupération seances:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des séances'
                });
            }
        });

        /**
         * GET /seances/cours/:cours_id - Récupérer les séances d'un cours
         */
        this.router.get('/seances/cours/:cours_id', async (req, res) => {
            try {
                const cours_id = parseInt(req.params.cours_id);
                const seances = await this.seanceService.getSeancesByCours(cours_id);
                
                res.json({
                    success: true,
                    data: seances
                });
            }
            catch (error) {
                console.error('Erreur récupération séances par cours:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des séances'
                });
            }
        });

        /**
         * GET /seances/:id - Récupérer une séance par ID
         */
        this.router.get('/seances/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const seance = await this.seanceService.getSeanceById(id);
                if (seance) {
                    res.json({
                        success: true,
                        data: seance
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Séance introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération seance:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de la séance'
                });
            }
        });

        /**
         * POST /seances - Créer une nouvelle séance
         * Body: { cours_id, date_seance, heure_debut, heure_fin, presence_effectuee? }
         */
        this.router.post('/seances', async (req, res) => {
            try {
                const seanceId = await this.seanceService.insertSeance(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Séance créée avec succès',
                    id: seanceId
                });
            } catch (error) {
                console.error('Erreur création seance:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création de la séance'
                });
            }
        });
        /**
         * PUT /seances/:id - Mettre à jour une séance
         * Body: { cours_id, date_seance, heure_debut, heure_fin, presence_effectuee }
         */
        this.router.put('/seances/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.seanceService.updateSeance({ ...req.body, id });
                if (success) {
                    res.json({
                        success: true,
                        message: 'Séance mise à jour avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour seance:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /**
         * DELETE /seances/:id - Supprimer une séance
         */
        this.router.delete('/seances/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.seanceService.deleteSeance(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Séance supprimée avec succès'
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression seance:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression de la séance'
                });
            }
        });
        /**
         * PUT /seances/:id/marquer-presence - Marquer la présence comme effectuée pour une séance
         */
        this.router.put('/seances/:id/marquer-presence', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.seanceService.marquerPresenceEffectuee(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Présence marquée comme effectuée avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur marquage présence effectuée:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        // ============================================================
        // ROUTES PRESENCES
        // ============================================================
        /**
         * GET /presences - Récupérer toutes les présences
         */
        this.router.get('/presences', async (req, res) => {
            try {
                const presences = await this.presenceService.getAllPresences();
                res.json({
                    success: true,
                    data: presences
                });
            } catch (error) {
                console.error('Erreur récupération presences:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des présences'
                });
            }
        });

        /**
         * GET /presences/:id - Récupérer une présence par ID
         */
        this.router.get('/presences/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const presence = await this.presenceService.getPresenceById(id);
                if (presence) {
                    res.json({
                        success: true,
                        data: presence
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Présence introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération présence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de la présence'
                });
            }
        });
        /**
         * GET /presences/seance/:seance_id - Récupérer les présences d'une séance
         */
        this.router.get('/presences/seance/:seance_id', async (req, res) => {
            try {
                const seance_id = parseInt(req.params.seance_id);
                const presences = await this.presenceService.getPresencesBySeance(seance_id);
                res.json({
                    success: true,
                    data: presences
                });
            } catch (error) {
                console.error('Erreur récupération présences par séance:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des présences'
                });
            }
        });
        /**
         * GET /presences/etudiant/:etudiant_id - Récupérer les présences d'un étudiant
         */
        this.router.get('/presences/etudiant/:etudiant_id', async (req, res) => {
            try {
                const etudiant_id = parseInt(req.params.etudiant_id);
                const presences = await this.presenceService.getPresencesByEtudiant(etudiant_id);
                res.json({
                    success: true,
                    data: presences
                });
            } catch (error) {
                console.error('Erreur récupération présences par étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des présences'
                });
            }
        });

        /**
         * POST /presences - Créer une nouvelle présence
         * Body: { seance_id, etudiant_id, present }
         */
        this.router.post('/presences', async (req, res) => {
            try {
                const presenceId = await this.presenceService.insertPresence(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Présence créée avec succès',
                    id: presenceId
                });
            } catch (error) {
                console.error('Erreur création présence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création de la présence'
                });
            }
        });
        /**
         * Get /presences/cours/:cours_id/etudiant/:etudiant_id - Récupérer la présence d'un étudiant pour un cours donné
         */
        this.router.get('/presences/cours/:cours_id/etudiant/:etudiant_id', async (req, res) => {
            try {
                const cours_id = parseInt(req.params.cours_id);
                const etudiant_id = parseInt(req.params.etudiant_id);
                const presence = await this.presenceService.getPresenceByCoursAndEtudiant(cours_id, etudiant_id);
                if (presence) {
                    res.json({
                        success: true,
                        data: presence
                    });
                }
                else {
                    res.status(404).json({
                        success: false,
                        error: 'Présence introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération présence par cours et étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de la présence'
                });
            }
        });

        /**
         * Get /presences/seance/:seance_id/etudiant/:etudiant_id - Récupérer la présence d'un étudiant pour un cours donné
         */
        this.router.get('/presences/seance/:seance_id/etudiant/:etudiant_id', async (req, res) => {
            try {
                const seance_id = parseInt(req.params.seance_id);
                const etudiant_id = parseInt(req.params.etudiant_id);
                const presence = await this.presenceService.getPresenceBySeanceAndEtudiant(seance_id, etudiant_id);
                if (presence) {
                    res.json({
                        success: true,
                        data: presence
                    });
                }
                else {
                    res.status(404).json({
                        success: false,
                        error: 'Présence introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération présence par cours et étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de la présence'
                });
            }
        });
        /**
         * PUT /presences/:id - Mettre à jour une présence
         * Body: { seance_id, etudiant_id, present }
         */
        this.router.put('/presences/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.presenceService.updatePresence({ ...req.body, id });
                if (success) {
                    res.json({
                        success: true,
                        message: 'Présence mise à jour avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour présence:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /**
         * DELETE /presences/:id - Supprimer une présence
         */
        this.router.delete('/presences/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.presenceService.deletePresence(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Présence supprimée avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression présence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression de la présence'
                });
            }
        });

        // ============================================================
        // ROUTES RECONNAISSANCE FACIALE
        // ============================================================
        
        // Dans PresenceRouter.js, remplacez la route /face-recognition/identify par :

        this.router.post('/face-recognition/identify', uploadStudentPhoto.single('photo'), async (req, res) => {
            try {
                const { seance_id, cours_id } = req.body;
        
                // ✅ AVEC CLOUDINARY : l'image est déjà uploadée
                if (!req.file) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Aucune photo fournie' 
                    });
                }

                // L'URL Cloudinary de l'image uploadée
                const capturedImageUrl = req.file.path; // URL Cloudinary
                console.log('📸 Image capturée uploadée:', capturedImageUrl);

                // Récupérer les étudiants du cours avec leurs images
                const etudiants = await this.coursService.getEtudiantsByCoursId(parseInt(cours_id));
        
                const etudiantsAvecImages = etudiants.filter(e => e.image_faciale_path != null);

                if (etudiantsAvecImages.length === 0) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Aucun étudiant avec photo trouvé pour ce cours' 
                    });
                }

                // ✅ Passer l'URL Cloudinary au service
                const matchedStudent = await faceRecognitionService.findMatchingStudent(
                    capturedImageUrl,  // URL au lieu du buffer
                    etudiantsAvecImages
                );

                if (!matchedStudent) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Aucune correspondance trouvée',
                        message: 'Le visage ne correspond à aucun étudiant inscrit'
                    });
                }

                // Vérifier si la présence n'a pas déjà été enregistrée
                const existingPresence = await this.presenceService.getPresenceBySeanceAndEtudiant(
                    parseInt(seance_id), 
                    matchedStudent.id
                );

                if (existingPresence) {
                    return res.status(400).json({
                        success: false,
                        error: 'Présence déjà enregistrée',
                        etudiant: matchedStudent
                    });
                }

                res.json({
                    success: true,
                    etudiant: {
                        id: matchedStudent.id,
                        nom: matchedStudent.nom,
                        prenom: matchedStudent.prenom,
                        email: matchedStudent.email,
                        image : matchedStudent.image_faciale_path,
                        similarity: matchedStudent.similarity
                    }
                });

            } catch (error) {
                console.error('Erreur reconnaissance faciale:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        
        // ============================================================
        // ROUTES ABSENCES
        // ============================================================
        /**
         * GET /absences/non-justifiees - Récupérer toutes les absences non justifiées
         */
        this.router.get('/absences/non-justifiees', async (req, res) => {
            console.log('Absences non justifiées récupérées:');
            try {
                console.log('Absences non justifiées récupérées:');
                const absences = await this.absenceService.getAllAbsencesNonJustifiees();
                console.log('Absences non justifiées récupérées:');
                console.log(absences);
                if (absences.length === 0) {
                    return res.status(404).json({
                        success: true,
                        message: 'Aucune absence non justifiée trouvée',
                        data: []
                    });
                }
                
                
                res.json({
                    success: true,
                    data: absences
                });
            } catch (error) {
                console.error('Erreur récupération absences non justifiées:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });
        /**
        * POST /absences - Créer une nouvelle absence
        */
        this.router.post('/absences', async (req, res) => {
            try {
                const absenceId = await this.absenceService.insertAbsence(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Absence créée avec succès',
                    id: absenceId
                });
            } catch (error) {
                console.error('Erreur création absence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création de l\'absence'
                });
            }
        });
        
        /**
         * GET /absences - Récupérer toutes les absences
         */
        this.router.get('/absences', async (req, res) => {
            try {
                const absences = await this.absenceService.getAllAbsences();
                res.json({
                    success: true,
                    data: absences
                });
            } catch (error) {
                console.error('Erreur récupération absences:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });

        /**
         * GET /absences/:id - Récupérer une absence par ID
         */
        this.router.get('/absences/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const absence = await this.absenceService.getAbsenceById(id);
                if (absence) {
                    res.json({
                        success: true,
                        data: absence
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Absence introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération absence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de l\'absence'
                });
            }
        });
        /**
         * GET /absences/etudiant/:etudiant_id - Récupérer les absences d'un étudiant
         */
        this.router.get('/absences/etudiant/:etudiant_id', async (req, res) => {
            try {
                const etudiant_id = parseInt(req.params.etudiant_id);
                const absences = await this.absenceService.getAbsencesByEtudiant(etudiant_id);
                res.json({
                    success: true,
                    data: absences
                });
            }
            catch (error) {
                console.error('Erreur récupération absences par étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });

        /**
         * GET /absences/etudiant/:etudiant_id/justifier - Récupérer les absences d'un étudiant
         */
        this.router.get('/absences/etudiant/:etudiant_id/justifier', async (req, res) => {
            try {
                const etudiant_id = parseInt(req.params.etudiant_id);
                const absences = await this.absenceService.getAbsencesByEtudiantJustifier(etudiant_id);
                res.json({
                    success: true,
                    data: absences
                });
            }
            catch (error) {
                console.error('Erreur récupération absences par étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });

        /**
         * GET /absences/etudiant/:etudiant_id/nonjustifier - Récupérer les absences d'un étudiant
         */
        this.router.get('/absences/etudiant/:etudiant_id/nonjustifier', async (req, res) => {
            try {
                const etudiant_id = parseInt(req.params.etudiant_id);
                const absences = await this.absenceService.getAbsencesByEtudiantNonJustifier(etudiant_id);
                res.json({
                    success: true,
                    data: absences
                });
            }
            catch (error) {
                console.error('Erreur récupération absences par étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });

        /**
         * GET /absences/etudiant/:etudiant_id/en_attente - Récupérer les absences d'un étudiant
         */
        this.router.get('/absences/etudiant/:etudiant_id/en_attente', async (req, res) => {
            try {
                const etudiant_id = parseInt(req.params.etudiant_id);
                const absences = await this.absenceService.getAbsencesByEtudiantEnAttente(etudiant_id);
                console.log(absences);
                res.json({
                    success: true,
                    data: absences
                });
            }
            catch (error) {
                console.error('Erreur récupération absences par étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });
        
        /**
         * Get /absences/cours/:cours_id/etudiant/:etudiant_id - Récupérer l'absence d'un étudiant pour un cours donné
         */
        this.router.get('/absences/cours/:cours_id/etudiant/:etudiant_id', async (req, res) => {
            try {
                const cours_id = parseInt(req.params.cours_id);
                const etudiant_id = parseInt(req.params.etudiant_id);
                const absence = await this.absenceService.getAbsenceByCoursAndEtudiant(cours_id, etudiant_id);
                if (absence) {
                    res.json({
                        success: true,
                        data: absence
                    });
                }
                else {
                    res.status(404).json({
                        success: false,
                        error: 'Absence introuvable'
                    });
                }
            } catch (error) {
                console.error('Erreur récupération absence par cours et étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération de l\'absence'
                });
            }
        });
        /*
            * GET /absences/seance/:seance_id - Récupérer les absences d'une séance
            */
        this.router.get('/absences/seance/:seance_id', async (req, res) => {
            try {
                const seance_id = parseInt(req.params.seance_id);
                const absences = await this.absenceService.getAbsencesBySeance(seance_id);
                res.json({
                    success: true,
                    data: absences
                });
            } catch (error) {
                console.error('Erreur récupération absences par séance:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });
        /*
            * GET /absences/presence/:presence_id - Récupérer les absences d'une présence
            */
        this.router.get('/absences/presence/:presence_id', async (req, res) => {
            try {
                const presence_id = parseInt(req.params.presence_id);
                const absences = await this.absenceService.getAbsencesByPresence(presence_id);
                res.json({
                    success: true,
                    data: absences
                });
            } catch (error) {
                console.error('Erreur récupération absences par présence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des absences'
                });
            }
        });   
        
        
        /**
         * PUT /absences/:id - Mettre à jour une absence
         * Body: { presence_id, etudiant_id, seance_id, justifiee, fichier_justificatif_path, date_soumission_justificatif, commentaire_responsable }
         */
        this.router.put('/absences/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.absenceService.updateAbsence({ ...req.body, id });
                if (success) {
                    res.json({
                        success: true,
                        message: 'Absence mise à jour avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour absence:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /**
         * DELETE /absences/:id - Supprimer une absence
         */
        this.router.delete('/absences/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.absenceService.deleteAbsence(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Absence supprimée avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression absence:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression de l\'absence'
                });
            }
        });

        /**
        * POST /absences/:id/upload-justificatif - Upload justificatif avec Cloudinary
        */
            this.router.post('/absences/:id/upload-justificatif', 
                uploadJustificatif.single('justificatif'), // ← Multer + Cloudinary
            async (req, res) => {
                try {
                    const absenceId = parseInt(req.params.id);
            
                    console.log('📤 Upload justificatif pour absence:', absenceId);
                    console.log('   Fichier:', req.file);

                    if (!req.file) {
                        return res.status(400).json({
                            success: false,
                            error: 'Aucun fichier fourni'
                        });
                    }

                    // Vérifier que l'absence existe
                    const absence = await this.absenceService.getAbsenceById(absenceId);
            
                    if (!absence) {
                        // Supprimer le fichier uploadé si l'absence n'existe pas
                        try {
                            const publicId = req.file.filename; // Le public_id Cloudinary
                            await cloudinary.uploader.destroy(publicId);
                        } catch (err) {
                            console.error('Erreur suppression fichier:', err);
                        }
                
                        return res.status(404).json({
                            success: false,
                            error: 'Absence introuvable'
                        });
                    }

                    // Mettre à jour l'absence avec l'URL Cloudinary
                    const success = await this.absenceService.soumettreJustificatif(
                        absenceId, 
                        req.file.path // ← URL Cloudinary (https://res.cloudinary.com/...)
                    );

                    if (success) {
                        console.log('✅ Justificatif uploadé:', req.file.path);
                
                        res.json({
                            success: true,
                            message: 'Justificatif soumis avec succès',
                            fichier_url: req.file.path
                        });
                    } else {
                        // Supprimer le fichier si la mise à jour échoue
                        try {
                            await cloudinary.uploader.destroy(req.file.filename);
                        } catch (err) {
                            console.error('Erreur suppression fichier:', err);
                        }
                
                        res.status(400).json({
                            success: false,
                            error: 'Échec de la soumission'
                        });
                    }
                } catch (error) {
                    console.error('❌ Erreur upload justificatif:', error);
            
                    // Nettoyer le fichier en cas d'erreur
                    if (req.file && req.file.filename) {
                        try {
                            await cloudinary.uploader.destroy(req.file.filename);
                        } catch (err) {
                            console.error('Erreur suppression fichier:', err);
                        }
                    }
            
                    res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors de l\'upload du justificatif'
            }       );
                }
            }
        );
        /*
            * POST /absences/:id/soumettre-justificatif - Soumettre un justificatif pour une absence
            */
        this.router.post('/absences/:id/soumettre-justificatif', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const { fichier_path } = req.body;
                const success = await this.absenceService.soumettreJustificatif(id, fichier_path);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Justificatif soumis avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la soumission du justificatif'
                    });
                }
            } catch (error) {
                console.error('Erreur soumission justificatif:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /*
            * POST /absences/:id/valider-justificatif - Valider un justificatif pour une absence
            */
        this.router.post('/absences/:id/valider-justificatif', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const { commentaire } = req.body;
                const success = await this.absenceService.validerJustificatif(id, commentaire);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Justificatif validé avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la validation du justificatif'
                    });
                }
            } catch (error) {
                console.error('Erreur validation justificatif:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /*
            * POST /absences/:id/rejeter-justificatif - Rejeter un justificatif pour une absence
            */
        this.router.post('/absences/:id/rejeter-justificatif', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const { commentaire } = req.body;
                const success = await this.absenceService.rejeterJustificatif(id, commentaire);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Justificatif rejeté avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec du rejet du justificatif'
                    });
                }
            } catch (error) {
                console.error('Erreur rejet justificatif:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // ============================================================
        // INSCRIPTIONS ROUTES
        // ============================================================
        /**
         * GET /inscriptions - Récupérer toutes les inscriptions
         */
        this.router.get('/inscriptions', async (req, res) => {
            try {
                const inscriptions = await this.inscriptionService.getAllInscriptions();
                res.json({
                    success: true,
                    data: inscriptions
                });
            }
            catch (error) {
                console.error('Erreur récupération inscriptions:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des inscriptions'
                });
            }
        });
            /**
             * GET /inscriptions/:id - Récupérer une inscription par ID
             */
            this.router.get('/inscriptions/:id', async (req, res) => {
                try {
                    const id = parseInt(req.params.id);
                    const inscription = await this.inscriptionService.getInscriptionById(id);
                    if (inscription) {
                        res.json({
                            success: true,
                            data: inscription
                        });
                    } else {
                        res.status(404).json({
                            success: false,
                            error: 'Inscription introuvable'
                        });
                    }
                } catch (error) {
                    console.error('Erreur récupération inscription:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Erreur lors de la récupération de l\'inscription'
                    });
                }
            });
        /**
         * GET /inscriptions/etudiant/:etudiant_id - Récupérer les inscriptions d'un étudiant
         */
        this.router.get('/inscriptions/etudiant/:etudiant_id', async (req, res) => {
            try {
                const etudiant_id = parseInt(req.params.etudiant_id);
                const inscriptions = await this.inscriptionService.getInscriptionsByEtudiant(etudiant_id);
                res.json({
                    success: true,
                    data: inscriptions
                });
            }
            catch (error) {
                console.error('Erreur récupération inscriptions par étudiant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des inscriptions'
                });
            }
        });
        /**
         * GET /inscriptions/master/:master_id - Récupérer les inscriptions d'un master
         */
        this.router.get('/inscriptions/master/:master_id', async (req, res) => {
            try {
                const master_id = parseInt(req.params.master_id);
                const inscriptions = await this.inscriptionService.getInscriptionsByMaster(master_id);
                res.json({
                    success: true,
                    data: inscriptions
                });
            }
            catch (error) {
                console.error('Erreur récupération inscriptions par master:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des inscriptions'
                });
            }
        });
        /**
         * GET /inscriptions/statut/:statut - Récupérer les inscriptions par statut
         */
        this.router.get('/inscriptions/statut/:statut', async (req, res) => {
            try {
                const statut = req.params.statut;
                const inscriptions = await this.inscriptionService.getInscriptionsByStatut(statut);
                res.json({
                    success: true,
                    data: inscriptions
                });
            }
            catch (error) {
                console.error('Erreur récupération inscriptions par statut:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la récupération des inscriptions'
                });
            }
        });
        /**
         * POST /inscriptions - Créer une nouvelle inscription
         * Body: { etudiant_id, master_id, statut? }
         */
        this.router.post('/inscriptions', async (req, res) => {
            try {
                const inscriptionId = await this.inscriptionService.insertInscription(req.body);
                res.status(201).json({
                    success: true,
                    message: 'Inscription créée avec succès',
                    id: inscriptionId
                });
            }
            catch (error) {
                console.error('Erreur création inscription:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création de l\'inscription'
                });
            }
        });
        /**
         * PUT /inscriptions/:id - Mettre à jour une inscription
         * Body: { etudiant_id, master_id, statut }
         */
        this.router.put('/inscriptions/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.inscriptionService.updateInscription({ ...req.body, id });
                if (success) {
                    res.json({
                        success: true,
                        message: 'Inscription mise à jour avec succès'
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la mise à jour'
                    });
                }
            } catch (error) {
                console.error('Erreur mise à jour inscription:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /**
         * DELETE /inscriptions/:id - Supprimer une inscription
            */
        this.router.delete('/inscriptions/:id', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.inscriptionService.deleteInscription(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Inscription supprimée avec succès'
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la suppression'
                    });
                }
            } catch (error) {
                console.error('Erreur suppression inscription:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la suppression de l\'inscription'
                });
            }
        });
        /**
         * POST /inscriptions/:id/valider - Valider une inscription
         */
        this.router.post('/inscriptions/:id/valider', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.inscriptionService.validerInscription(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Inscription validée avec succès'
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec de la validation'
                    });
                }
            } catch (error) {
                console.error('Erreur validation inscription:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        /**
         * POST /inscriptions/:id/rejeter - Rejeter une inscription
         */
        this.router.post('/inscriptions/:id/rejeter', async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const success = await this.inscriptionService.rejeterInscription(id);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Inscription rejetée avec succès'
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        error: 'Échec du rejet'
                    });
                }
            } catch (error) {
                console.error('Erreur rejet inscription:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // ============================================================
        // FIN ROUTES
        // ============================================================
    }
}
module.exports = PresenceRouter;