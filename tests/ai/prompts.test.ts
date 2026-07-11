import assert from 'node:assert/strict';
import test from 'node:test';
import { EventScale, EventType, TaskStatus } from '../../src/types/event.js';
import { MitigationApproach, RiskCategory, RiskSeverity, RiskStatus } from '../../src/types/risk.js';
import { buildRiskPrompts, buildSOPPrompts, interpolatePrompt } from '../../src/services/ai/prompts.js';
import { parseRiskResponse as parseRiskDocumentResponse, parseSOPResponse as parseSOPDocumentResponse } from '../../src/services/ai/parseAIResponse.js';
import {
  createFallbackRiskAssessment,
  createFallbackSOPDocument,
  postProcessRiskAssessment,
  postProcessSOPDocument,
} from '../../src/services/ai/postProcessors.js';
import { PromptTester } from '../../src/services/ai/promptTester.js';
import { PromptEffectTracker, selectPromptVersion } from '../../src/services/ai/promptVersions.js';
import { extractJsonPayload, parseRiskResponse, parseSOPResponse } from '../../src/services/ai/responseParser.js';
import { validateRiskAssessment, validateSOPDocument } from '../../src/services/ai/validators.js';

const sampleEventInfo = {
  id: 'event-1',
  name: '企業年度論壇',
  type: EventType.CONFERENCE,
  scale: EventScale.LARGE,
  startDate: '2026-08-15',
  endDate: '2026-08-15',
  location: '台北國際會議中心',
  description: '企業年度論壇，包含主題演講與交流時間。',
  attendees: 600,
  specialRequirements: '同步直播與 VIP 接待',
  createdAt: '2026-07-10T00:00:00.000Z',
  updatedAt: '2026-07-10T00:00:00.000Z',
};

