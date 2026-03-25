export interface PuzzleboxClientConfig {
  baseUrl: string;
  tenant: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  jwt?: string;
}

export interface TodayRoundPayload {
  id: string;
  position: number;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  metadata?: Record<string, unknown>;
}

export interface TodayPayload {
  edition_id: string;
  rounds: TodayRoundPayload[];
  existing_session?: { id: string } | null;
}

export interface RespondPayload {
  positions_correct?: boolean[];
  score?: number;
  correct_answer?: { order?: string[] };
  metadata?: Record<string, unknown>;
}

export class PuzzleboxClient {
  private readonly baseUrl: string;
  private readonly tenant: string;
  private jwt: string | undefined;

  constructor(config: PuzzleboxClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.tenant = config.tenant;
  }

  async authAnonymous(timezone: string): Promise<{ jwt: string; player_id: string }> {
    const payload = await this.request<{ jwt: string; player_id: string }>('/api/v1/auth/anonymous', {
      method: 'POST',
      body: { timezone }
    });

    this.jwt = payload.jwt;
    return payload;
  }

  getToday(slug: string): Promise<TodayPayload> {
    return this.request<TodayPayload>(`/api/v1/games/${slug}/today`, { method: 'GET' });
  }

  startSession(editionId: string): Promise<{ session_id: string }> {
    return this.request<{ session_id: string }>('/api/v1/sessions', {
      method: 'POST',
      body: { edition_id: editionId }
    });
  }

  respond(sessionId: string, payload: { round_id: string; answer: { order: string[] } }): Promise<RespondPayload> {
    return this.request<RespondPayload>(`/api/v1/sessions/${sessionId}/respond`, {
      method: 'POST',
      body: payload
    });
  }

  completeSession(sessionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/v1/sessions/${sessionId}/complete`, {
      method: 'POST'
    });
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-Tenant', this.tenant);

    if (options.jwt ?? this.jwt) {
      headers.set('Authorization', `Bearer ${options.jwt ?? this.jwt}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!response.ok) {
      const message = typeof payload.error === 'string' ? payload.error : `http_error_${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }
}
