import { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      // Try to load existing user from localStorage
      const savedUserId = localStorage.getItem('fitlens_user_id');
      if (savedUserId) {
        const res = await getUsers();
        const found = res.data.find(u => u._id === savedUserId);
        if (found) {
          setUser(found);
          setLoading(false);
          return;
        }
      }
      // Try to get the most recent user
      const res = await getUsers();
      if (res.data.length > 0) {
        setUser(res.data[0]);
        localStorage.setItem('fitlens_user_id', res.data[0]._id);
      }
    } catch (err) {
      console.log('No existing user found or server not available');
    }
    setLoading(false);
  }

  async function saveUser(data) {
    try {
      if (user?._id) {
        const res = await updateUser(user._id, data);
        setUser(res.data);
        return res.data;
      } else {
        const res = await createUser(data);
        setUser(res.data);
        localStorage.setItem('fitlens_user_id', res.data._id);
        return res.data;
      }
    } catch (err) {
      console.error('Error saving user:', err);
      throw err;
    }
  }

  function clearUser() {
    setUser(null);
    localStorage.removeItem('fitlens_user_id');
  }

  return (
    <UserContext.Provider value={{ user, setUser, loading, saveUser, clearUser, loadUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}

export default UserContext;
