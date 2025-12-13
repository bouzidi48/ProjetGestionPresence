import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, FileCheck, BarChart3, Menu, X, LogOut, Home } from 'lucide-react';
import StatCard from './StatCard';
const API_BASE_URL = 'http://localhost:3001/presences';

const Dashboard = () => {
  const [stats, setStats] = useState({
    masters: 0,
    cours: 0,
    etudiants: 0,
    justificatifsEnAttente: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [masters, cours, users] = await Promise.all([
        fetch(`${API_BASE_URL}/masters`).then(r => r.json()),
        fetch(`${API_BASE_URL}/cours`).then(r => r.json()),
        fetch(`${API_BASE_URL}/users/role/etudiant`).then(r => r.json())
      ]);

      setStats({
        masters: masters.data?.length || 0,
        cours: cours.data?.length || 0,
        etudiants: users.data?.length || 0,
        justificatifsEnAttente: 5
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Masters" value={stats.masters} icon={<GraduationCap size={32} />} color="blue" />
        <StatCard title="Cours" value={stats.cours} icon={<BookOpen size={32} />} color="green" />
        <StatCard title="Étudiants" value={stats.etudiants} icon={<Users size={32} />} color="purple" />
        <StatCard title="Justificatifs en attente" value={stats.justificatifsEnAttente} icon={<FileCheck size={32} />} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Activité récente</h3>
        <p className="text-gray-600">Aucune activité récente pour le moment.</p>
      </div>
    </div>
  );
};
export default Dashboard;