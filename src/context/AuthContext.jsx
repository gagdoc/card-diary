import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const TOKEN_EXPIRY_KEY = 'google_token_expiry';
const TOKEN_KEY = 'google_access_token';
const USER_KEY = 'user';

const SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
].join(' ');

/** Returns stored token only if it's still valid (with 5-min buffer). */
const getValidStoredToken = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
    const nowMs = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5-min buffer
    if (token && expiry && nowMs < expiry - bufferMs) {
        return token;
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
};

/**
 * authState values:
 *  'authenticated'   – valid token, full access
 *  'needs_reauth'    – user info exists but token expired, show reconnect UI
 *  'unauthenticated' – no user info at all, show login screen
 */
const deriveInitialAuthState = () => {
    const hasUser = !!localStorage.getItem(USER_KEY);
    const hasToken = !!getValidStoredToken();
    if (hasUser && hasToken) return 'authenticated';
    if (hasUser) return 'needs_reauth';
    return 'unauthenticated';
};

export const AuthProvider = ({ children }) => {
    // User info persists across sessions — never cleared on token expiry
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState(() => getValidStoredToken());
    const [authState, setAuthState] = useState(deriveInitialAuthState);

    // Track whether silent re-login is in progress to avoid repeated attempts
    const silentLoginAttempted = useRef(false);

    /* ─── Success handler shared by both login() and silentLogin() ─── */
    const handleLoginSuccess = useCallback(async (tokenResponse) => {
        try {
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            }).then(res => res.json());

            const expiryMs = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;

            setToken(tokenResponse.access_token);
            setUser(userInfo);
            setAuthState('authenticated');
            localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryMs));
            localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            // Don't wipe user info — keep needs_reauth state
            setToken(null);
            setAuthState(user ? 'needs_reauth' : 'unauthenticated');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Normal (interactive) login ─── */
    const login = useGoogleLogin({
        onSuccess: handleLoginSuccess,
        onError: () => {
            setAuthState(user ? 'needs_reauth' : 'unauthenticated');
        },
        scope: SCOPES,
        include_granted_scopes: true,
    });

    /* ─── Silent (non-interactive) re-login — runs automatically on startup ─── */
    const silentLogin = useGoogleLogin({
        onSuccess: handleLoginSuccess,
        onError: () => {
            // Silent login failed → keep needs_reauth, user taps manually
            setAuthState('needs_reauth');
        },
        scope: SCOPES,
        include_granted_scopes: true,
        prompt: 'none',
        hint: user?.email,
    });

    /* ─── Auto silent re-auth on startup if user info exists but token expired ─── */
    useEffect(() => {
        if (
            authState === 'needs_reauth' &&
            !silentLoginAttempted.current
        ) {
            silentLoginAttempted.current = true;
            // Small delay so the UI renders first
            const t = setTimeout(() => silentLogin(), 500);
            return () => clearTimeout(t);
        }
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Called by Drive/Picker on 401 ─── */
    const handleTokenExpired = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        setToken(null);
        setAuthState('needs_reauth');
        // Attempt silent re-login automatically
        silentLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Guest mode ─── */
    const mockLogin = () => {
        const mockUser = {
            name: 'Guest User',
            email: 'guest@example.com',
            picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
        };
        setUser(mockUser);
        setToken('mock-google-access-token');
        setAuthState('authenticated');
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        localStorage.setItem(TOKEN_KEY, 'mock-google-access-token');
    };

    /* ─── Full logout — only when user explicitly clicks logout ─── */
    const logout = () => {
        if (token && token !== 'mock-google-access-token') {
            googleLogout();
        }
        setUser(null);
        setToken(null);
        setAuthState('unauthenticated');
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            authState,
            login,
            mockLogin,
            logout,
            handleTokenExpired,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
