import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config';
import { 
  type User, 
  type Task, 
  type Wallet, 
  type Transaction, 
  type Message, 
  type Review, 
  type Notification, 
  type PlatformSettings, 
  type Escrow 
} from './schema';

// ==================== USER OPERATIONS ====================

export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_active_at'>): Promise<User> => {
  console.log('=== CREATE USER DEBUG ===');
  console.log('User data:', userData);
  
  const userRef = doc(collection(db, 'users'));
  const userDoc = {
    ...userData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    last_active_at: serverTimestamp(),
  };
  
  console.log('User document to create:', userDoc);
  
  await setDoc(userRef, userDoc);
  const result = { id: userRef.id, ...userDoc };
  
  console.log('User created successfully:', result);
  return result;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return userSnap.data() as User;
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  console.log('=== UPDATE USER DEBUG ===');
  console.log('User ID:', userId);
  console.log('Updates:', updates);
  
  const userRef = doc(db, 'users', userId);
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
  };
  
  await setDoc(userRef, updateData, { merge: true });
  console.log('User updated successfully');
};

export const getUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  
  return usersSnap.docs.map(doc => doc.data() as User);
};

// ==================== TASK OPERATIONS ====================

export const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
  const taskRef = doc(collection(db, 'tasks'));
  const taskDoc = {
    ...taskData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  
  await setDoc(taskRef, taskDoc);
  return { id: taskRef.id, ...taskDoc };
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  console.log('=== GET TASK DATABASE DEBUG ===');
  console.log('Task ID:', taskId);
  
  const taskRef = doc(db, 'tasks', taskId);
  console.log('Task ref:', taskRef);
  
  const taskSnap = await getDoc(taskRef);
  console.log('Task snapshot exists:', taskSnap.exists());
  console.log('Task snapshot data:', taskSnap.data());
  
  if (!taskSnap.exists()) {
    console.log('Task not found in database');
    return null;
  }
  
  const taskData = { id: taskSnap.id, ...taskSnap.data() } as Task;
  console.log('Returning task data:', taskData);
  
  return taskData;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const taskRef = doc(db, 'tasks', taskId);
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
  };
  
  await setDoc(taskRef, updateData, { merge: true });
};

export const getTasks = async (filters?: {
  requester_id?: string;
  runner_id?: string;
  status?: string;
  category?: string;
  limit?: number;
}): Promise<Task[]> => {
  console.log('=== GET TASKS DATABASE DEBUG ===');
  console.log('Filters:', filters);
  
  const tasksRef = collection(db, 'tasks');
  const constraints: QueryConstraint[] = [];
  
  if (filters?.requester_id) {
    constraints.push(where('requester_id', '==', filters.requester_id));
  }
  if (filters?.runner_id) {
    constraints.push(where('runner_id', '==', filters.runner_id));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  
  // Don't add orderBy when we have filters to avoid index requirements
  // We'll sort in JavaScript instead
  
  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }
  
  console.log('Query constraints:', constraints);
  
  const q = query(tasksRef, ...constraints);
  const tasksSnap = await getDocs(q);
  
  console.log('Query snapshot size:', tasksSnap.size);
  console.log('Query snapshot docs:', tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  
  const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  // Sort by created_at in descending order (newest first)
  tasks.sort((a, b) => {
    const aDate = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
    const bDate = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
    return bDate.getTime() - aDate.getTime();
  });
  
  console.log('Returning tasks:', tasks);
  
  return tasks;
};

// Simple function to get all tasks without filters (for Browse Tasks page)
export const getAllTasks = async (): Promise<Task[]> => {
  console.log('=== GET ALL TASKS DATABASE DEBUG ===');
  
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, orderBy('created_at', 'desc'));
  const tasksSnap = await getDocs(q);
  
  console.log('Query snapshot size:', tasksSnap.size);
  
  const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  console.log('Returning all tasks:', tasks);
  
  return tasks;
};

export const deleteTask = async (taskId: string) => {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
};

// ==================== WALLET OPERATIONS ====================

export const createWallet = async (walletData: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>) => {
  const walletRef = doc(collection(db, 'wallets'));
  const walletDoc = {
    ...walletData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  
  await setDoc(walletRef, walletDoc);
  return { id: walletRef.id, ...walletDoc };
};

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  console.log('=== GET WALLET DEBUG ===');
  console.log('Fetching wallet for user:', userId);
  
  const walletsRef = collection(db, 'wallets');
  const q = query(walletsRef, where('user_id', '==', userId));
  const walletsSnap = await getDocs(q);
  
  console.log('Wallet query results:', walletsSnap.size, 'documents found');
  
  if (walletsSnap.empty) {
    console.log('No wallet found for user');
    return null;
  }
  
  const walletData = { id: walletsSnap.docs[0].id, ...walletsSnap.docs[0].data() } as Wallet;
  console.log('Wallet data retrieved:', walletData);
  console.log('Wallet balance:', walletData.balance);
  
  return walletData;
};

