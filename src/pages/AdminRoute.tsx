import { useNavigate } from 'react-router-dom';
import { AdminDashboard } from '@/pages/AdminDashboard';

/**
 * Named /admin route. Access control (role check + "Accès refusé" state)
 * lives inside AdminDashboard via the server-checked useIsAdmin gate.
 */
export default function AdminRoute() {
  const navigate = useNavigate();
  return <AdminDashboard onBack={() => navigate('/dashboard')} />;
}