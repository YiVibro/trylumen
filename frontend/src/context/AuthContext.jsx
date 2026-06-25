import { createContext, useContext, useState, useCallback } from 'react';
// BUG 1: you imported "use" instead of "useCallback"
// BUG 2: you never imported useCallback but used it

import api, { setRefreshFn, setAccessToken } from '../services/api';
// Need to import these to wire up the api.js connection

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(null);
  const [user, setUser] = useState(null);

  const loginUser = (token, role, email) => {
    setAccessTokenState(token);
    setAccessToken(token); // sync to api.js module variable
    setUser({ role, email });
  };

  const logoutUser = async () => {
    await api.post('/auth/logout');
    // BUG 3: you had '/auth/logut' (typo) — this silently failed
    setAccessTokenState(null);
    setAccessToken(null); // sync to api.js
    setUser(null);
  };

  const refreshAccessToken = useCallback(async () => {
  // BUG 4: you named this "refreshToken" but exported "refreshAccessToken"
  // so <AuthContext.Provider value={{ refreshAccessToken }}> crashed
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessTokenState(data.accessToken);
      setAccessToken(data.accessToken); // sync to api.js
      return data.accessToken;
      // BUG 4 also: you had setAccessToken(data.token) but 
      // backend sends data.accessToken — inconsistent key
    } catch {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  // Wire up the refresh function to api.js on mount
  // So the axios interceptor can call it
  useState(() => {
    setRefreshFn(refreshAccessToken);
  });

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