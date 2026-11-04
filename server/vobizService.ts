import dotenv from 'dotenv';

dotenv.config({ override: true });

export interface VobizConfig {
  authId: string;
  authToken: string;
  isConfigured: boolean;
}

export class VobizService {
  private authId: string;
  private authToken: string;
  private baseUrl = 'https://api.vobiz.ai/api/v1';

  constructor() {
    this.authId = (process.env.VOBIZ_AUTH_ID || '').trim();
    this.authToken = (process.env.VOBIZ_AUTH_TOKEN || '').trim();
  }

  public getConfig(hostHeader?: string): VobizConfig {
    return {
      authId: this.authId ? `${this.authId.slice(0, 4)}...` : '',
      authToken: this.authToken ? '••••••••' : '',
      isConfigured: Boolean(this.authId && this.authToken),
    };
  }

  public updateCredentials(authId?: string, authToken?: string, phoneNumber?: string) {
    if (authId) this.authId = authId.trim();
    if (authToken) this.authToken = authToken.trim();
  }

  public getHumanSupportSettings() {
    return {
      humanSupportPhone: '+919845012345',
      status: 'NOT_CONFIGURED',
      isConfigured: false,
      updatedAt: new Date().toISOString(),
    };
  }

  public isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  public async generateCallTransferResponse(params: any) {
    return { 
      success: false, 
      status: 'FAILED_UNCONFIGURED', 
      message: 'Vobiz transfer not implemented',
      transferredTo: '',
      twiml: ''
    };
  }

  public async getCallHistory(): Promise<any[]> {
    return [];
  }

  public async initiateOutboundCall(params: any): Promise<any> {
    return { 
      success: false, 
      message: 'Vobiz outbound not implemented', 
      status: 'failed',
      callSid: 'CA-STUB',
      isLiveTwilio: false,
      initialSpeech: ''
    };
  }

  public async handleInboundCall(params: any) {
    return '';
  }

  public async handleGatherSpeech(params: any) {
    return '';
  }

  public handleStatusCallback(callSid: string, duration?: number) {
    // stub
  }

  public async handleOutboundCallTwiML(params: any) {
    return '';
  }

  private isConfigured(): boolean {
    return Boolean(this.authId && this.authToken);
  }
}

export const vobizService = new VobizService();
