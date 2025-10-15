# IPG Payment Integration Guide

This document outlines the IPG (Interswitch Payment Gateway) integration implemented in the CaraConnect wallet system.

## Overview

The IPG payment integration provides secure payment processing for wallet deposits through multiple payment methods including credit/debit cards and bank transfers.

## Architecture

### Components

1. **IPG Payment Service** (`src/services/ipgPaymentService.ts`)
   - Handles communication with IPG API
   - Manages payment requests and responses
   - Provides transaction status checking

2. **Payment Context** (`src/contexts/PaymentContext.tsx`)
   - Manages payment state across the application
   - Integrates with wallet system
   - Handles payment history

3. **Payment Callback Page** (`src/pages/PaymentCallbackPage.tsx`)
   - Processes payment success/failure callbacks
   - Updates transaction status
   - Redirects users appropriately

4. **Webhook Handler** (`src/utils/paymentWebhook.ts`)
   - Processes IPG webhook callbacks
   - Updates wallet balances
   - Manages transaction status

## Configuration

### Environment Variables

Create a `.env` file in the frontend root directory with the following variables:

```env
# IPG Payment Gateway Configuration
VITE_IPG_MERCHANT_ID=your_merchant_id
VITE_IPG_API_KEY=your_api_key
VITE_IPG_API_SECRET=your_api_secret
VITE_IPG_BASE_URL=https://api.ipgpay.com
VITE_IPG_SANDBOX_URL=https://sandbox.ipgpay.com
VITE_IPG_ENVIRONMENT=sandbox
VITE_IPG_CALLBACK_URL=https://yourdomain.com/api/payment/callback
VITE_IPG_RETURN_URL=https://yourdomain.com/wallet?payment=success
```

### IPG Credentials

To obtain IPG credentials:

1. Register with Interswitch Payment Gateway
2. Complete merchant verification process
3. Obtain your merchant ID, API key, and API secret
4. Configure webhook endpoints for payment callbacks

## Payment Flow

### 1. Deposit Initiation

```typescript
// User initiates deposit from wallet page
const paymentResponse = await initiatePayment(amount, paymentMethod, 'Wallet deposit');

if (paymentResponse.success && paymentResponse.paymentUrl) {
  // Redirect to IPG payment page
  window.location.href = paymentResponse.paymentUrl;
}
```

### 2. Payment Processing

- User is redirected to IPG-hosted payment page
- User completes payment using their preferred method
- IPG processes the payment securely

### 3. Callback Handling

```typescript
// IPG redirects back to your application
// PaymentCallbackPage processes the result
const paymentStatus = await checkPaymentStatus(transactionId);

if (paymentStatus.status === 'completed') {
  // Update wallet balance
  // Show success message
  // Redirect to wallet page
}
```

### 4. Webhook Processing

```typescript
// IPG sends webhook to your server
const success = await processIPGWebhook(webhookData);

if (success) {
  // Transaction status updated
  // Wallet balance updated
  // User notified
}
```

## Payment Methods

### Supported Methods

1. **Credit/Debit Card** (`card`)
   - Visa, Mastercard, American Express
   - Secure tokenization
   - PCI DSS compliant

2. **Bank Transfer** (`bank_transfer`)
   - Direct bank account transfer
   - Real-time processing
   - Lower fees

3. **Wallet Transfer** (`wallet`)
   - Internal wallet-to-wallet transfers
   - Instant processing
   - No external fees

## Security Features

### Authentication
- HMAC-SHA256 signature verification
- Timestamp and nonce validation
- API key authentication

### Data Protection
- No sensitive card data stored locally
- PCI DSS compliance through IPG
- Encrypted communication

### Transaction Integrity
- Unique transaction IDs
- Status tracking
- Audit trail

## Error Handling

### Payment Failures
- User-friendly error messages
- Transaction status updates
- Retry mechanisms

### Network Issues
- Timeout handling
- Retry logic
- Fallback options

### Validation
- Amount validation
- Payment method validation
- User authentication checks

## Testing

### Sandbox Environment

1. Set `VITE_IPG_ENVIRONMENT=sandbox`
2. Use IPG sandbox credentials
3. Test with sandbox payment methods

### Test Cards

```
Visa: 4111111111111111
Mastercard: 5555555555554444
Expiry: Any future date
CVV: Any 3 digits
```

### Test Scenarios

1. **Successful Payment**
   - Complete payment flow
   - Verify wallet balance update
   - Check transaction history

2. **Failed Payment**
   - Test with invalid card
   - Verify error handling
   - Check transaction status

3. **Cancelled Payment**
   - Cancel during payment
   - Verify proper cleanup
   - Check user experience

## Monitoring and Logging

### Transaction Logging
- All payment attempts logged
- Status changes tracked
- Error details recorded

### Performance Monitoring
- Payment processing times
- Success/failure rates
- User experience metrics

### Security Monitoring
- Failed authentication attempts
- Suspicious activity detection
- Webhook verification logs

## Troubleshooting

### Common Issues

1. **Payment Not Processing**
   - Check IPG credentials
   - Verify webhook endpoints
   - Check network connectivity

2. **Balance Not Updating**
   - Verify webhook processing
   - Check transaction status
   - Review error logs

3. **Callback Errors**
   - Verify signature validation
   - Check callback URL configuration
   - Review webhook data format

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('IPG Payment Service Debug:', {
  merchantId: this.merchantId,
  environment: this.environment,
  baseUrl: this.baseUrl
});
```

## Production Deployment

### Prerequisites
1. IPG production credentials
2. SSL certificate for webhook endpoints
3. Monitoring and alerting setup

### Configuration
1. Update environment variables
2. Set `VITE_IPG_ENVIRONMENT=production`
3. Configure production webhook URLs

### Testing
1. Complete end-to-end testing
2. Load testing
3. Security audit

## Support

### IPG Support
- Documentation: https://ipgpay.com/developers/
- Support: support@ipgpay.com
- Status: https://status.ipgpay.com

### Application Support
- Check application logs
- Review transaction history
- Contact development team

## Changelog

### Version 1.0.0
- Initial IPG integration
- Card and bank transfer support
- Webhook processing
- Transaction status tracking
- Error handling and validation

## Future Enhancements

1. **Additional Payment Methods**
   - Mobile money integration
   - Cryptocurrency support
   - International payment methods

2. **Advanced Features**
   - Recurring payments
   - Payment scheduling
   - Refund processing

3. **Analytics**
   - Payment analytics dashboard
   - Revenue tracking
   - User behavior insights
