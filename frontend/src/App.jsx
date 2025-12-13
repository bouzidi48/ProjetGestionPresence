import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, FileCheck, BarChart3, Menu, X, LogOut, Home, Calendar, UserCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MastersManagement from './components/MastersManagement';
import CoursManagement from './components/CoursManagement';
import EtudiantsManagement from './components/EtudiantsManagement';
import JustificatifsValidation from './components/JustificatifsValidation';
import Statistics from './components/Statistics';
import NavItem from './components/NavItem';
import StatCard from './components/StatCard';
import LoginPage from './components/LoginPage';
import InscriptionsManagement from './components/InscriptionsManagement';

// Composants Professeur
import ProfesseurDashboard from './components/professeur/ProfesseurDashboard';
import SeancesManagement from './components/professeur/SeancesManagement';
import PrisePresence from './components/professeur/PrisePresence';
import ProfEtudiantsManagement from './components/professeur/ProfEtudiantsManagement';

const API_BASE_URL = 'http://localhost:3001/presences';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ============================================================
  // INTERFACE PROFESSEUR
  // ============================================================
  if (user.role === 'professeur') {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar Professeur */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-green-900 text-white transition-all duration-300 flex flex-col`}>
          <div className="p-4 flex items-center justify-between border-b border-green-800">
            {sidebarOpen && <h1 className="text-xl font-bold">Espace Professeur</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-green-800 rounded">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 p-4">
            <NavItem 
              icon={<Calendar size={20} />} 
              label="Calendrier des Séances" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              collapsed={!sidebarOpen} 
            />
            <NavItem 
              icon={<BookOpen size={20} />} 
              label="Mes Cours" 
              active={activeTab === 'mes-cours'} 
              onClick={() => setActiveTab('mes-cours')} 
              collapsed={!sidebarOpen} 
            />
            <NavItem 
              icon={<UserCheck size={20} />} 
              label="Prise de Présence" 
              active={activeTab === 'presence'} 
              onClick={() => setActiveTab('presence')} 
              collapsed={!sidebarOpen} 
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="liste Etudiants" 
              active={activeTab === 'etudiants'} 
              onClick={() => setActiveTab('etudiants')} 
              collapsed={!sidebarOpen} 
            />
          </nav>

          <div className="p-4 border-t border-green-800">
            {sidebarOpen && (
              <div className="mb-3">
                <p className="text-sm font-semibold">{user.prenom} {user.nom}</p>
                <p className="text-xs text-green-300">{user.email}</p>
                <p className="text-xs text-green-400 mt-1">Professeur</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              <LogOut size={18} />
              {sidebarOpen && <span>Déconnexion</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Professeur */}
        <main className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' && 'Calendrier des Séances'}
              {activeTab === 'mes-cours' && 'Gestion de Mes Cours'}
              {activeTab === 'presence' && 'Prise de Présence'}
              {activeTab === 'etudiants' && 'Liste des Étudiants'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === 'dashboard' && 'Vue d\'ensemble de toutes les séances du master'}
              {activeTab === 'mes-cours' && 'Gérez vos séances et votre emploi du temps'}
              {activeTab === 'presence' && 'Effectuez la prise de présence pour vos cours'}
              {activeTab === 'etudiants' && 'Consultez la liste des étudiants inscrits à vos cours'}
            </p>
          </header>

          <div className="p-6">
            {activeTab === 'dashboard' && <ProfesseurDashboard user={user} />}
            {activeTab === 'mes-cours' && <SeancesManagement user={user} />}
            {activeTab === 'presence' && <PrisePresence user={user} />}
            {activeTab === 'etudiants' && <ProfEtudiantsManagement user={user} />}
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // INTERFACE RESPONSABLE
  // ============================================================
  if (user.role === 'responsable') {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar Responsable */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
          <div className="p-4 flex items-center justify-between border-b border-blue-800">
            {sidebarOpen && <h1 className="text-xl font-bold">Gestion Master</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-800 rounded">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 p-4">
            <NavItem icon={<Home size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!sidebarOpen} />
            <NavItem icon={<GraduationCap size={20} />} label="Masters" active={activeTab === 'masters'} onClick={() => setActiveTab('masters')} collapsed={!sidebarOpen} />
            <NavItem icon={<BookOpen size={20} />} label="Cours" active={activeTab === 'cours'} onClick={() => setActiveTab('cours')} collapsed={!sidebarOpen} />
            <NavItem icon={<Users size={20} />} label="Étudiants" active={activeTab === 'etudiants'} onClick={() => setActiveTab('etudiants')} collapsed={!sidebarOpen} />
            <NavItem icon={<GraduationCap size={20} />} label="Inscriptions" active={activeTab === 'inscriptions'} onClick={() => setActiveTab('inscriptions')} collapsed={!sidebarOpen} />
            <NavItem icon={<FileCheck size={20} />} label="Justificatifs" active={activeTab === 'justificatifs'} onClick={() => setActiveTab('justificatifs')} collapsed={!sidebarOpen} />
            <NavItem icon={<BarChart3 size={20} />} label="Statistiques" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} collapsed={!sidebarOpen} />
          </nav>

          <div className="p-4 border-t border-blue-800">
            {sidebarOpen && (
              <div className="mb-3">
                <p className="text-sm font-semibold">{user.prenom} {user.nom}</p>
                <p className="text-xs text-blue-300">{user.email}</p>
                <p className="text-xs text-blue-400 mt-1">Responsable</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              <LogOut size={18} />
              {sidebarOpen && <span>Déconnexion</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Responsable */}
        <main className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'masters' && 'Gestion des Masters'}
              {activeTab === 'cours' && 'Gestion des Cours'}
              {activeTab === 'etudiants' && 'Gestion des Étudiants'}
              {activeTab === 'inscriptions' && "Gestion des Inscriptions"}
              {activeTab === 'justificatifs' && 'Validation des Justificatifs'}
              {activeTab === 'stats' && 'Statistiques'}
            </h2>
          </header>

          <div className="p-6">
            {activeTab === 'dashboard' && <Dashboard user={user} />}
            {activeTab === 'masters' && <MastersManagement user={user} />}
            {activeTab === 'cours' && <CoursManagement />}
            {activeTab === 'etudiants' && <EtudiantsManagement />}
            {activeTab === 'inscriptions' && <InscriptionsManagement />}
            {activeTab === 'justificatifs' && <JustificatifsValidation />}
            {activeTab === 'stats' && <Statistics />}
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // INTERFACE ÉTUDIANT (À DÉVELOPPER)
  // ============================================================
  if (user.role === 'etudiant') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Interface Étudiant</h2>
          <p className="text-gray-600 mb-6">L'interface étudiant est disponible sur l'application mobile</p>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
};

export default App;