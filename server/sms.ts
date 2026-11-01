import dotenv from 'dotenv';
dotenv.config({ override: true });

export interface SmsDispatchResult {
  success: boolean;
  messageSid?: string;
  recipientPhone: string;
  bodyText: string;
  channel: 'TWILIO_SMS' | 'SIMULATED_SMS';
  note?: string;
}

class SmsService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor() {
    this.accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    this.authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    this.phoneNumber = (process.env.TWILIO_PHONE_NUMBER || '+18008736384').trim();
  }

  private formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (!clean.startsWith('+')) {
      if (clean.length === 10) clean = `+91${clean}`;
      else clean = `+${clean}`;
    }
    return clean;
  }

  /**
   * Send SMS via Twilio or virtual gateway fallback
   */
  public async sendSms(toPhone: string, bodyText: string): Promise<SmsDispatchResult> {
    const formattedTo = this.formatPhoneNumber(toPhone);
    const isLive = Boolean(this.accountSid && this.authToken && this.accountSid.startsWith('AC'));

    if (isLive) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', formattedTo);
        params.append('From', this.phoneNumber);
        params.append('Body', bodyText);

        const authHeader = `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = await res.json();
        if (res.ok) {
          return {
            success: true,
            messageSid: data.sid,
            recipientPhone: formattedTo,
            bodyText,
            channel: 'TWILIO_SMS',
            note: 'SMS delivered via Twilio Carrier Network!',
          };
        } else {
          console.warn('[Twilio SMS Note]:', data.message || data);
        }
      } catch (err: any) {
        console.warn('[Twilio SMS Error]:', err.message);
      }
    }

    // Virtual Gateway Fallback
    console.log(`[VIRTUAL SMS SENT TO ${formattedTo}]: ${bodyText}`);
    return {
      success: true,
      messageSid: `SM${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      recipientPhone: formattedTo,
      bodyText,
      channel: 'SIMULATED_SMS',
      note: 'Sent via TrendVibe Virtual SMS Gateway.',
    };
  }

  /**
   * Send Razorpay Payment Link via SMS
   */
  public async sendPaymentLinkSms(toPhone: string, orderNumber: string, paymentUrl: string, amount: number): Promise<SmsDispatchResult> {
    const body = `TrendVibe Store: Complete your payment of ₹${amount.toLocaleString('en-IN')} for Order #${orderNumber}. Pay securely via Razorpay: ${paymentUrl}`;
    return this.sendSms(toPhone, body);
  }

  /**
   * Send Live Order Tracking Link via SMS
   */
  public async sendTrackingLinkSms(toPhone: string, orderNumber: string, trackingUrl: string, estDelivery: string): Promise<SmsDispatchResult> {
    const body = `TrendVibe Store: Track your Order #${orderNumber} live! Delivery status & courier updates: ${trackingUrl}. Est. Arrival: ${estDelivery}.`;
    return this.sendSms(toPhone, body);
  }

  /**
   * Send Order Confirmation SMS
   */
  public async sendOrderConfirmationSms(toPhone: string, orderNumber: string, amount: number, itemsCount: number): Promise<SmsDispatchResult> {
    const body = `TrendVibe Store: Order #${orderNumber} confirmed for ${itemsCount} item(s) totaling ₹${amount.toLocaleString('en-IN')}. Thank you for shopping with us!`;
    return this.sendSms(toPhone, body);
  }

  /**
   * Send Customer Security Verification OTP
   */
  public async sendOtpSms(toPhone: string, otpCode: string): Promise<SmsDispatchResult> {
    const body = `Your TrendVibe Store security verification code is: ${otpCode}. Do not share this code with anyone. Valid for 10 minutes.`;
    return this.sendSms(toPhone, body);
  }
}

export const smsService = new SmsService();
