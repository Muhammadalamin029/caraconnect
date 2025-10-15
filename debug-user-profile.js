// Debug script to check user profile in browser console
// Run this in your browser console

console.log('=== USER PROFILE DEBUG ===');

// Check if we can access the auth context
const checkAuthContext = () => {
  // Try to find React components in the DOM
  const rootElement = document.getElementById('root');
  if (rootElement && rootElement._reactInternalFiber) {
    console.log('React root found');
  } else {
    console.log('React root not found or not accessible');
  }
};

// Check current user from localStorage/sessionStorage
const checkStoredUser = () => {
  console.log('=== STORED USER DATA ===');
  
  // Check localStorage
  const localKeys = Object.keys(localStorage);
  console.log('LocalStorage keys:', localKeys);
  
  localKeys.forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('user')) {
      console.log(`${key}:`, localStorage.getItem(key));
    }
  });
  
  // Check sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  console.log('SessionStorage keys:', sessionKeys);
  
  sessionKeys.forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('user')) {
      console.log(`${key}:`, sessionStorage.getItem(key));
    }
  });
};

// Check for any Supabase-related data
const checkSupabaseData = () => {
  console.log('=== SUPABASE DATA CHECK ===');
  
  // Look for Supabase client in window
  if (window.supabase) {
    console.log('Supabase client found in window');
  } else {
    console.log('Supabase client not found in window');
  }
  
  // Check for any global variables
  const globalVars = Object.keys(window).filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('user')
  );
  console.log('Global variables:', globalVars);
};

// Run all checks
checkAuthContext();
checkStoredUser();
checkSupabaseData();

console.log('Debug script completed. Check the messages above.');
