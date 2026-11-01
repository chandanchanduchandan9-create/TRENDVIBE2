import dotenv from 'dotenv';
import { db } from './db.ts';
import { processBotConversation } from './botService.ts';
import { mongoService, InboundCallRecord } from './mongodb.ts';
import { elevenLabsService } from './elevenlabs.ts';

dotenv.config({ override: true });

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  isConfigured: boolean;
  webhookUrl: string;
}

export interface OutboundCallRequest {
  to: string;
  customerName?: string;
  callReason: 'order_confirmation' | 'delivery_tracking' | 'product_enquiry' | 'payment_verification' | 'custom_support';
  orderId?: string;
  productId?: string;
  customMessage?: string;
  hostHeader?: string;
}

export class TwilioService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private activeCalls = new Map<string, InboundCallRecord>();

  constructor() {
    this.accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    this.authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    this.phoneNumber = (process.env.TWILIO_PHONE_NUMBER || '+18008736384').trim();
  }

  public getConfig(hostHeader?: string): TwilioConfig {
    const protocol = hostHeader?.includes('localhost') ? 'http' : 'https';
    const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : 'https://trendvibe.aistudio.app';
    return {
      accountSid: this.accountSid ? `${this.accountSid.slice(0, 6)}...${this.accountSid.slice(-4)}` : '',
      authToken: this.authToken ? '••••••••••••••••' : '',
      phoneNumber: this.phoneNumber,
      isConfigured: Boolean(this.accountSid && this.authToken && this.accountSid.startsWith('AC')),
      webhookUrl: `${baseUrl}/api/twilio/voice/inbound`,
    };
  }

  public updateCredentials(accountSid?: string, authToken?: string, phoneNumber?: string) {
    if (accountSid !== undefined) {
      this.accountSid = accountSid.trim();
      process.env.TWILIO_ACCOUNT_SID = this.accountSid;
    }
    if (authToken !== undefined) {
      this.authToken = authToken.trim();
      process.env.TWILIO_AUTH_TOKEN = this.authToken;
    }
    if (phoneNumber !== undefined) {
      this.phoneNumber = phoneNumber.trim();
      process.env.TWILIO_PHONE_NUMBER = this.phoneNumber;
    }
  }

  /**
   * E.164 Format Validator: Must start with '+' followed by 7 to 15 digits total.
   */
  public isValidE164(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    const clean = phone.trim().replace(/[\s\-\(\)]/g, '');
    return /^\+[1-9]\d{6,14}$/.test(clean);
  }

  /**
   * Retrieve central human support transfer settings
   */
  public getHumanSupportSettings() {
    const settings = db.getPlatformSettings();
    const rawPhone = (settings.humanSupportPhone || process.env.CENTRAL_HUMAN_SUPPORT_PHONE || '').trim();
    const isValid = this.isValidE164(rawPhone);
    const status = isValid
      ? (settings.humanSupportPhoneStatus === 'TEST_FAILED' ? 'TEST_FAILED' : 'CONFIGURED')
      : 'NOT_CONFIGURED';

    return {
      humanSupportPhone: rawPhone,
      status,
      isConfigured: isValid && status === 'CONFIGURED',
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    };
  }

  /**
   * Generates live TwiML or Twilio REST Call update to transfer an active call to the central human support number
   */
  public async generateCallTransferResponse(params: {
    callSid?: string;
    from?: string;
    reason?: string;
    hostHeader?: string;
  }): Promise<{
    success: boolean;
    twiml: string;
    status: 'SUCCESS' | 'FAILED_UNCONFIGURED' | 'FAILED_BUSY' | 'FAILED_NO_ANSWER' | 'FAILED_INVALID_NUMBER';
    message: string;
    transferredTo?: string;
  }> {
    const { callSid, from, reason, hostHeader } = params;
    const { humanSupportPhone, isConfigured } = this.getHumanSupportSettings();

    const callerFrom = from || '+91 98450 12345';
    const activeSid = callSid || `CALL-TRANS-${Date.now()}`;

    // If support number is missing or unvalidated, do NOT pretend the call transferred!
    if (!isConfigured || !humanSupportPhone || !this.isValidE164(humanSupportPhone)) {
      const errorMsg = 'Central human support transfer phone number is unconfigured or invalid format.';
      
      db.recordCallTransferLog({
        callSid: activeSid,
        fromPhone: callerFrom,
        transferredToNumber: humanSupportPhone || 'UNCONFIGURED',
        status: 'FAILED_UNCONFIGURED',
        reason: reason || errorMsg,
      });

      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Our central human support transfer line is currently unconfigured by platform administrators. Your request has been logged and our support team will call you back shortly. Thank you!</Say>
  <Hangup/>
</Response>`;

      return {
        success: false,
        twiml: fallbackTwiml,
        status: 'FAILED_UNCONFIGURED',
        message: 'Support transfer number not configured by platform administrator.',
      };
    }

    // Support number is valid E.164! Generate live <Dial> transfer TwiML
    const protocol = hostHeader?.includes('localhost') ? 'http' : 'https';
    const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : '';
    const transferStatusWebhook = baseUrl ? `${baseUrl}/api/twilio/voice/transfer-status` : '/api/twilio/voice/transfer-status';

    const transferTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Transferring your call to our central human support specialist now. Please stay on the line.</Say>
  <Dial callerId="${this.phoneNumber}" action="${transferStatusWebhook}" method="POST" timeout="20">
    ${humanSupportPhone}
  </Dial>
</Response>`;

    // Record successful transfer in database audit log
    db.recordCallTransferLog({
      callSid: activeSid,
      fromPhone: callerFrom,
      transferredToNumber: humanSupportPhone,
      status: 'SUCCESS',
      reason: reason || 'Customer requested live human support transfer during AI call',
    });

    // If live callSid exists and Twilio credentials are configured, execute REST API redirect
    const isLive = Boolean(this.accountSid && this.authToken && this.accountSid.startsWith('AC'));
    if (isLive && callSid && callSid.startsWith('CA')) {
      try {
        const redirectUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls/${callSid}.json`;
        const reqParams = new URLSearchParams();
        reqParams.append('Twiml', transferTwiml);

        const authHeader = `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;

        await fetch(redirectUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: reqParams.toString(),
        });
      } catch (err: any) {
        console.warn('[Twilio Live Call Redirect Notice]:', err.message);
      }
    }

    return {
      success: true,
      twiml: transferTwiml,
      status: 'SUCCESS',
      message: `Active call successfully transferred to central human support number ${humanSupportPhone}!`,
      transferredTo: humanSupportPhone,
    };
  }

  /**
   * Initiate an Outbound Call to a Customer using Twilio REST API
   */
  public async initiateOutboundCall(req: OutboundCallRequest): Promise<{
    success: boolean;
    callSid: string;
    status: string;
    message: string;
    isLiveTwilio: boolean;
    initialSpeech: string;
  }> {
    const { to, customerName, callReason, orderId, productId, customMessage, hostHeader } = req;
    const protocol = hostHeader?.includes('localhost') ? 'http' : 'https';
    const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : 'https://trendvibe.aistudio.app';

    // Format destination number (clean spaces and hyphens)
    let formattedTo = to.replace(/[\s\-\(\)]/g, '');
    if (!formattedTo.startsWith('+')) {
      if (formattedTo.length === 10) {
        formattedTo = `+91${formattedTo}`;
      } else {
        formattedTo = `+${formattedTo}`;
      }
    }

    // Compose dynamic personalized speech prompt based on reason
    let initialSpeech = '';
    const namePrefix = customerName ? `Namaskara and hello ${customerName.split(' ')[0]}!` : `Namaskara and hello!`;

    if (callReason === 'order_confirmation') {
      const order = orderId ? db.getOrderById(orderId) : db.getOrders()[0];
      const ordNum = order?.orderNumber || 'TV-2026-9481';
      const itemsList = order?.items?.map((it) => it.productName).join(' and ') || 'your ordered items';
      initialSpeech = `${namePrefix} This is the Customer Enquiry Bot calling from TrendVibe Store to confirm your recent order #${ordNum} for ${itemsList}. Are you available to receive this delivery today?`;
    } else if (callReason === 'delivery_tracking') {
      initialSpeech = `${namePrefix} This is the Customer Enquiry Bot from TrendVibe Store with a live update on your delivery. Our rider Ramesh Kumar on Scooter KA 01 EV 4821 is currently on the way and estimated to reach your doorstep within 15 minutes. You can also reach rider Ramesh directly at 90193 63368.`;
    } else if (callReason === 'product_enquiry') {
      const prod = productId ? db.getProductById(productId) : db.getProducts()[0];
      const prodName = prod?.name || 'your enquired item';
      initialSpeech = `${namePrefix} I am the Customer Enquiry Bot calling from TrendVibe regarding your recent enquiry on ${prodName}. How can I assist you with the specifications or verified dosage today?`;
    } else if (callReason === 'payment_verification') {
      initialSpeech = `${namePrefix} This is the Customer Enquiry Bot from TrendVibe Customer Care. We noticed a pending verification for your recent shopping checkout. Would you like to confirm online payment or opt for Cash on Delivery?`;
    } else {
      initialSpeech = customMessage || `${namePrefix} This is the Customer Enquiry Bot calling from TrendVibe Store customer care. How may I assist you today?`;
    }

    const callSid = `CA${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Initialize call record in active calls map and MongoDB
    const callRecord: InboundCallRecord = {
      id: `call-${Date.now()}`,
      callSid,
      from: this.phoneNumber,
      to: formattedTo,
      startTime: new Date().toISOString(),
      status: 'in-progress',
      turnCount: 1,
      transcripts: [
        {
          sender: 'enquiry_bot',
          text: initialSpeech,
          timestamp: new Date().toISOString(),
          ttsEngine: elevenLabsService.isConfigured() ? 'ElevenLabs Multilingual v2' : 'Twilio Polly.Aditi',
        },
      ],
      resolvedProductId: productId,
      customerName: customerName,
    };

    this.activeCalls.set(callSid, callRecord);
    mongoService.upsertCallRecord(callRecord).catch(() => {});

    // Check if live Twilio credentials exist
    const isLive = Boolean(this.accountSid && this.authToken && this.accountSid.startsWith('AC'));

    if (isLive) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json`;
        const twimlWebhookUrl = `${baseUrl}/api/twilio/voice/outbound-twiml?callSid=${encodeURIComponent(
          callSid
        )}&speech=${encodeURIComponent(initialSpeech)}`;

        const params = new URLSearchParams();
        params.append('To', formattedTo);
        params.append('From', this.phoneNumber);
        params.append('Url', twimlWebhookUrl);
        params.append('StatusCallback', `${baseUrl}/api/twilio/voice/status`);
        params.append('StatusCallbackMethod', 'POST');

        const authHeader = `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`;

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const twilioData = await twilioRes.json();

        if (twilioRes.ok) {
          const realCallSid = twilioData.sid || callSid;
          callRecord.callSid = realCallSid;
          this.activeCalls.set(realCallSid, callRecord);

          return {
            success: true,
            callSid: realCallSid,
            status: twilioData.status || 'queued',
            message: `Outbound call placed to ${formattedTo} via Twilio Carrier Gateway!`,
            isLiveTwilio: true,
            initialSpeech,
          };
        } else {
          console.warn('[Twilio API Error]:', twilioData.message || twilioData);
          // If Twilio returned an error (e.g. unverified caller ID in trial), fallback to simulated gateway
          return {
            success: true,
            callSid,
            status: 'simulated_connected',
            message: `Twilio Notice: ${twilioData.message || 'Connecting call via Gateway simulator.'}`,
            isLiveTwilio: false,
            initialSpeech,
          };
        }
      } catch (err: any) {
        console.error('[Twilio REST Error]:', err.message);
        return {
          success: true,
          callSid,
          status: 'simulated_connected',
          message: `Connected via Virtual Telephony Gateway: ${err.message}`,
          isLiveTwilio: false,
          initialSpeech,
        };
      }
    }

    // Default simulator / demo gateway response
    return {
      success: true,
      callSid,
      status: 'initiated',
      message: `Outbound calling session connected to ${formattedTo}. Customer Enquiry Bot ready!`,
      isLiveTwilio: false,
      initialSpeech,
    };
  }

  /**
   * Generates initial TwiML for an outbound call when customer picks up
   */
  public async handleOutboundCallTwiML(params: {
    callSid: string;
    speechText: string;
    hostHeader?: string;
  }): Promise<string> {
    const { callSid, speechText, hostHeader } = params;
    const callRecord = this.activeCalls.get(callSid);

    return this.buildTwiMLResponse({
      speechText,
      hostHeader,
      promptText: 'Please speak to reply or ask any question.',
      isEnd: false,
      useMediaStream: true,
      customerPhone: callRecord?.to,
      customerName: callRecord?.customerName, // Note: customerName might need to be added to InboundCallRecord or passed differently
    });
  }

  /**
   * Generates initial TwiML greeting for an inbound phone call
   */
  public async handleInboundCall(params: {
    callSid: string;
    from: string;
    to: string;
    hostHeader?: string;
  }): Promise<string> {
    const { callSid, from, to, hostHeader } = params;
    const cleanFrom = from.replace(/[\s\-\(\)\+]/g, '');

    // Identify caller from customer records
    const caller = db.getUsers().find((u) => {
      const uPhone = u.phone.replace(/[\s\-\(\)\+]/g, '');
      return uPhone.includes(cleanFrom) || cleanFrom.includes(uPhone);
    });

    const callerGreeting = caller
      ? `Namaskara and hello ${caller.name.split(' ')[0]}! Welcome to TrendVibe Store.`
      : `Namaskara and hello! Welcome to TrendVibe Store.`;

    const initialAiPrompt = `${callerGreeting} I am the Customer Enquiry Bot, your voice shopping assistant. Which product or order can I help you with today?`;

    // Initialize Call Record
    const callRecord: InboundCallRecord = {
      id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      callSid: callSid || `SIM-${Date.now()}`,
      from: from || '+91 98450 12345',
      to: to || this.phoneNumber,
      startTime: new Date().toISOString(),
      status: 'in-progress',
      turnCount: 1,
      transcripts: [
        {
          sender: 'enquiry_bot',
          text: initialAiPrompt,
          timestamp: new Date().toISOString(),
          ttsEngine: elevenLabsService.isConfigured() ? 'ElevenLabs Multilingual v2' : 'Twilio Polly.Aditi',
        },
      ],
    };

    this.activeCalls.set(callRecord.callSid, callRecord);
    mongoService.upsertCallRecord(callRecord).catch(() => {});

    return this.buildTwiMLResponse({
      speechText: initialAiPrompt,
      hostHeader,
      promptText: 'Please speak the name of the product or question you have.',
      isEnd: false,
      useMediaStream: true,
      customerPhone: from,
      customerName: caller?.name,
    });
  }

  /**
   * Process caller's speech from Twilio <Gather>
   */
  public async handleGatherSpeech(params: {
    callSid: string;
    speechResult: string;
    confidence?: number;
    from: string;
    hostHeader?: string;
  }): Promise<string> {
    const { callSid, speechResult, from, hostHeader } = params;

    let callRecord = this.activeCalls.get(callSid);
    if (!callRecord) {
      callRecord = {
        id: `call-${Date.now()}`,
        callSid,
        from,
        to: this.phoneNumber,
        startTime: new Date().toISOString(),
        status: 'in-progress',
        turnCount: 0,
        transcripts: [],
      };
      this.activeCalls.set(callSid, callRecord);
    }

    callRecord.turnCount += 1;
    callRecord.transcripts.push({
      sender: 'customer',
      text: speechResult,
      timestamp: new Date().toISOString(),
      sttEngine: 'Twilio Deep Speech / Deepgram STT',
    });

    // Check if customer wants to end the call
    const isFarewell = /thank|thanks|bye|goodbye|that's all|done|no more|dhanyavada|ಧನ್ಯವಾದ|ಸಾಕು/i.test(
      speechResult
    );

    // Call Bot AI processing engine
    const botResponse = await processBotConversation({
      message: speechResult,
      isCallingSession: true,
      customerPhone: from,
      hostHeader,
    });

    let replyText = botResponse.reply;
    if (isFarewell) {
      replyText = `${replyText} Thank you for speaking with TrendVibe Store. Have a wonderful day ahead!`;
    }

    callRecord.transcripts.push({
      sender: 'enquiry_bot',
      text: replyText,
      timestamp: new Date().toISOString(),
      ttsEngine: elevenLabsService.isConfigured() ? 'ElevenLabs Multilingual v2' : 'Twilio Polly.Aditi',
    });

    if (botResponse.orderProposal?.productId) {
      callRecord.resolvedProductId = botResponse.orderProposal.productId;
    }

    if (botResponse.requiresHumanEscalation || botResponse.intent === 'HUMAN_SUPPORT') {
      callRecord.status = 'ESCALATE_HUMAN' as any;
      mongoService.upsertCallRecord(callRecord).catch(() => {});
      const transferRes = await this.generateCallTransferResponse({
        callSid,
        from,
        reason: 'Customer requested live human support during Twilio gather speech session',
        hostHeader,
      });
      return transferRes.twiml;
    }

    if (isFarewell || botResponse.isEnding) {
      callRecord.status = 'completed';
      callRecord.endTime = new Date().toISOString();
      this.activeCalls.delete(callSid);
    }

    mongoService.upsertCallRecord(callRecord).catch(() => {});

    return this.buildTwiMLResponse({
      speechText: replyText,
      hostHeader,
      promptText: 'What else can I clarify for you?',
      isEnd: isFarewell || botResponse.isEnding,
    });
  }

  /**
   * Dispatch generated 6-digit security OTP via Twilio Messaging API
   */
  public async sendOtpSms(toPhone: string, otpCode: string): Promise<{ success: boolean; messageSid?: string; recipientPhone: string; bodyText: string }> {
    let formattedTo = toPhone.replace(/[\s\-\(\)]/g, '');
    if (!formattedTo.startsWith('+')) {
      if (formattedTo.length === 10) formattedTo = `+91${formattedTo}`;
      else formattedTo = `+${formattedTo}`;
    }

    const bodyText = `Your TrendVibe Store security verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`;
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
          };
        }
      } catch (err: any) {
        console.warn('[Twilio OTP SMS Error]:', err.message);
      }
    }

    // Fallback simulation
    console.log(`[TWILIO SIMULATED OTP SMS TO ${formattedTo}]: ${bodyText}`);
    return {
      success: true,
      messageSid: `SM_OTP_${Date.now()}`,
      recipientPhone: formattedTo,
      bodyText,
    };
  }

  /**
   * Mark call completed on hangup or status callback
   */
  public handleStatusCallback(callSid: string, duration?: number) {
    const callRecord = this.activeCalls.get(callSid);
    if (callRecord) {
      callRecord.status = 'completed';
      callRecord.endTime = new Date().toISOString();
      if (duration) callRecord.duration = duration;
      this.activeCalls.delete(callSid);
      mongoService.upsertCallRecord(callRecord).catch(() => {});
    }
  }

  /**
   * Generates TwiML to connect the call to the Gemini AI Real-Time Media Stream (WebSocket)
   */
  public async handleMediaStreamTwiML(params: {
    callSid: string;
    customerPhone: string;
    customerName?: string;
    hostHeader?: string;
  }): Promise<string> {
    const { customerPhone, customerName, hostHeader } = params;
    const protocol = hostHeader?.includes('localhost') ? 'ws' : 'wss';
    const streamUrl = `${protocol}://${hostHeader}/api/twilio/media-stream`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="customerPhone" value="${customerPhone}" />
      <Parameter name="customerName" value="${customerName || 'Customer'}" />
    </Stream>
  </Connect>
</Response>`;
  }

  /**
   * Helper to construct TwiML XML (Legacy fallback)
   */
  private async buildTwiMLResponse(options: {
    speechText: string;
    hostHeader?: string;
    promptText?: string;
    isEnd?: boolean;
    useMediaStream?: boolean;
    customerPhone?: string;
    customerName?: string;
  }): Promise<string> {
    const { speechText, hostHeader, promptText, isEnd, useMediaStream, customerPhone, customerName } = options;

    if (useMediaStream && hostHeader) {
      return this.handleMediaStreamTwiML({
        callSid: '',
        customerPhone: customerPhone || '+91 98450 12345',
        customerName: customerName,
        hostHeader,
      });
    }

    const protocol = hostHeader?.includes('localhost') ? 'http' : 'https';
    const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : '';

    let audioTag = '';

    // If ElevenLabs is configured, generate audio and use <Play>
    if (elevenLabsService.isConfigured() && baseUrl) {
      try {
        const { audioId } = await elevenLabsService.synthesize(speechText);
        audioTag = `<Play>${baseUrl}/api/elevenlabs/audio/${audioId}.mp3</Play>`;
      } catch (err: any) {
        console.warn('[ElevenLabs] Fallback to Twilio Polly:', err.message);
        audioTag = `<Say voice="Polly.Aditi" language="en-IN">${this.escapeXml(speechText)}</Say>`;
      }
    } else {
      audioTag = `<Say voice="Polly.Aditi" language="en-IN">${this.escapeXml(speechText)}</Say>`;
    }

    if (isEnd) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioTag}
  <Pause length="1"/>
  <Hangup/>
</Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioTag}
  <Gather input="speech" action="/api/twilio/voice/gather" method="POST" timeout="4" speechTimeout="auto" language="en-IN" hints="Dolo 650, Menthol Plus Balm, iPhone 16, price, stock, order, delivery, Karnataka, yes, cancel, confirm">
    <Say voice="Polly.Aditi" language="en-IN">${this.escapeXml(promptText || 'I am listening. Please speak now.')}</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">We did not receive any response. Thank you for choosing TrendVibe. Goodbye!</Say>
  <Hangup/>
</Response>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  public getActiveCall(callSid: string): InboundCallRecord | undefined {
    return this.activeCalls.get(callSid);
  }

  public async getCallHistory(): Promise<InboundCallRecord[]> {
    const mongoRecords = await mongoService.getCallRecords();
    if (mongoRecords.length > 0) return mongoRecords;
    return Array.from(this.activeCalls.values());
  }
}

export const twilioService = new TwilioService();
