import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Portfolio from './pages/Portfolio';
import ProfitLoss from './pages/ProfitLoss';
import Allocation from './pages/Allocation';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

const Protected = ({ children }) => (useAuth().token ? children : <Navigate to="/login" replace />);
const Guest = ({ children }) => (useAuth().token ? <Navigate to="/dashboard" replace /> : children);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/profit-loss" element={<ProfitLoss />} />
        <Route path="/allocation" element={<Allocation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
