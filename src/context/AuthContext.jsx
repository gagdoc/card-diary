import React, { createContext, useContext, useState, useCallback } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const TOKEN_EXPIRY_KEY = 'google_token_expiry';
const TOKEN_KEY = 'google_access_token';
const USER_KEY = 'user';

/** Returns stored token only if it's still valid (with 5-min buffer). */
const getValidStoredToken = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
    const nowMs = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 min buffer
    if (token && expiry && nowMs < expiry - bufferMs) {
        return token;
    }
    // Token missing or expired — clear storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem(USER_KEY);
        return storedUser ? JSON.parse(storedUser) : null;
    });
    // Only use stored token if it's still valid
    const [token, setToken] = useState(() => getValidStoredToken());

    const handleLoginSuccess = useCallback(async (tokenResponse) => {
        try {
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            }).then(res => res.json());

            const expiryMs = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;

            setToken(tokenResponse.access_token);
            setUser(userInfo);
            localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryMs));
            localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            setToken(null);
            setUser(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            localStorage.removeItem(USER_KEY);
        }
    }, []);

    const login = useGoogleLogin({
        onSuccess: handleLoginSuccess,
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

    /**
     * Call this whenever an API returns 401.
     * Clears the stale token so the UI shows the login button again.
     */
    const handleTokenExpired = useCallback(() => {
        setToken(null);
        setUser(prev => {
            // Keep user info so we can show "re-login" prompt, but clear the token
            return prev;
        });
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        alert('Google 인증이 만료되었습니다. 다시 로그인해 주세요.');
        // Trigger silent re-login
        login();
    }, [login]);

    const mockLogin = () => {
        const mockUser = {
            name: 'Guest User',
            email: 'guest@example.com',
            picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        };
        const mockToken = 'mock-google-access-token';

        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        localStorage.setItem(TOKEN_KEY, mockToken);
        // No expiry for mock token
    };

    const logout = () => {
        if (token !== 'mock-google-access-token') {
            googleLogout();
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, mockLogin, logout, handleTokenExpired }}>
            {children}
        </AuthContext.Provider>
    );
};
