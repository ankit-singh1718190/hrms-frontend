import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/useAuth';

export default function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
