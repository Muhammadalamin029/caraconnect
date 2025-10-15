/**
 * IPG Web Checkout Service
 * Handles payment processing through Interswitch Payment Gateway Web Checkout
 * No API keys required - uses hosted payment page approach
 */

export interface IPGWebCheckoutRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  description: string;
  returnUrl: string;
  paymentMethod?: 'card' | 'bank_transfer';
}

export interface IPGWebCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  formData?: Record<string, string>;
  error?: string;
  message?: string;
}

class IPGWebCheckoutService {
  private merchantId: string;
  private environment: 'sandbox' | 'production';
  private checkoutUrl: string;

  constructor() {
    this.merchantId = import.meta.env.VITE_IPG_MERCHANT_ID || '';
    this.environment = (import.meta.env.VITE_IPG_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    
    // Set checkout URL based on environment
    this.checkoutUrl = this.environment === 'production' 
      ? 'https://gatewaybackend.quickteller.co.ke/ipg-backend/api/checkout'
      : 'https://gatewaybackend-uat.quickteller.co.ke/ipg-backend/api/checkout';

    if (!this.merchantId) {
      console.warn('IPG Web Checkout: No merchant ID provided. You need to register with IPG to get a merchant ID.');
      console.warn('Visit: https://developer.interswitchgroup.com/ to register and get your merchant ID');
    }
  }

  /**
   * Create a web checkout payment
   */
  async createWebCheckout(checkoutRequest: IPGWebCheckoutRequest): Promise<IPGWebCheckoutResponse> {
    try {
      if (!this.merchantId) {
        return {
          success: false,
          error: 'Merchant ID is required. Please register with IPG to get your merchant ID.',
        };
      }

      // Convert amount to kobo (multiply by 100)
      const amountInKobo = Math.round(checkoutRequest.amount * 100);
      
      // Prepare form data for IPG Web Checkout
      const formData = {
        merchantCode: this.merchantId, // IPG uses 'merchantCode' as the field name
        amount: amountInKobo.toString(),
        orderId: checkoutRequest.orderId,
        currency: checkoutRequest.currency,
        customerEmail: checkoutRequest.customerEmail,
        customerName: checkoutRequest.customerName,
        description: checkoutRequest.description,
        redirectUrl: checkoutRequest.returnUrl,
        paymentMethod: checkoutRequest.paymentMethod || 'card',
        // Additional fields for better integration
        country: 'NG',
        locale: 'en',
        // Test mode indicator
        testMode: this.environment === 'sandbox' ? '1' : '0'
      };

      return {
        success: true,
        checkoutUrl: this.checkoutUrl,
        formData,
        message: 'Web checkout created successfully'
      };
    } catch (error) {
      console.error('IPG Web Checkout Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a hidden form and submit it to redirect to IPG checkout
   */
  async createCheckoutForm(checkoutRequest: IPGWebCheckoutRequest): Promise<void> {
    try {
      console.log('Creating IPG checkout form...', {
        merchantId: this.merchantId,
        checkoutUrl: this.checkoutUrl,
        amount: checkoutRequest.amount,
        orderId: checkoutRequest.orderId
      });

      const result = await this.createWebCheckout(checkoutRequest);
      
      if (result.success && result.formData) {
        console.log('Checkout form data:', result.formData);
        
        // Create a hidden form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = this.checkoutUrl;
        form.target = '_self';
        form.style.display = 'none';

        // Add form fields
        Object.entries(result.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        // Add form to page and submit
        document.body.appendChild(form);
        console.log('Submitting form to IPG...');
        form.submit();
        document.body.removeChild(form);
      } else {
        console.error('Failed to create checkout form:', result.error);
        alert(`Payment initialization failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating checkout form:', error);
      alert('Payment initialization failed. Please try again.');
    }
  }

  /**
   * Parse payment response from IPG redirect
   */
  parsePaymentResponse(urlParams: URLSearchParams): {
    success: boolean;
    transactionId?: string;
    amount?: number;
    status?: string;
    message?: string;
  } {
    try {
      const response = urlParams.get('response');
      const orderId = urlParams.get('order_id');
      const amount = urlParams.get('amount');
      const status = urlParams.get('status');

      if (!response) {
        return {
          success: false,
          message: 'No payment response received'
        };
      }

      // Parse the response (this might be encoded JSON or a simple string)
      let responseData;
      try {
        responseData = JSON.parse(decodeURIComponent(response));
      } catch {
        // If not JSON, treat as simple response
        responseData = { status: response };
      }

      const isSuccess = status === 'success' || 
                       responseData.status === 'success' || 
                       responseData.ResponseCode === '90000';

      return {
        success: isSuccess,
        transactionId: orderId || responseData.transactionId,
        amount: amount ? parseFloat(amount) / 100 : undefined, // Convert back from kobo
        status: status || responseData.status,
        message: responseData.message || responseData.ResponseMessage
      };
    } catch (error) {
      console.error('Error parsing payment response:', error);
      return {
        success: false,
        message: 'Error processing payment response'
      };
    }
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): string[] {
    return ['card', 'bank_transfer'];
  }

  /**
   * Get test account information for bank transfers
   */
  getTestBankAccounts(): Array<{bankName: string, accountNumber: string, accountName: string}> {
    return [
      {
        bankName: 'GTBank',
        accountNumber: '0014261063',
        accountName: 'Test Account GTB'
      },
      {
        bankName: 'Access Bank',
        accountNumber: '3001155245',
        accountName: 'Test Account Access'
      },
      {
        bankName: 'First Bank',
        accountNumber: '1234567890',
        accountName: 'Test Account First Bank'
      }
    ];
  }

  /**
   * Get test card information
   */
  getTestCards(): Array<{type: string, number: string, expiry: string, cvv: string}> {
    return [
      {
        type: 'Visa',
        number: '4111111111111111',
        expiry: '12/25',
        cvv: '123'
      },
      {
        type: 'Mastercard',
        number: '5555555555554444',
        expiry: '12/25',
        cvv: '123'
      },
      {
        type: 'Visa',
        number: '4000000000000002',
        expiry: '12/25',
        cvv: '123'
      }
    ];
  }
}

// Export singleton instance
export const ipgWebCheckoutService = new IPGWebCheckoutService();
export default ipgWebCheckoutService;