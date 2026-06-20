import React, { createContext, useContext, useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('google_access_token'));

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Login Success:', tokenResponse);
            setUser(null);

            // Fetch user info
            try {
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                }).then(res => res.json());

                console.log('User Info:', userInfo);
                setToken(tokenResponse.access_token);
                setUser(userInfo);
                localStorage.setItem('google_access_token', tokenResponse.access_token);
                localStorage.setItem('user', JSON.stringify(userInfo));
            } catch (error) {
                console.error('Failed to fetch user info:', error);
                setToken(null);
                setUser(null);
                localStorage.removeItem('google_access_token');
                localStorage.removeItem('user');
            }
        },
        onError: error => console.log('Login Failed:', error),
        scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
        ].join(' '),
        include_granted_scopes: true,
    });

    const mockLogin = () => {
        const mockUser = {
            name: 'Guest User',
            email: 'guest@example.com',
            picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        };
        const mockToken = 'mock-google-access-token';
        
        console.log('Mock Login Success');
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('google_access_token', mockToken);
    };

    const logout = () => {
        if (token !== 'mock-google-access-token') {
            googleLogout();
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('google_access_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, mockLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
