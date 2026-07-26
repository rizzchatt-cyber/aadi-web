import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

interface AuthContextType {
    user: User | null;
    role: string | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Check special admin emails (case-insensitive)
                    const adminEmails = ['aadityas.aura.web@gmail.com', 'adityas.aura.web@gmail.com', 'aadityasaura@gmail.com', 'laksxhya@gmail.com'];
                    if (firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase())) {
                        setRole('admin');
                        localStorage.setItem(`role_${firebaseUser.uid}`, 'admin');
                    } else {
                        // Check local storage first for role to speed up initial load
                        const cachedRole = localStorage.getItem(`role_${firebaseUser.uid}`);
                        if (cachedRole) setRole(cachedRole);

                        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                        if (userDoc.exists()) {
                            const fetchedRole = userDoc.data().role || 'user';
                            setRole(fetchedRole);
                            localStorage.setItem(`role_${firebaseUser.uid}`, fetchedRole);
                        } else {
                            const newRole = 'user';
                            setRole(newRole);
                            localStorage.setItem(`role_${firebaseUser.uid}`, newRole);
                            await setDoc(doc(db, "users", firebaseUser.uid), {
                                name: firebaseUser.displayName || 'Aura Member',
                                email: firebaseUser.email,
                                role: newRole,
                                createdAt: new Date().toISOString()
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error fetching user role:", err);
                    setRole('user');
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            // Using a more explicit popup flow with custom parameters
            googleProvider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            console.error("Google login failed:", err.code);
            if (err.code === 'auth/popup-blocked') {
                alert("Please allow popups for this site to sign in with Google.");
            }
            throw err;
        }
    };

    const logout = async () => {
        try {
            const uid = auth.currentUser?.uid;
            if (uid) localStorage.removeItem(`role_${uid}`);
            await signOut(auth);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
