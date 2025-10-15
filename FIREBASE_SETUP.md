# CaraConnect Firebase Setup Guide

This guide will help you set up Firebase for your CaraConnect application.

## 🚀 Prerequisites

1. **Firebase Account** - Sign up at [Firebase Console](https://console.firebase.google.com)
2. **Node.js 18+** - For running the development server

## 📋 Step-by-Step Setup

### **Step 1: Create Firebase Project**

1. **Go to [Firebase Console](https://console.firebase.google.com)**
2. **Click "Create a project"**
3. **Fill in project details:**
   - Project name: `cara-connect`
   - Enable Google Analytics (optional)
4. **Click "Create project"**
5. **Wait for project to be ready** (1-2 minutes)

### **Step 2: Enable Authentication**

1. **Go to Authentication > Sign-in method**
2. **Enable Email/Password:**
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
3. **Enable Google OAuth (optional):**
   - Click on "Google"
   - Toggle "Enable"
   - Add your project support email
   - Click "Save"

### **Step 3: Set up Firestore Database**

1. **Go to Firestore Database**
2. **Click "Create database"**
3. **Choose security rules:**
   - Start in test mode (for development)
   - Or set up production rules (recommended for production)
4. **Choose location:**
   - Select a location closest to your users
5. **Click "Done"**

### **Step 4: Get Project Configuration**

1. **Go to Project Settings (gear icon)**
2. **Scroll down to "Your apps"**
3. **Click "Add app" > Web app**
4. **Register app:**
   - App nickname: `cara-connect-web`
   - Check "Also set up Firebase Hosting" (optional)
5. **Copy the configuration object**

### **Step 5: Configure Environment Variables**

1. **Create `.env.local` file:**
```bash
cp env.template .env.local
```

2. **Add your Firebase configuration:**
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# App Configuration
VITE_APP_NAME=CaraConnect
VITE_APP_VERSION=1.0.0
```

### **Step 6: Set up Firestore Security Rules**

1. **Go to Firestore Database > Rules**
2. **Replace the default rules with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own wallet
    match /wallets/{walletId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Users can read and write their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Users can read and write their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Tasks are readable by all authenticated users
    // Only task participants can write
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.requester_id == request.auth.uid || 
         resource.data.runner_id == request.auth.uid);
    }
    
    // Messages are readable by task participants
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (resource.data.sender_id == request.auth.uid || 
         resource.data.receiver_id == request.auth.uid);
    }
    
    // Reviews are readable by all authenticated users
    // Only reviewers can write
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.reviewer_id == request.auth.uid;
    }
    
    // Escrows are readable by participants
    match /escrows/{escrowId} {
      allow read, write: if request.auth != null && 
        (resource.data.requester_id == request.auth.uid || 
         resource.data.runner_id == request.auth.uid);
    }
    
    // Platform settings are readable by all
    match /platform_settings/{settingsId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.updated_by == request.auth.uid;
    }
  }
}
```

3. **Click "Publish"**

### **Step 7: Initialize Platform Settings**

1. **Go to Firestore Database > Data**
2. **Create a new collection called `platform_settings`**
3. **Add a document with ID `main` and the following data:**

```json
{
  "commission_percentage": 10,
  "minimum_task_amount": 100,
  "maximum_task_amount": 50000,
  "payment_methods": ["card", "bank_transfer", "wallet"],
  "supported_categories": ["delivery", "pickup", "errand", "other"],
  "maintenance_mode": false,
  "updated_by": "admin"
}
```

### **Step 8: Test the Setup**

1. **Start the development server:**
```bash
npm run dev
```

2. **Open your browser to `http://localhost:5173`**
3. **Try to register a new account**
4. **Check Firestore Database to see if user documents are created**

## 🔧 Development Tools

### Firebase Emulator Suite (Optional)

For local development, you can use Firebase emulators:

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

3. **Initialize emulators:**
```bash
firebase init emulators
```

4. **Start emulators:**
```bash
firebase emulators:start
```

The app will automatically connect to emulators in development mode.

## 🚨 Important Notes

- **Never commit `.env.local` to version control**
- **Use production security rules for production deployment**
- **Test all authentication flows before deploying**
- **Monitor Firestore usage and costs**
- **Set up proper backup strategies for production data**

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com)
