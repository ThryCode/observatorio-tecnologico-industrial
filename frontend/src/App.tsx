import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Organizations = lazy(() => import('@/pages/Organizations'));
const Patents = lazy(() => import('@/pages/Patents'));
const Indicators = lazy(() => import('@/pages/Indicators'));
const Regulations = lazy(() => import('@/pages/Regulations'));
const GraphExplorer = lazy(() => import('@/pages/GraphExplorer'));
const Profile = lazy(() => import('@/pages/Profile'));
const Register = lazy(() => import('@/pages/Register'));
const PendingApprovals = lazy(() => import('@/pages/PendingApprovals'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/patents" element={<Patents />} />
            <Route path="/indicators" element={<Indicators />} />
            <Route path="/regulations" element={<Regulations />} />
            <Route path="/graph" element={<GraphExplorer />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/pending" element={<PendingApprovals />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