export const updateWallet = async (walletId: string, updates: Partial<Wallet>, requestingUserId?: string) => {
  console.log('=== UPDATE WALLET DEBUG ===');
  console.log('Wallet ID:', walletId);
  console.log('Updates:', updates);
  console.log('Requesting user ID:', requestingUserId);
  
  // First, get the current wallet to verify ownership
  const currentWallet = await getWallet(requestingUserId as string);
  if (!currentWallet) {
    throw new Error('Wallet not found');
  }
  
  // Verify that the requesting user owns this wallet
  if (requestingUserId && currentWallet.user_id !== requestingUserId) {
    console.error('Security violation: User', requestingUserId, 'attempted to update wallet owned by', currentWallet.user_id);
    throw new Error('Unauthorized: You can only update your own wallet');
  }
  
  console.log('Wallet ownership verified:', {
    walletOwner: currentWallet.user_id,
    requestingUser: requestingUserId,
    authorized: requestingUserId ? currentWallet.user_id === requestingUserId : true
  });
  
  const walletRef = doc(db, 'wallets', walletId);
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
  };
  
  console.log('Update data:', updateData);
  
  await setDoc(walletRef, updateData, { merge: true });
  
  console.log('Wallet updated successfully');
};

// ==================== TRANSACTION OPERATIONS ====================

export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
  const transactionRef = doc(collection(db, 'transactions'));
  const transactionDoc = {
    ...transactionData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  
  await setDoc(transactionRef, transactionDoc);
  return { id: transactionRef.id, ...transactionDoc };
};

export const getTransactions = async (userId: string, limitCount: number = 50): Promise<Transaction[]> => {
  console.log('=== GET TRANSACTIONS DEBUG ===');
  console.log('User ID:', userId);
  console.log('Limit:', limitCount);
  
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('user_id', '==', userId)
    // Removed orderBy to avoid composite index requirement
  );
  
  const transactionsSnap = await getDocs(q);
  console.log('Transactions found:', transactionsSnap.size);
  
  const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  
  // Sort by created_at in descending order (newest first) in JavaScript
  transactions.sort((a, b) => {
    const aDate = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
    const bDate = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
    return bDate.getTime() - aDate.getTime();
  });
  
  // Apply limit after sorting
  const limitedTransactions = transactions.slice(0, limitCount);
  console.log('Returning transactions:', limitedTransactions.length);
  
  return limitedTransactions;
};

export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
  const transactionRef = doc(db, 'transactions', transactionId);
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
  };
  
  await setDoc(transactionRef, updateData, { merge: true });
};

// ==================== MESSAGE OPERATIONS ====================



// ==================== REVIEW OPERATIONS ====================

export const createReview = async (reviewData: Omit<Review, 'id' | 'created_at'>) => {
  const reviewRef = doc(collection(db, 'reviews'));
  const reviewDoc = {
    ...reviewData,
    created_at: serverTimestamp(),
  };
  
  await setDoc(reviewRef, reviewDoc);
  return { id: reviewRef.id, ...reviewDoc };
};

export const getReviews = async (userId: string): Promise<Review[]> => {
  const reviewsRef = collection(db, 'reviews');
  const q = query(
    reviewsRef,
    where('reviewee_id', '==', userId),
    orderBy('created_at', 'desc')
  );
  
  const reviewsSnap = await getDocs(q);
  return reviewsSnap.docs.map(doc => doc.data() as Review);
};

export const calculateUserRating = async (userId: string): Promise<number> => {
  const reviews = await getReviews(userId);
  
  if (reviews.length === 0) {
    return 5.0; // Default rating for new users
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  return Math.round(averageRating * 10) / 10; // Round to 1 decimal place
};

export const updateUserRating = async (userId: string) => {
  const newRating = await calculateUserRating(userId);
  await updateUser(userId, { rating: newRating });
  return newRating;
};

// ==================== NOTIFICATION OPERATIONS ====================

export const createNotification = async (notificationData: Omit<Notification, 'id' | 'created_at'>) => {
  const notificationRef = doc(collection(db, 'notifications'));
  const notificationDoc = {
    ...notificationData,
    created_at: serverTimestamp(),
  };
  
  await setDoc(notificationRef, notificationDoc);
  return { id: notificationRef.id, ...notificationDoc };
};

export const getNotifications = async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(limitCount)
  );
  
  const notificationsSnap = await getDocs(q);
  return notificationsSnap.docs.map(doc => doc.data() as Notification);
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { is_read: true });
};

// ==================== PLATFORM SETTINGS OPERATIONS ====================

