# IPG Web Checkout Setup Instructions

## Quick Answer: Yes, you need a Merchant ID

**IPG Web Checkout requires a merchant ID** - there's no way around it. However, you don't need API keys, which makes it much simpler than API integration.

## 🚀 How to Get Started

### Step 1: Get Your Merchant ID

1. **Visit**: [Interswitch Developer Console](https://developer.interswitchgroup.com/)
2. **Register**: Click "Get Started" and create an account
3. **Create Project**: Set up a new project in the console
4. **Get Merchant ID**: Copy your merchant ID from the project dashboard

### Step 2: Configure Environment

Create `.env.local` file:
```env
VITE_IPG_MERCHANT_ID=your_merchant_id_here
VITE_IPG_ENVIRONMENT=test
```

### Step 3: Test the Integration

1. Start your app: `npm run dev`
2. Go to `/wallet`
3. Click "Add Funds"
4. Select "Bank Transfer"
5. Enter amount and proceed

## ✅ What You Get

- **No API Keys Required** - Just merchant ID
- **Hosted Payment Page** - IPG handles security
- **PCI DSS Compliant** - No sensitive data on your servers
- **Mobile Responsive** - Works on all devices
- **Bank Transfer & Card** - Both payment methods supported

## 🔧 Integration Benefits

- **Simple**: Form-based redirect (no complex API calls)
- **Secure**: All payment data handled by IPG
- **Fast**: Quick setup and testing
- **Reliable**: Enterprise-grade payment processing

## 📞 Need Help?

- **Documentation**: https://ipgdocs.quickteller.co.ke/docs/web/
- **Support**: Contact IPG support for merchant ID issues
- **Registration**: https://developer.interswitchgroup.com/

The merchant ID is the only requirement - everything else is handled automatically!