test('buildSOPPrompts injects structured schema, examples and event-specific guidance', () => {
  const prompts = buildSOPPrompts({
    eventInfo: sampleEventInfo,
    options: {
      detailLevel: 'comprehensive',
      includeTimeline: true,
      includeChecklist: true,
    },
  });

  assert.match(prompts.systemPrompt, /只能輸出單一 JSON 物件/);
  assert.match(prompts.userPrompt, /"sections": \[/);
  assert.match(prompts.userPrompt, /Few-shot 範例/);
  assert.match(prompts.userPrompt, /講者接待、報到動線/);
  assert.match(prompts.userPrompt, /超大型|大型活動/);
});

test('buildRiskPrompts adjusts minimum risk depth by event scale', () => {
  const smallPrompts = buildRiskPrompts({
    eventInfo: { ...sampleEventInfo, scale: EventScale.SMALL, type: EventType.WORKSHOP },
  });
  const extraLargePrompts = buildRiskPrompts({
    eventInfo: { ...sampleEventInfo, scale: EventScale.EXTRA_LARGE, type: EventType.FESTIVAL },
  });

  assert.match(smallPrompts.userPrompt, /至少 4 項風險/);
  assert.match(extraLargePrompts.userPrompt, /至少 10 項風險/);
  assert.match(extraLargePrompts.userPrompt, /公共安全、跨單位協調、交通疏運/);
});

test('interpolatePrompt replaces missing values with 未提供', () => {
  const result = interpolatePrompt('活動名稱：{{name}}，預算：{{budget}}', {
    name: '新品發表會',
    budget: undefined,
  });

  assert.equal(result, '活動名稱：新品發表會，預算：未提供');
});

test('parseSOPResponse extracts JSON from markdown fences and normalizes fields', () => {
  const parsed = parseSOPResponse(`\`\`\`json
{
  "sections": [
    {
      "title": "前置準備",
      "order": 1,
      "content": "完成場地與人員準備",
      "tasks": [
        {
          "title": "確認音控設備",
          "description": "完成音控測試",
          "responsible": "技術組",
          "estimatedDuration": 45
        }
      ]
    }
  ],
  "timeline": [
    {
      "date": "活動前 1 天",
      "milestone": "總彩排",
      "description": "完成全流程走位"
    }
  ],
  "checklist": [
    {
      "category": "設備",
      "item": "音響設備測試完成",
      "checked": false
    }
  ]
}
\`\`\``);

  assert.equal(parsed.sections[0].tasks[0].status, 'pending');
  assert.equal(parsed.sections[0].estimatedDuration, 45);
  assert.equal(parsed.timeline[0].id, 'timeline-1');
  assert.equal(parsed.checklist[0].checked, false);
});

test('parseRiskResponse computes summary and validates mitigation data', () => {
  const parsed = parseRiskResponse(JSON.stringify({
    risks: [
      {
        category: 'safety',
        title: '入口人流壅塞',
        description: '報到時段可能發生排隊回堵',
        likelihood: 4,
        impact: 5,
        riskScore: 20,
        riskLevel: 'high',
        mitigation: {
          approach: 'reduce',
          actions: ['增設報到櫃台', '安排動線引導'],
          timeline: '活動前 2 天',
          resources: ['工作人員', '指示牌'],
        },
      },
      {
        category: 'technical',
        title: '直播中斷',
        description: '網路不穩可能造成直播中斷',
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: 'medium',
        mitigation: {
          approach: 'reduce',
          actions: ['準備備援網路'],
          timeline: '活動前 1 天',
          resources: ['5G 路由器'],
        },
      },
    ],
  }));

  assert.equal(parsed.risks[0].status, 'assessed');
  assert.equal(parsed.riskMatrix.cells[3][4].risks[0], 'risk-1');
  assert.equal(parsed.summary.totalRisks, 2);
  assert.deepEqual(parsed.summary.topRisks, ['risk-1', 'risk-2']);
});

test('parseSOPResponse repairs common JSON syntax issues and fills defaults', () => {
  const parsed = parseSOPResponse(`說明如下
{
  sections: [
    {
      title: '  活動執行  ',
      order: '2',
      content: '  依現場狀況調整流程  ',
      tasks: [
        {
          title: '確認主持人',
          description: '確認主持人到位',
        },
      ],
    },
  ],
}`);

  assert.equal(parsed.sections[0].title, '活動執行');
  assert.equal(parsed.sections[0].order, 2);
  assert.equal(parsed.sections[0].tasks[0].responsible, '待指派');
  assert.equal(parsed.sections[0].tasks[0].estimatedDuration, 30);
});

test('parseRiskResponse normalizes score range, severity and mitigation defaults', () => {
  const parsed = parseRiskResponse(JSON.stringify({
    risks: [
      {
        title: '供電中斷',
        description: '臨時用電異常',
        likelihood: '7',
        impact: 0,
        riskScore: 99,
        riskLevel: 'critical',
        mitigation: {
          actions: ['安排備援發電機'],
        },
      },
    ],
  }));

  assert.equal(parsed.risks[0].likelihood, 5);
  assert.equal(parsed.risks[0].impact, 1);
  assert.equal(parsed.risks[0].riskScore, 5);
  assert.equal(parsed.risks[0].riskLevel, 'low');
  assert.equal(parsed.risks[0].mitigation.timeline, '待確認');
});

test('parseAIResponse returns fallback SOP document when JSON cannot be parsed', async () => {
  const parsed = await parseSOPDocumentResponse('這是一段純文字回應，不是 JSON。', sampleEventInfo);

  assert.equal(parsed.eventId, sampleEventInfo.id);
  assert.equal(parsed.sections[0].title, 'AI 生成內容（待整理）');
  assert.equal(parsed.sections[0].tasks[0].title, '人工整理 AI 內容');
});

test('parseAIResponse throws detailed validation error when SOP structure is invalid', async () => {
  await assert.rejects(
    parseSOPDocumentResponse(JSON.stringify({ sections: [] }), sampleEventInfo),
    /SOP 結構驗證失敗|至少需要一個 section|建議重新生成/
  );
});

test('parseAIResponse builds normalized risk assessment document', async () => {
  const parsed = await parseRiskDocumentResponse(JSON.stringify({
    risks: [
      {
        id: '',
        category: 'technical',
        title: '  網路斷線  ',
        description: '  直播可能中斷  ',
        likelihood: 4,
        impact: 4,
        mitigation: {
          approach: 'reduce',
          actions: [' 準備備援網路 '],
          timeline: '2026-08-15T02:30:00Z',
          resources: [' 5G 路由器 '],
        },
      },
    ],
  }), sampleEventInfo);

  assert.equal(parsed.risks[0].id, 'risk-1');
  assert.equal(parsed.risks[0].title, '網路斷線');
  assert.equal(parsed.risks[0].riskScore, 16);
  assert.equal(parsed.summary.totalRisks, 1);
});

test('validators and postProcessors normalize ids, ordering and statistics', () => {
  const sop = postProcessSOPDocument({
    eventId: sampleEventInfo.id,
    eventName: sampleEventInfo.name,
    sections: [
      {
        id: '',
        title: ' 第二階段 ',
        order: 2,
        content: ' 內容二 ',
        tasks: [
          {
            id: '',
            title: ' 任務二 ',
            description: ' 描述二 ',
            responsible: ' 執行組 ',
            status: TaskStatus.PENDING,
          },
        ],
      },
      {
        id: '',
        title: ' 第一階段 ',
        order: 1,
        content: ' 內容一 ',
        tasks: [],
      },
    ],
    timeline: [],
    checklist: [],
    generatedAt: '2026-08-15T00:00:00Z',
  });
  const risk = postProcessRiskAssessment({
    eventId: sampleEventInfo.id,
    eventName: sampleEventInfo.name,
    risks: [
      {
        id: '',
        category: RiskCategory.OPERATIONAL,
        title: ' 場佈延誤 ',
        description: ' 影響開場 ',
        likelihood: 4,
        impact: 3,
        riskScore: 1,
        riskLevel: RiskSeverity.LOW,
        mitigation: {
          approach: MitigationApproach.REDUCE,
          actions: [' 提前進場 '],
          timeline: ' 活動前一天 ',
          resources: [' 工作人員 '],
        },
        status: RiskStatus.ASSESSED,
      },
    ],
    riskMatrix: createFallbackRiskAssessment('', sampleEventInfo).riskMatrix,
    summary: createFallbackRiskAssessment('', sampleEventInfo).summary,
    generatedAt: '2026-08-15T00:00:00Z',
  });

  const sopValidation = validateSOPDocument(sop);
  const riskValidation = validateRiskAssessment(risk);

  assert.equal(sop.sections[0].order, 1);
  assert.equal(sop.sections[0].id, 'section-2');
  assert.equal(sop.sections[1].tasks[0].id, 'section-1-task-1');
  assert.equal(sopValidation.isValid, true);
  assert.equal(sopValidation.warnings.includes('sections[0].tasks 為空'), true);
  assert.equal(risk.risks[0].riskScore, 12);
  assert.equal(risk.summary.risksBySeverity.medium, 1);
  assert.equal(riskValidation.isValid, true);
});

test('PromptTester records parseability and compares versions', async () => {
  const tester = new PromptTester(new PromptEffectTracker());
  const selectedVersion = selectPromptVersion('sop', 'latest');

  assert.equal(selectedVersion.id, 'sop-structured-v2');

  const results = await tester.runVariantTest('sop', { eventInfo: sampleEventInfo }, async ({ version }) => ({
    rawResponse:
      version.id === 'sop-legacy-v1'
        ? '這不是 JSON'
        : JSON.stringify({
            sections: [
              {
                title: '現場執行',
                order: 1,
                content: '依流程完成活動執行',
                tasks: [
                  {
                    title: '主持人就位',
                    description: '確認主持人與流程節奏',
                    responsible: '節目組',
                    estimatedDuration: 20,
                  },
                ],
              },
            ],
            timeline: [],
            checklist: [],
          }),
    latencyMs: version.id === 'sop-legacy-v1' ? 50 : 30,
  }));

  const ranked = tester.compareResults(results);

  assert.equal(ranked[0].versionId, 'sop-structured-v2');
  assert.equal(ranked[0].parseable, true);
  assert.equal(ranked[1].parseable, false);
  assert.equal(tester.getEffectTracker().getStats('sop').length, 2);
});

test('extractJsonPayload falls back to object slicing outside code fences', () => {
  const payload = extractJsonPayload('AI 結果如下：{"risks":[]}\n請查收');
  assert.equal(payload, '{"risks":[]}');
});

test('fallback builders create valid baseline documents', () => {
  const sop = createFallbackSOPDocument('請改由人工整理', sampleEventInfo);
  const risk = createFallbackRiskAssessment('請人工檢視風險', sampleEventInfo);

  assert.equal(validateSOPDocument(sop).isValid, true);
  assert.equal(validateRiskAssessment(risk).isValid, true);
});