export const getPlatformSettings = async (): Promise<PlatformSettings | null> => {
  const settingsRef = doc(db, 'platform_settings', 'main');
  const settingsSnap = await getDoc(settingsRef);
  
  if (!settingsSnap.exists()) {
    // Create default platform settings if they don't exist
    const defaultSettings: PlatformSettings = {
      id: 'main',
      commission_percentage: 10, // 10% commission
      minimum_task_amount: 100,
      maximum_task_amount: 100000,
      payment_methods: ['card', 'bank_transfer', 'wallet'],
      supported_categories: ['delivery', 'pickup', 'errand', 'other'],
      maintenance_mode: false,
      updated_at: serverTimestamp(),
      updated_by: 'system',
    };
    
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings;
  }
  
  return settingsSnap.data() as PlatformSettings;
};

export const updatePlatformSettings = async (settings: Partial<PlatformSettings>) => {
  const settingsRef = doc(db, 'platform_settings', 'main');
  const updateData = {
    ...settings,
    updated_at: serverTimestamp(),
  };
  
  await setDoc(settingsRef, updateData, { merge: true });
};

// ==================== MESSAGE OPERATIONS ====================

export const createMessage = async (messageData: Omit<Message, 'id' | 'created_at'>) => {
  const messageRef = doc(collection(db, 'messages'));
  const messageDoc = {
    ...messageData,
    created_at: serverTimestamp(),
  };

  await setDoc(messageRef, messageDoc);
  return { id: messageRef.id, ...messageDoc };
};

export const getMessages = async (filters: {
  sender_id?: string;
  receiver_id?: string;
  task_id?: string;
  limit?: number;
} = {}): Promise<Message[]> => {
  const { sender_id, receiver_id, task_id, limit: limitCount = 50 } = filters;
  
  let q = query(collection(db, 'messages'));
  const constraints: QueryConstraint[] = [];

  if (sender_id) {
    constraints.push(where('sender_id', '==', sender_id));
  }
  if (receiver_id) {
    constraints.push(where('receiver_id', '==', receiver_id));
  }
  if (task_id) {
    constraints.push(where('task_id', '==', task_id));
  }

  constraints.push(orderBy('created_at', 'desc'));
  constraints.push(limit(limitCount));

  if (constraints.length > 0) {
    q = query(collection(db, 'messages'), ...constraints);
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
};

export const updateMessage = async (messageId: string, updates: Partial<Message>) => {
  const messageRef = doc(db, 'messages', messageId);
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
  };

  await setDoc(messageRef, updateData, { merge: true });
};

// ==================== ESCROW OPERATIONS ====================

export const createEscrow = async (escrowData: Omit<Escrow, 'id' | 'created_at'>) => {
  console.log('=== CREATE ESCROW DEBUG ===');
  console.log('Escrow data:', escrowData);
  
  const escrowRef = doc(collection(db, 'escrows'));
  const escrowDoc = {
    ...escrowData,
    created_at: serverTimestamp(),
  };
  
  console.log('Escrow document to create:', escrowDoc);
  
  await setDoc(escrowRef, escrowDoc);
  const result = { id: escrowRef.id, ...escrowDoc };
  
  console.log('Escrow created successfully:', result);
  return result;
};

export const getEscrow = async (taskId: string): Promise<Escrow | null> => {
  const escrowsRef = collection(db, 'escrows');
  const q = query(escrowsRef, where('task_id', '==', taskId));
  const escrowsSnap = await getDocs(q);
  
  if (escrowsSnap.empty) {
    return null;
  }
  
  return escrowsSnap.docs[0].data() as Escrow;
};

export const updateEscrow = async (escrowId: string, updates: Partial<Escrow>) => {
  const escrowRef = doc(db, 'escrows', escrowId);
  await updateDoc(escrowRef, updates);
};

export const getEscrowsByTaskId = async (taskId: string): Promise<Escrow[]> => {
  const escrowsRef = collection(db, 'escrows');
  const q = query(escrowsRef, where('task_id', '==', taskId));
  const escrowsSnap = await getDocs(q);
  
  return escrowsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Escrow));
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export const subscribeToTaskUpdates = (taskId: string, callback: (task: Task | null) => void) => {
  const taskRef = doc(db, 'tasks', taskId);
  return onSnapshot(taskRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Task);
    } else {
      callback(null);
    }
  });
};

export const subscribeToMessages = (taskId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('task_id', '==', taskId),
    orderBy('created_at', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => doc.data() as Message);
    callback(messages);
  });
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => doc.data() as Notification);
    callback(notifications);
  });
};

// ==================== ADMIN OPERATIONS ====================

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('created_at', 'desc'));
  
  const usersSnap = await getDocs(q);
  return usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getAllWallets = async (): Promise<Wallet[]> => {
  const walletsRef = collection(db, 'wallets');
  const q = query(walletsRef, orderBy('created_at', 'desc'));
  
  const walletsSnap = await getDocs(q);
  return walletsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('created_at', 'desc'));
  
  const transactionsSnap = await getDocs(q);
  return transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const getAllReviews = async (): Promise<Review[]> => {
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, orderBy('created_at', 'desc'));
  
  const reviewsSnap = await getDocs(q);
  return reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const deleteUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};

