import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // When the app loads, check if we have a saved user in localStorage
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {

        const { data } = await api.post('/auth/login', { email, password });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        navigate('/'); // Send them to the home page after login

    };

    const register = async (userData) => {

        const { data } = await api.post('/auth/register', userData);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        navigate('/');

    };

    const logout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        navigate('/login');

    };

    if (loading) return null; // Don't render the app until we check auth state

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);