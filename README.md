# CaraConnect Frontend

A peer-to-peer micro-errand marketplace built with React, TypeScript, and Firebase.

## Features

- 🔐 **Authentication**: Email/password and Google OAuth
- 👤 **User Profiles**: Complete profile setup with role selection (Runner/Requester)
- 📱 **Responsive Design**: Mobile-first design with dark mode
- 🎨 **Modern UI**: Built with Tailwind CSS and Headless UI
- 🗄️ **Firebase Integration**: Real-time database, authentication, and storage
- 🛡️ **Type Safety**: Full TypeScript support

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Headless UI
- **Backend**: Firebase (Auth, Firestore, Storage, Real-time)
- **Routing**: React Router v6
- **State Management**: React Context API
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cara-connect-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Enable Storage (optional)

4. **Configure environment variables**
   ```bash
   cp env.template .env.local
   ```
   
   Update `.env.local` with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_APP_NAME=CaraConnect
   VITE_APP_VERSION=1.0.0
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── firebase/           # Firebase configuration and services
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx            # Main app component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Firebase Setup

### Database Schema
The application uses Firestore with the following main collections:

- **users** - User profiles and authentication
- **tasks** - Task management
- **wallets** - User wallet balances
- **transactions** - Payment history
- **messages** - Real-time chat
- **reviews** - User ratings
- **notifications** - Push notifications
- **platform_settings** - App configuration
- **escrows** - Payment escrow system

### Authentication
1. Go to Firebase Console > Authentication
2. Enable the following sign-in methods:
   - Email/Password
   - Google OAuth (optional)

### Firestore Security Rules
The database uses Firestore Security Rules to ensure users can only access their own data:

- Users can only view/edit their own profiles
- Task participants can view/edit their tasks
- Users can only see their own transactions and notifications
- Platform settings are publicly readable

## Features Overview

### Authentication
- Email/password registration and login
- Google OAuth integration
- Protected routes and role-based access

### User Management
- Profile setup with personal information
- Role selection (Runner/Requester)
- Profile photo upload
- Settings management

### Task Management
- Create and post tasks
- Browse available tasks
- Accept and complete tasks
- Real-time status updates

### Wallet System
- Add funds via card/bank transfer
- Escrow system for secure payments
- Transaction history
- Withdrawal functionality

### Real-time Features
- Live chat between users
- Real-time location tracking
- Push notifications
- Live task updates

## Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **User Management**: Complete user profiles with roles and verification
- **Task System**: Full task lifecycle from creation to completion
- **Payment System**: Wallet balances, transactions, and escrow
- **Communication**: Real-time messaging between users
- **Reviews**: Rating and feedback system
- **Notifications**: Real-time updates and alerts

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

### Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to Netlify

3. **Set environment variables** in Netlify dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@caraconnect.com or join our Discord community.