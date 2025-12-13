const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('=================================');
    console.log('Mot de passe:', password);
    console.log('Hash généré:', hash);
    console.log('=================================');
    
    // Test de vérification
    const isValid = await bcrypt.compare(password, hash);
    console.log('Vérification:', isValid ? '✅ VALIDE' : '❌ INVALIDE');
}

generateHash();