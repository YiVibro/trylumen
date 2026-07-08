import {useState} from 'react';
import {useAuth } from '../../context/AuthContext';
import {login,register} from '../../services/api';
import {Brain } from 'lucide-react';

export default function Login(){
    const {loginUser} = useAuth();
    const [isRegister,setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setLoading(true);
        setError('');

        try{
            const fn = isRegister ? register : login;
            const {data} = await fn(email,password);

            loginUser(data.token, data.role);
        }catch(err){
          console.log('bla bla')
           console.error('Login error:', err.response?.data);
           if(err.status === 401){
               setLoading(false); 
           }
            setError(err.response?.data?.message || 'Something went wrong');
        }finally{
            setLoading(false);
        }
    };
     return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            {/* <Brain className="text-white" size={24} /> */}
          </div>
          <h1 className="text-white text-2xl font-bold">TryLumen</h1>
        </div>

        <h2 className="text-gray-300 text-lg mb-6">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-6">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}