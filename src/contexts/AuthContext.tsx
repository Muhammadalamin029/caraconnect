import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { 
  getUser, 
  updateUser, 
  createUser, 
  createWallet 
} from '../firebase/database';
import type { User as UserProfile } from '../firebase/schema';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------- Load Profile ----------
  const loadUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      const profile = await getUser(userId);

      if (profile) {
        setUserProfile(profile);
        console.log('User profile loaded successfully');
      } else {
        console.log('No user profile found, creating basic profile...');
        
        // Create a basic profile for users who don't have one (e.g., Google OAuth users)
        try {
          const currentUser = user;
          
          if (currentUser) {
            const fullName = currentUser.displayName || 
                           currentUser.email?.split('@')[0] || 
                           'User';
            
            await createUser({
              email: currentUser.email!,
              full_name: fullName,
              is_runner: false,
              is_requester: false,
              is_admin: false,
              is_verified: false,
              rating: 5.0,
              total_tasks_completed: 0,
              total_tasks_posted: 0,
            });
            
            // Create wallet for the user
            await createWallet({
              user_id: userId,
              balance: 0,
              escrow_balance: 0,
              total_earned: 0,
              total_spent: 0,
            });
            
            console.log('Basic user profile and wallet created');
            setUserProfile(null); // Still redirect to profile setup for role selection
          } else {
            setUserProfile(null);
          }
        } catch (createError) {
          console.error('Error creating basic profile:', createError);
          setUserProfile(null);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Initialize Session ----------
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('Auth initialization timeout, setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      
      setUser(currentUser);

      if (currentUser) {
        await loadUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // ---------- Auth Methods ----------
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('Signup successful:', firebaseUser.uid);
      
      // Manually create user profile
      try {
        await createUser({
          email: firebaseUser.email!,
          full_name: fullName,
          is_runner: false,
          is_requester: false,
          is_admin: false,
          is_verified: false,
          rating: 5.0,
          total_tasks_completed: 0,
          total_tasks_posted: 0,
        });
        
        // Create wallet for the user
        await createWallet({
          user_id: firebaseUser.uid,
          balance: 0,
          escrow_balance: 0,
          total_earned: 0,
          total_spent: 0,
        });
        
        console.log('User profile and wallet created successfully');
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't throw here - user is created in auth, profile can be created later
      }
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    await updateUser(user.uid, profileData);
    await loadUserProfile(user.uid); // reload to sync with DB
  };

  // ---------- Context Value ----------
  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
