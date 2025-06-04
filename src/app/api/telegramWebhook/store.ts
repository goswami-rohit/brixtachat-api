// src/app/api/telegramWebhook/store.ts

type Message = { text: string; from: string };

class SessionMessageStore {
  private sessions = new Map<string, Message[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private maxMessagesPerSession = 100;
  private sessionTimeoutMs = 5 * 60 * 1000; // 5 min inactivity timeout

  add(sessionId: string, message: Message) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }

    const messages = this.sessions.get(sessionId)!;
    messages.push(message);

    if (messages.length > this.maxMessagesPerSession) {
      messages.shift(); // Remove oldest message to keep max limit
    }

    // Reset inactivity timer for session
    if (this.timers.has(sessionId)) {
      clearTimeout(this.timers.get(sessionId)!);
    }

    this.timers.set(
      sessionId,
      setTimeout(() => {
        this.sessions.delete(sessionId);
        this.timers.delete(sessionId);
        console.log(`Session ${sessionId} cleared due to inactivity.`);
      }, this.sessionTimeoutMs)
    );
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId) || [];
  }

  findSessionForBotReply(chatId: string): string | null {
    const sessionIds = Array.from(this.sessions.keys());
    return sessionIds.length > 0 ? sessionIds[sessionIds.length - 1] : null;
  }
  
  clear(sessionId: string) {
    this.sessions.delete(sessionId);
    if (this.timers.has(sessionId)) {
      clearTimeout(this.timers.get(sessionId)!);
      this.timers.delete(sessionId);
    }
  }
}

export const messageStore = new SessionMessageStore();
