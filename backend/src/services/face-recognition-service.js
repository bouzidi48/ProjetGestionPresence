const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
const fs = require('fs').promises;
const path = require('path');

// Patch pour face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FaceRecognitionService {
  constructor() {
    this.initialized = false;
    this.modelPath = path.join(__dirname, '../../face-models');
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath);
      
      this.initialized = true;
      console.log('✅ Modèles de reconnaissance faciale chargés');
    } catch (error) {
      console.error('❌ Erreur chargement modèles:', error);
      throw error;
    }
  }

  // ✅ NOUVELLE MÉTHODE : Télécharger image depuis URL avec fetch
  async downloadImageFromUrl(imageUrl) {
    try {
      console.log('📥 Téléchargement de l\'image:', imageUrl);
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      
      // Récupérer les données comme ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Convertir en Buffer Node.js
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('❌ Erreur téléchargement image:', error.message);
      throw new Error(`Impossible de télécharger l'image: ${error.message}`);
    }
  }

  // ✅ MÉTHODE MODIFIÉE : Accepte Buffer OU URL
  async extractFaceDescriptor(imageInput) {
    await this.initialize();
    
    let imageBuffer;
    
    // Si c'est une URL, télécharger d'abord
    if (typeof imageInput === 'string') {
      imageBuffer = await this.downloadImageFromUrl(imageInput);
    } else {
      imageBuffer = imageInput;
    }
    
    const img = await canvas.loadImage(imageBuffer);
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      throw new Error('Aucun visage détecté dans l\'image');
    }
    
    return detection.descriptor;
  }

  async compareFaces(descriptor1, descriptor2) {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const threshold = 0.6; // Seuil de similarité
    
    return {
      match: distance < threshold,
      distance: distance,
      similarity: Math.round((1 - distance) * 100) // % de similarité
    };
  }

  // ✅ MÉTHODE MODIFIÉE : Accepte URL au lieu de Buffer
  async findMatchingStudent(capturedImageUrl, studentsWithImages) {
    console.log('🔍 Recherche de correspondance faciale...');
    
    // Extraire le descripteur de l'image capturée
    const capturedDescriptor = await this.extractFaceDescriptor(capturedImageUrl);
    
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const student of studentsWithImages) {
      try {
        console.log(`👤 Comparaison avec ${student.prenom} ${student.nom}...`);
        
        // Extraire le descripteur de l'image de l'étudiant (depuis Cloudinary)
        const studentDescriptor = await this.extractFaceDescriptor(student.image_faciale_path);
        
        const comparison = await this.compareFaces(capturedDescriptor, studentDescriptor);
        
        console.log(`   ➜ Distance: ${comparison.distance.toFixed(3)}, Similarité: ${comparison.similarity}%`);
        
        if (comparison.match && comparison.distance < bestDistance) {
          bestDistance = comparison.distance;
          bestMatch = {
            ...student,
            similarity: comparison.similarity,
            distance: comparison.distance
          };
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${student.prenom} ${student.nom}:`, error.message);
        continue; // Passer à l'étudiant suivant
      }
    }

    if (bestMatch) {
      console.log(`✅ Correspondance trouvée: ${bestMatch.prenom} ${bestMatch.nom} (${bestMatch.similarity}%)`);
    } else {
      console.log('❌ Aucune correspondance trouvée');
    }

    return bestMatch;
  }
}

module.exports = new FaceRecognitionService();