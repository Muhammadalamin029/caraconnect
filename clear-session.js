// Quick script to clear Supabase session
// Run this in your browser console if the app is stuck loading

// Clear Supabase session
localStorage.removeItem('sb-mlnxuikbojuiamhwamgs-auth-token');
localStorage.removeItem('supabase.auth.token');

// Clear all localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Reload the page
window.location.reload();

console.log('Session cleared, page will reload...');
