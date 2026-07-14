import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setRefreshFn, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 1. Start in loading state

  const loginUser = (token, role, email) => {
    setAccessTokenState(token);
    setAccessToken(token); 
    setUser({ role, email });
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setAccessTokenState(null);
      setAccessToken(null); 
      setUser(null);
    }
  };

  const refreshAccessToken = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessTokenState(data.accessToken);
      setAccessToken(data.accessToken); 
      
      // If your backend returns user payload details on refresh, hydrate it here
      if (data.user) {
        setUser({ role: data.user.role, email: data.user.email });
      }
      
      return data.accessToken;
    } catch (err) {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  // 👈 2. Cleanly link the axios interceptor on context initialization
  useEffect(() => {
    setRefreshFn(refreshAccessToken);
  }, [refreshAccessToken]);

  // 👈 3. CRITICAL PERSISTENCE FIX: Check session on app mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        await refreshAccessToken();
      } catch (err) {
        console.log("No active session cookie found.");
      } finally {
        setLoading(false); // 👈 Stop loading whether it succeeds or fails
      }
    };

    verifySession();
  }, [refreshAccessToken]);

  // 👈 4. Don't render the app interface while verifying the session status
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loginUser,
      logoutUser,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// import { createContext, useContext, useState, useCallback } from 'react';
// // BUG 1: you imported "use" instead of "useCallback"
// // BUG 2: you never imported useCallback but used it

// import api, { setRefreshFn, setAccessToken } from '../services/api';
// // Need to import these to wire up the api.js connection

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [accessToken, setAccessTokenState] = useState(null);
//   const [user, setUser] = useState(null);

//   const loginUser = (token, role, email) => {
//     setAccessTokenState(token);
//     setAccessToken(token); // sync to api.js module variable
//     setUser({ role, email });
//   };

//   const logoutUser = async () => {
//     await api.post('/auth/logout');
//     // BUG 3: you had '/auth/logut' (typo) — this silently failed
//     setAccessTokenState(null);
//     setAccessToken(null); // sync to api.js
//     setUser(null);
//   };

//   const refreshAccessToken = useCallback(async () => {
//   // BUG 4: you named this "refreshToken" but exported "refreshAccessToken"
//   // so <AuthContext.Provider value={{ refreshAccessToken }}> crashed
//     try {
//       const { data } = await api.post('/auth/refresh');
//       setAccessTokenState(data.accessToken);
//       setAccessToken(data.accessToken); // sync to api.js
//       return data.accessToken;
//       // BUG 4 also: you had setAccessToken(data.token) but 
//       // backend sends data.accessToken — inconsistent key
//     } catch {
//       setAccessTokenState(null);
//       setAccessToken(null);
//       setUser(null);
//       return null;
//     }
//   }, []);

//   // Wire up the refresh function to api.js on mount
//   // So the axios interceptor can call it
//   useState(() => {
//     setRefreshFn(refreshAccessToken);
//   });

//   return (
//     <AuthContext.Provider value={{
//       user,
//       accessToken,
//       loginUser,
//       logoutUser,
//       refreshAccessToken
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);