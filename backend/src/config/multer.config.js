const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary.config');

// Storage pour les photos d'étudiants
const studentPhotoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gestion-presence/etudiants',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' }
        ],
        public_id: (req, file) => {
            return `etudiant_${Date.now()}`;
        }
    }
});

// Storage pour les justificatifs d'absence
const justificatifStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gestion-presence/justificatifs',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
        public_id: (req, file) => {
            return `justificatif_${Date.now()}`;
        }
    }
});

// ✅ CORRECTION : fileFilter amélioré
const uploadStudentPhoto = multer({
    storage: studentPhotoStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        console.log('📎 Fichier reçu:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });

        // Liste des MIME types acceptés
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/heic',     // iPhone
            'image/heif',     // iPhone
            'application/octet-stream' // Parfois envoyé par Flutter
        ];

        // Vérifier le MIME type
        if (allowedMimeTypes.includes(file.mimetype)) {
            console.log('✅ Type MIME accepté:', file.mimetype);
            cb(null, true);
        } 
        // Vérifier l'extension si MIME type non reconnu
        else if (file.originalname) {
            const extension = file.originalname.toLowerCase().split('.').pop();
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
            
            if (allowedExtensions.includes(extension)) {
                console.log('✅ Extension acceptée:', extension);
                cb(null, true);
            } else {
                console.error('❌ Type de fichier non autorisé:', file.mimetype, extension);
                cb(new Error(`Seules les images sont autorisées (reçu: ${file.mimetype})`), false);
            }
        } else {
            console.error('❌ Type de fichier non autorisé:', file.mimetype);
            cb(new Error(`Seules les images sont autorisées (reçu: ${file.mimetype})`), false);
        }
    }
});

const uploadJustificatif = multer({
    storage: justificatifStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        console.log('📎 Justificatif reçu:', {
            originalname: file.originalname,
            mimetype: file.mimetype
        });

        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
            'application/octet-stream'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const extension = file.originalname.toLowerCase().split('.').pop();
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
            
            if (allowedExtensions.includes(extension)) {
                cb(null, true);
            } else {
                cb(new Error(`Type de fichier non autorisé (reçu: ${file.mimetype})`), false);
            }
        }
    }
});

module.exports = {
    uploadStudentPhoto,
    uploadJustificatif,
    cloudinary
};