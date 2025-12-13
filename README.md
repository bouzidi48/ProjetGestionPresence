# ProjetGestionPresence
# 🎓 Système de Gestion de Présence - Reconnaissance Faciale

## 📋 Description

Système complet de gestion de présence pour établissements d'enseignement supérieur utilisant la reconnaissance faciale pour l'enregistrement automatique des présences et la gestion des absences avec justificatifs.

### ✨ Fonctionnalités

- 📱 **Application Mobile Flutter** - Étudiants
  - Inscription avec photo faciale
  - Consultation présences/absences
  - Soumission de justificatifs
  - Statistiques personnelles

- 🌐 **Interface Web React** - Professeurs & Responsables
  - Reconnaissance faciale pour enregistrement
  - Gestion des séances et cours
  - Validation des justificatifs
  - Tableaux de bord complets

- 🔧 **Backend Node.js/Express**
  - API REST
  - Base de données MySQL
  - Stockage Cloudinary

- 🐍 **Service Python**
  - Reconnaissance faciale
  - Traitement d'images

---

## 🚀 Installation

### Prérequis

- Node.js >= 16.x
- MySQL >= 8.0
- Flutter >= 3.0
- Python >= 3.8

---

## 📦 Backend

```bash
cd backend
npm install
npm start
```

Le serveur démarrera sur `http://localhost:3001`

---

## 🌐 Frontend Web

```bash
cd frontend
npm install
npm start
```

L'application démarrera sur `http://localhost:3000`

---

## 📱 Application Mobile

```bash
cd mobile
flutter pub get
flutter run
```

**Note:** Modifier l'IP dans `lib/config/api_config.dart`

---

## 🐍 Service Reconnaissance Faciale

```bash
cd face-recognition-service
pip install -r requirements.txt
python app.py
```

Le service démarrera sur `http://localhost:5000`

---

## ⚙️ Configuration

### Backend (.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_password
DB_NAME=gestion_presence

JWT_SECRET=votre_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PORT=3001
```

### Base de données

```bash
mysql -u root -p
CREATE DATABASE gestion_presence;
mysql -u root -p gestion_presence < schema.sql
```

---

## 🎯 Lancement Complet

```bash
# 1. Backend
cd backend && npm start

# 2. Service reconnaissance faciale
cd face-recognition-service && python app.py

# 3. Frontend web
cd frontend && npm start

# 4. Application mobile
cd mobile && flutter run
```

---


## 👥 Auteurs

BOUZIDI IDRISSI Mohammed

