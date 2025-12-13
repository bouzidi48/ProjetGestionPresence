require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('🔧 Initialisation Cloudinary...');

cloudinary.config({
    cloud_name: 'dcahlc0rr',
    api_key: '438638928258536',
    api_secret: 'OiBpLVVhkRb6simI7IyDwa8jJqI'
});

console.log('📋 Configuration utilisée:');
console.log('   Cloud Name:', cloudinary.config().cloud_name);
console.log('   API Key:', cloudinary.config().api_key ? '✅ Défini' : '❌ Manquant');

// Vérification que toutes les variables sont définies
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERREUR: Variables d\'environnement Cloudinary manquantes!');
    console.error('Vérifiez votre fichier .env');
    process.exit(1);
}

// Test de connexion
(async () => {
    try {
        console.log('🔄 Test de connexion Cloudinary...');
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connecté avec succès:', result);
    } catch (error) {
        console.error('❌ ERREUR CLOUDINARY:', error.message);
        console.error('   Code HTTP:', error.error?.http_code);
        console.error('');
        console.error('🔧 Vérifiez vos credentials Cloudinary');
        console.error('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.error('   API Key:', process.env.CLOUDINARY_API_KEY?.substring(0, 5) + '...');
    }
})();

module.exports = cloudinary;