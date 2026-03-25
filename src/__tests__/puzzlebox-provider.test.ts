import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPuzzleboxProvider } from '../data/puzzlebox-provider';

function jsonResponse(payload: Record<string, unknown>, ok = true, status = 200): Response {
  return {
    ok,
    status,
    text: async () => JSON.stringify(payload)
  } as unknown as Response;
}

describe('puzzlebox provider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps today + respond payloads into drift domain shape', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValueOnce(jsonResponse({ jwt: 'jwt-1', player_id: 'player-1' }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        edition_id: 'edition-1',
        rounds: [
          {
            id: 'round-1',
            position: 1,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'A' },
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
              { key: 'd', label: 'D' }
            ],
            metadata: {
              theme: 'Theme',
              reveal: [
                { key: 'a', year: '1', description: 'A' },
                { key: 'b', year: '2', description: 'B' },
                { key: 'c', year: '3', description: 'C' },
                { key: 'd', year: '4', description: 'D' }
              ]
            }
          },
          {
            id: 'round-2',
            position: 2,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'A' },
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
              { key: 'd', label: 'D' }
            ],
            metadata: {
              theme: 'Theme',
              reveal: [
                { key: 'a', year: '1', description: 'A' },
                { key: 'b', year: '2', description: 'B' },
                { key: 'c', year: '3', description: 'C' },
                { key: 'd', year: '4', description: 'D' }
              ]
            }
          },
          {
            id: 'round-3',
            position: 3,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'A' },
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
              { key: 'd', label: 'D' }
            ],
            metadata: {
              theme: 'Theme',
              reveal: [
                { key: 'a', year: '1', description: 'A' },
                { key: 'b', year: '2', description: 'B' },
                { key: 'c', year: '3', description: 'C' },
                { key: 'd', year: '4', description: 'D' }
              ]
            }
          },
          {
            id: 'round-4',
            position: 4,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'A' },
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
              { key: 'd', label: 'D' }
            ],
            metadata: {
              theme: 'Theme',
              reveal: [
                { key: 'a', year: '1', description: 'A' },
                { key: 'b', year: '2', description: 'B' },
                { key: 'c', year: '3', description: 'C' },
                { key: 'd', year: '4', description: 'D' }
              ]
            }
          },
          {
            id: 'round-5',
            position: 5,
            prompt: 'Sort oldest to newest',
            options: [
              { key: 'a', label: 'A' },
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
              { key: 'd', label: 'D' }
            ],
            metadata: {
              theme: 'Theme',
              reveal: [
                { key: 'a', year: '1', description: 'A' },
                { key: 'b', year: '2', description: 'B' },
                { key: 'c', year: '3', description: 'C' },
                { key: 'd', year: '4', description: 'D' }
              ]
            }
          }
        ]
      })
    );
    fetchMock.mockResolvedValueOnce(jsonResponse({ session_id: 'session-1' }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        positions_correct: [true, false, true, false],
        score: 2,
        correct_answer: { order: ['a', 'b', 'c', 'd'] },
        metadata: {
          reveal: [
            { key: 'a', year: '1', description: 'A' },
            { key: 'b', year: '2', description: 'B' },
            { key: 'c', year: '3', description: 'C' },
            { key: 'd', year: '4', description: 'D' }
          ]
        }
      })
    );

    const provider = createPuzzleboxProvider({
      baseUrl: 'https://api.example.com',
      tenant: 'demo',
      gameSlug: 'drift'
    });

    const session = await provider.loadSession('seed-a');
    expect(session.sessionRef).toBe('session-1');
    expect(session.rounds).toHaveLength(5);
    expect(session.rounds[0].theme).toBe('Theme');

    const result = await provider.submitRound({
      round: session.rounds[0],
      order: ['b', 'a', 'c', 'd'],
      sessionRef: session.sessionRef
    });

    expect(result.roundScore).toBe(2);
    expect(result.positionsCorrect).toEqual([true, false, true, false]);
    expect(result.canonicalOrder).toEqual(['a', 'b', 'c', 'd']);
    expect(result.reveal).toHaveLength(4);
  });

  it('throws clearly when today metadata is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValueOnce(jsonResponse({ jwt: 'jwt-1', player_id: 'player-1' }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        edition_id: 'edition-1',
        rounds: [
          {
            id: 'round-1',
            position: 1,
            prompt: 'Prompt',
            options: [
              { key: 'a', label: 'A' },
              { key: 'b', label: 'B' },
              { key: 'c', label: 'C' },
              { key: 'd', label: 'D' }
            ]
          }
        ]
      })
    );

    const provider = createPuzzleboxProvider({
      baseUrl: 'https://api.example.com',
      tenant: 'demo',
      gameSlug: 'drift'
    });

    await expect(provider.loadSession('seed-a')).rejects.toThrow('missing_round_metadata:today:round-1');
  });
});
