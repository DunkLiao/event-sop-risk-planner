import { expect, it, vi } from 'vitest';
import { EventScale, EventType, type EventInfo } from '../../../types/event.js';
import { GenerationService } from '../generationService.js';

const eventInfo: EventInfo = { id: 'e1', name: '論壇', type: EventType.CONFERENCE, scale: EventScale.MEDIUM, startDate: '2026-08-01', endDate: '2026-08-01', location: '台北', description: '年度論壇', attendees: 100, createdAt: '2026-01-01', updatedAt: '2026-01-01' };

it('builds prompts and returns a parsed SOP document', async () => {
  const generateCompletion = vi.fn().mockResolvedValue({ content: JSON.stringify({ sections: [{ title: '準備', content: '場勘', tasks: [] }], timeline: [], checklist: [] }), provider: 'openai', model: 'test' });
  const service = new GenerationService({ generateCompletion } as never);
  const result = await service.generateSOP({ eventInfo });
  expect(generateCompletion).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining('論壇'), systemPrompt: expect.any(String) }));
  expect(result.eventId).toBe('e1');
  expect(result.sections[0].title).toBe('準備');
});
