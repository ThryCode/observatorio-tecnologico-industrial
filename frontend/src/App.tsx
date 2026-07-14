import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Organizations from '@/pages/Organizations';
import Patents from '@/pages/Patents';
import Indicators from '@/pages/Indicators';
import Regulations from '@/pages/Regulations';
import GraphExplorer from '@/pages/GraphExplorer';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/patents" element={<Patents />} />
          <Route path="/indicators" element={<Indicators />} />
          <Route path="/regulations" element={<Regulations />} />
          <Route path="/graph" element={<GraphExplorer />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}
