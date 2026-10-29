import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ override: true });

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export class ElevenLabsService {
  private apiKey: string;
  private defaultVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel (clear, friendly natural assistant)
  private audioCache = new Map<string, { buffer: Buffer; mimeType: string; createdAt: number }>();

  constructor() {
    this.apiKey = (process.env.ELEVENLABS_API_KEY || '').trim();
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  public getDefaultVoiceId(): string {
    return this.defaultVoiceId;
  }

  public setDefaultVoiceId(voiceId: string) {
    if (voiceId) this.defaultVoiceId = voiceId;
  }

  /**
   * Synthesize text to speech using ElevenLabs API
   */
  public async synthesize(
    text: string,
    voiceId?: string
  ): Promise<{ audioBuffer: Buffer; mimeType: string; audioId: string }> {
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('Text to synthesize cannot be empty');
    }

    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key is not configured yet. Please provide your ElevenLabs API Key in Voice Settings.');
    }

    const activeVoice = voiceId || this.defaultVoiceId;
    const cacheKey = crypto.createHash('md5').update(`${activeVoice}:${cleanText}`).digest('hex');

    // Check memory cache
    const cached = this.audioCache.get(cacheKey);
    if (cached) {
      return { audioBuffer: cached.buffer, mimeType: cached.mimeType, audioId: cacheKey };
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${activeVoice}?optimize_streaming_latency=3&output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2', // Great support for English, Kannada & Indian accents
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs TTS Error (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const mimeType = 'audio/mpeg';

    // Store in cache (limit to 100 entries)
    if (this.audioCache.size > 100) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey) this.audioCache.delete(oldestKey);
    }
    this.audioCache.set(cacheKey, { buffer: audioBuffer, mimeType, createdAt: Date.now() });

    return { audioBuffer, mimeType, audioId: cacheKey };
  }

  public getCachedAudio(audioId: string): { buffer: Buffer; mimeType: string } | null {
    const cached = this.audioCache.get(audioId);
    return cached ? { buffer: cached.buffer, mimeType: cached.mimeType } : null;
  }

  /**
   * Fetch available voices from ElevenLabs account
   */
  public async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.isConfigured()) {
      // Default curated popular voices
      return [
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Warm & Engaging Assistant)', category: 'premade' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Empathetic & Clear)', category: 'premade' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Calm & Professional)', category: 'premade' },
        { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Smooth & Helpful)', category: 'premade' },
        { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Deep & Authoritative)', category: 'premade' },
        { voice_id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Expressive British)', category: 'premade' },
      ];
    }

    try {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch voices: ${res.statusText}`);
      }

      const data = await res.json();
      return (data.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        description: v.description,
        preview_url: v.preview_url,
        labels: v.labels,
      }));
    } catch (err: any) {
      console.warn('[ElevenLabs] Failed to fetch voices list:', err.message);
      return [];
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
