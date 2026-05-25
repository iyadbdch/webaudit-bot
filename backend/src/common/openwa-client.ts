import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OpenwaClient {
  private apiUrl: string;
  private apiKey: string;
  private sessionId: string;
  private enabled: boolean;

  constructor(private config: ConfigService) {
    const wa = config.get('whatsapp');
    this.enabled = wa.enabled;
    const openwa = config.get('openwa');
    this.apiUrl = openwa.apiUrl;
    this.apiKey = openwa.apiKey;
    this.sessionId = openwa.sessionId;
  }

  async sendText(chatId: string, text: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      await axios.post(
        `${this.apiUrl}/sessions/${this.sessionId}/messages/send-text`,
        { chatId, text },
        { headers: { 'X-API-Key': this.apiKey } },
      );
      return true;
    } catch (err) {
      console.error('OpenWA sendText failed:', err.message);
      return false;
    }
  }

  async sendMedia(chatId: string, text: string, mediaUrl: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      await axios.post(
        `${this.apiUrl}/sessions/${this.sessionId}/messages/send-media`,
        { chatId, text, mediaUrl },
        { headers: { 'X-API-Key': this.apiKey } },
      );
      return true;
    } catch (err) {
      console.error('OpenWA sendMedia failed:', err.message);
      return false;
    }
  }
}
