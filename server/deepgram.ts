import dotenv from 'dotenv';

dotenv.config({ override: true });

export interface DeepgramTranscriptionResult {
  transcript: string;
  confidence: number;
  detectedLanguage?: string;
  duration?: number;
}

export class DeepgramService {
  private baseUrl = 'https://api.deepgram.com/v1/listen';

  private getApiKey(): string {
    return (process.env.DEEPGRAM_API_KEY || 'd13882e9132156e237fa3a443325c550bca0e76a').trim();
  }

  public isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Transcribes raw audio buffer (WebM, WAV, OGG, MP3) using Deepgram Nova-2 model.
   * Supports English, Kannada, Hindi, and multi-lingual voice detection.
   */
  public async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/webm',
    preferredLanguage?: 'en' | 'kn' | 'auto'
  ): Promise<DeepgramTranscriptionResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Deepgram API key is not configured.');
    }

    const queryParams = new URLSearchParams({
      model: 'nova-2',
      smart_format: 'true',
      punctuate: 'true',
    });

    if (preferredLanguage === 'kn') {
      queryParams.append('language', 'kn');
    } else if (preferredLanguage === 'en') {
      queryParams.append('language', 'en-IN');
    } else {
      queryParams.append('detect_language', 'true');
    }

    const targetUrl = `${this.baseUrl}?${queryParams.toString()}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': mimeType || 'audio/webm',
      },
      body: audioBuffer,
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error || data.message || `Deepgram error (${response.status})`;
      throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }

    const channel = data.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const transcript = alternative?.transcript?.trim() || '';
    const confidence = alternative?.confidence || 0;
    const detectedLanguage = channel?.detected_language;
    const duration = data.metadata?.duration;

    return {
      transcript,
      confidence,
      detectedLanguage,
      duration,
    };
  }
}

export const deepgramService = new DeepgramService();
