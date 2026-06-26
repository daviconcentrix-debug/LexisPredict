
"use client";

import { useState, useEffect } from 'react';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('lexisPredict_admin_session');
    if (stored === 'true') {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const login = (password: string) => {
    // Nova senha mestre v27.0 Elite
    if (password === 'Ashley@25472053') {
      setIsAdmin(true);
      localStorage.setItem('lexisPredict_admin_session', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('lexisPredict_admin_session');
  };

  return { isAdmin, login, logout, loading };
}
