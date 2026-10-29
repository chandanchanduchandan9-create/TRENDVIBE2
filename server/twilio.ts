import dotenv from 'dotenv';
import { db } from './db.ts';
import { processZyroConversation } from './zyroAi.ts';
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

export class TwilioService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private activeCalls = new Map<string, InboundCallRecord>();

  constructor() {
    this.accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    this.authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    this.phoneNumber = (process.env.TWILIO_PHONE_NUMBER || '+1 800-TRENDVIBE').trim();
  }

  public getConfig(hostHeader?: string): TwilioConfig {
    const protocol = hostHeader?.includes('localhost') ? 'http' : 'https';
    const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : 'https://trendvibe.aistudio.app';
    return {
      accountSid: this.accountSid ? `${this.accountSid.slice(0, 6)}...${this.accountSid.slice(-4)}` : '',
      authToken: this.authToken ? '••••••••••••••••' : '',
      phoneNumber: this.phoneNumber,
      isConfigured: Boolean(this.accountSid && this.authToken),
      webhookUrl: `${baseUrl}/api/twilio/voice/inbound`,
    };
  }

  public updateCredentials(accountSid?: string, authToken?: string, phoneNumber?: string) {
    if (accountSid !== undefined) this.accountSid = accountSid.trim();
    if (authToken !== undefined) this.authToken = authToken.trim();
    if (phoneNumber !== undefined) this.phoneNumber = phoneNumber.trim();
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

    const initialAiPrompt = `${callerGreeting} I am Zyro AI, your voice shopping assistant. Which product or order can I help you with today?`;

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
          sender: 'zyro_ai',
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

    // Call Zyro AI processing engine
    const zyroResponse = await processZyroConversation({
      message: speechResult,
      isCallingSession: true,
      customerPhone: from,
    });

    let replyText = zyroResponse.reply;
    if (isFarewell) {
      replyText = `${replyText} Thank you for calling TrendVibe Store. Have a wonderful day ahead!`;
    }

    callRecord.transcripts.push({
      sender: 'zyro_ai',
      text: replyText,
      timestamp: new Date().toISOString(),
      ttsEngine: elevenLabsService.isConfigured() ? 'ElevenLabs Multilingual v2' : 'Twilio Polly.Aditi',
    });

    if (zyroResponse.orderProposal?.items?.[0]?.productId) {
      callRecord.resolvedProductId = zyroResponse.orderProposal.items[0].productId;
    }

    if (isFarewell || zyroResponse.isEnding) {
      callRecord.status = 'completed';
      callRecord.endTime = new Date().toISOString();
      this.activeCalls.delete(callSid);
    }

    mongoService.upsertCallRecord(callRecord).catch(() => {});

    return this.buildTwiMLResponse({
      speechText: replyText,
      hostHeader,
      promptText: 'What else would you like to know about our products or offers?',
      isEnd: isFarewell || zyroResponse.isEnding,
    });
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
   * Helper to construct TwiML XML
   */
  private async buildTwiMLResponse(options: {
    speechText: string;
    hostHeader?: string;
    promptText?: string;
    isEnd?: boolean;
  }): Promise<string> {
    const { speechText, hostHeader, promptText, isEnd } = options;
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
  <Gather input="speech" action="/api/twilio/voice/gather" method="POST" timeout="4" speechTimeout="auto" language="en-IN" hints="Dolo 650, Menthol Plus Balm, iPhone 16, price, stock, order, delivery, Karnataka">
    <Say voice="Polly.Aditi" language="en-IN">${this.escapeXml(promptText || 'I am listening. Please speak now.')}</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">We did not catch any speech. Thank you for calling TrendVibe. Goodbye!</Say>
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

  public async getCallHistory(): Promise<InboundCallRecord[]> {
    const mongoRecords = await mongoService.getCallRecords();
    if (mongoRecords.length > 0) return mongoRecords;
    return Array.from(this.activeCalls.values());
  }
}

export const twilioService = new TwilioService();
