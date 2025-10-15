# CaraConnect Firestore Usage Guide

This guide explains how to use the Firestore database in your CaraConnect application.

## 🗄️ Database Structure

### Collections Overview
- **`users`** - User profiles and authentication data
- **`tasks`** - Task listings and management
- **`wallets`** - User wallet balances and escrow
- **`transactions`** - Payment and transaction history
- **`messages`** - Real-time chat messages
- **`reviews`** - User ratings and feedback
- **`notifications`** - Push notifications
- **`platform_settings`** - System configuration
- **`escrows`** - Escrow management for secure payments

## 🚀 Getting Started

### 1. **Environment Setup**
Create `.env.local` with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. **Firebase Console Setup**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password, Google, Phone)
5. Deploy security rules from `firestore.rules`

## 📚 Available Services

### **FirestoreService** (`src/firebase/firestoreService.ts`)
Complete CRUD operations for all collections:

```typescript
import { 
  createUser, 
  getUser, 
  updateUser,
  createTask, 
  getTasks, 
  updateTask,
  getWallet, 
  updateWallet,
  createTransaction,
  getTransactions,
  sendMessage,
  getMessages,
  subscribeToMessages,
  createReview,
  getReviews,
  createNotification,
  getNotifications,
  getPlatformSettings,
  updatePlatformSettings
} from '../firebase/firestoreService';
```

### **Context Providers**
- **AuthContext** - User authentication and profile management
- **TaskContext** - Task creation, management, and real-time updates
- **WalletContext** - Wallet operations and transaction management

## 🔧 Usage Examples

### **User Management**
```typescript
import { useAuth } from './contexts/AuthContext';

function ProfileComponent() {
  const { user, userProfile, updateProfile } = useAuth();
  
  const handleUpdateProfile = async () => {
    await updateProfile({
      fullName: 'New Name',
      phone: '+2348000000000',
      isRunner: true
    });
  };
}
```

### **Task Management**
```typescript
import { useTasks } from './contexts/TaskContext';

function TaskList() {
  const { tasks, createNewTask, acceptTask } = useTasks();
  
  const handleCreateTask = async () => {
    const newTask = await createNewTask({
      title: 'Pick up groceries',
      description: 'Need someone to pick up groceries from Shoprite',
      category: 'pickup',
      rewardAmount: 2000,
      pickupLocation: {
        address: '123 Main St, Lagos',
        coordinates: { lat: 6.5244, lng: 3.3792 }
      },
      deliveryLocation: {
        address: '456 Oak Ave, Lagos',
        coordinates: { lat: 6.5244, lng: 3.3792 }
      },
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      requesterId: 'user123'
    });
  };
  
  const handleAcceptTask = async (taskId: string) => {
    await acceptTask(taskId, 'runner123');
  };
}
```

### **Wallet Operations**
```typescript
import { useWallet } from './contexts/WalletContext';

function WalletComponent() {
  const { wallet, transactions, deposit, withdraw } = useWallet();
  
  const handleDeposit = async () => {
    await deposit(5000, 'card'); // Deposit ₦5000 via card
  };
  
  const handleWithdraw = async () => {
    await withdraw(2000, {
      accountNumber: '1234567890',
      bankName: 'First Bank',
      accountName: 'John Doe'
    });
  };
}
```

### **Real-time Subscriptions**
```typescript
import { subscribeToTasks, subscribeToMessages } from '../firebase/firestoreService';

// Subscribe to new tasks
useEffect(() => {
  const unsubscribe = subscribeToTasks((tasks) => {
    console.log('New tasks:', tasks);
  });
  
  return unsubscribe;
}, []);

// Subscribe to messages
useEffect(() => {
  const unsubscribe = subscribeToMessages('task123', (messages) => {
    console.log('New messages:', messages);
  });
  
  return unsubscribe;
}, []);
```

## 🔒 Security Rules

The Firestore security rules ensure:
- Users can only access their own data
- Tasks are publicly readable but only editable by participants
- Wallets are private to each user
- Admin-only access to platform settings
- Secure message handling between task participants

## 📊 Data Flow

### **Task Creation Flow**
1. User creates task → `createTask()`
2. System calculates commission → Updates task with commission amounts
3. Task appears in public feed → Real-time subscription updates
4. Runner accepts task → `acceptTask()` creates escrow
5. Payment held in escrow until completion

### **Payment Flow**
1. User deposits funds → `deposit()` creates transaction
2. Payment gateway processes → Updates transaction status
3. Wallet balance updated → Real-time UI updates
4. Task payment → Funds moved to escrow
5. Task completion → Escrow released to runner

## 🧪 Testing

### **Local Development**
1. Set up Firebase Emulator Suite
2. Use test data for development
3. Test all CRUD operations
4. Verify security rules

### **Production Testing**
1. Create test users with different roles
2. Test complete task lifecycle
3. Verify payment flows
4. Test real-time features

## 📈 Performance Optimization

### **Query Optimization**
- Use indexes for complex queries
- Limit query results with `limit()`
- Use `where()` clauses efficiently
- Implement pagination for large datasets

### **Real-time Optimization**
- Unsubscribe from listeners when components unmount
- Use specific queries instead of broad subscriptions
- Implement proper error handling

## 🔧 Troubleshooting

### **Common Issues**
1. **Permission Denied** - Check security rules and user authentication
2. **Missing Data** - Verify collection names and document IDs
3. **Real-time Not Working** - Check listener setup and cleanup
4. **Performance Issues** - Review query patterns and indexes

### **Debug Tips**
- Use Firebase Console to inspect data
- Check browser console for errors
- Verify environment variables
- Test with Firebase Emulator

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Context API](https://reactjs.org/docs/context.html)
- [TypeScript with Firebase](https://firebase.google.com/docs/firestore/query-data/get-data#typescript)

## 🚀 Next Steps

1. **Set up Firebase project** and configure environment
2. **Deploy security rules** from `firestore.rules`
3. **Test authentication** and user creation
4. **Implement task management** features
5. **Add payment integration** (Interswitch)
6. **Set up real-time messaging**
7. **Deploy to production**
