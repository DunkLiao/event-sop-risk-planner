import { describe, expect, it } from 'vitest';
import type { Template } from '../../types/settings';
import { cloneTemplateForImport } from '../template';

const template: Template = {
  id: 'template-1',
  name: '年度論壇範本',
  type: 'sop',
  eventType: 'conference',
  content: {
    sopTemplate: {
      eventName: '年度論壇',
      sections: [],
      timeline: [],
      checklist: [],
    },
  },
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('cloneTemplateForImport', () => {
  it('creates a new non-default imported template copy with a unique id and name', () => {
    const imported = cloneTemplateForImport(template, [template]);

    expect(imported.id).not.toBe(template.id);
    expect(imported.name).toBe('年度論壇範本（匯入副本）');
    expect(imported.isDefault).toBe(false);
    expect(imported.content).toEqual(template.content);
    expect(imported.createdAt).not.toBe(template.createdAt);
  });

  it('increments imported copy names when the first copy name already exists', () => {
    const imported = cloneTemplateForImport(template, [
      template,
      { ...template, id: 'template-2', name: '年度論壇範本（匯入副本）' },
    ]);

    expect(imported.name).toBe('年度論壇範本（匯入副本） 2');
  });
});
