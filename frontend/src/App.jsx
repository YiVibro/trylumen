import {AuthProvider, useAuth} from './context/AuthContext';
import Login from './components/Auth/Login';
import Dashboard from './pages/Dashboard';

const AppContent = () => {
  const { user } = useAuth();
   return user ? <Dashboard /> : <Login />;
}

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
