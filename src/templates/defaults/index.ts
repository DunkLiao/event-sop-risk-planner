import { EventScale, EventType, TaskStatus } from '../../types/event';
import { MitigationApproach, RiskCategory, RiskSeverity, RiskStatus } from '../../types/risk';
import type { Template } from '../../types/settings';

const DEFAULT_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'builtin-conference-template',
    name: '會議活動範本',
    type: 'full',
    eventType: EventType.CONFERENCE,
    isDefault: true,
    createdAt: DEFAULT_CREATED_AT,
    content: {
      eventSettings: {
        type: EventType.CONFERENCE,
        scale: EventScale.MEDIUM,
        location: '會議中心',
        attendees: 150,
        description: '適用於論壇、研討會與企業會議等商務活動。',
      },
      sopTemplate: {
        sections: [
          {
            id: 'conference-section-1',
            title: '前置準備',
            order: 1,
            content: '確認講者、議程、報到系統與場地設備。',
            tasks: [
              {
                id: 'conference-task-1',
                title: '確認講者名單',
                description: '完成講者邀請、議程順序與簡報收件。',
                responsible: '內容統籌',
                status: TaskStatus.PENDING,
              },
            ],
          },
        ],
        checklist: [
          { id: 'conference-check-1', category: '設備', item: '完成投影與音訊測試', checked: false },
        ],
        timeline: [
          {
            id: 'conference-timeline-1',
            date: '活動前 7 天',
            milestone: '議程凍結',
            description: '鎖定議程版本並通知所有講者與工作人員。',
          },
        ],
      },
      riskTemplate: {
        risks: [
          {
            id: 'conference-risk-1',
            category: RiskCategory.OPERATIONAL,
            title: '設備故障',
            description: '投影、收音或網路設備異常影響議程進行。',
            likelihood: 3,
            impact: 4,
            riskScore: 12,
            riskLevel: RiskSeverity.MEDIUM,
            mitigation: {
              approach: MitigationApproach.REDUCE,
              actions: ['準備備援筆電與投影設備', '安排專責 AV 工程師'],
              timeline: '活動前 3 天完成演練',
              resources: ['備援設備', '場控人員'],
            },
            status: RiskStatus.IDENTIFIED,
          },
        ],
      },
    },
  },
  {
    id: 'builtin-exhibition-template',
    name: '展覽活動範本',
    type: 'full',
    eventType: EventType.EXHIBITION,
    isDefault: true,
    createdAt: DEFAULT_CREATED_AT,
    content: {
      eventSettings: {
        type: EventType.EXHIBITION,
        scale: EventScale.LARGE,
        location: '展覽館',
        attendees: 1200,
        description: '適用於品牌展、博覽會與大型展示活動。',
      },
      sopTemplate: {
        sections: [
          {
            id: 'exhibition-section-1',
            title: '進撤場管理',
            order: 1,
            content: '建立攤位進撤場時程、動線與安全規範。',
            tasks: [
              {
                id: 'exhibition-task-1',
                title: '攤商進場排程',
                description: '分批通知攤商布展時段與卸貨區規則。',
                responsible: '展務經理',
                status: TaskStatus.PENDING,
              },
            ],
          },
        ],
      },
      riskTemplate: {
        risks: [
          {
            id: 'exhibition-risk-1',
            category: RiskCategory.LOGISTICAL,
            title: '人流壅塞',
            description: '熱門展區或尖峰時段造成動線堵塞。',
            likelihood: 4,
            impact: 4,
            riskScore: 16,
            riskLevel: RiskSeverity.HIGH,
            mitigation: {
              approach: MitigationApproach.REDUCE,
              actions: ['設計單向導覽動線', '熱門展區增派引導人員'],
              timeline: '開展前完成現場演練',
              resources: ['引導牌', '保全人員'],
            },
            status: RiskStatus.IDENTIFIED,
          },
        ],
      },
    },
  },
  {
    id: 'builtin-concert-template',
    name: '演唱會活動範本',
    type: 'full',
    eventType: EventType.CONCERT,
    isDefault: true,
    createdAt: DEFAULT_CREATED_AT,
    content: {
      eventSettings: {
        type: EventType.CONCERT,
        scale: EventScale.EXTRA_LARGE,
        location: '室內體育館',
        attendees: 5000,
        description: '適用於大型演出、音樂會與售票表演。',
      },
      sopTemplate: {
        sections: [
          {
            id: 'concert-section-1',
            title: '觀眾入場',
            order: 1,
            content: '規劃分區驗票、安檢與觀眾導流。',
            tasks: [
              {
                id: 'concert-task-1',
                title: '驗票口分流',
                description: '依票種與區域安排對應入口，減少尖峰排隊。',
                responsible: '票務主管',
                status: TaskStatus.PENDING,
              },
            ],
          },
        ],
      },
      riskTemplate: {
        risks: [
          {
            id: 'concert-risk-1',
            category: RiskCategory.SAFETY,
            title: '群眾推擠',
            description: '尖峰進出場時段可能發生觀眾推擠。',
            likelihood: 4,
            impact: 5,
            riskScore: 20,
            riskLevel: RiskSeverity.HIGH,
            mitigation: {
              approach: MitigationApproach.REDUCE,
              actions: ['設置蛇形排隊', '保全與醫護站前置部署'],
              timeline: '活動前完成全場模擬',
              resources: ['保全', '醫護站', '欄杆'],
            },
            status: RiskStatus.IDENTIFIED,
          },
        ],
      },
    },
  },
  {
    id: 'builtin-sports-template',
    name: '體育賽事範本',
    type: 'full',
    eventType: EventType.SPORTS,
    isDefault: true,
    createdAt: DEFAULT_CREATED_AT,
    content: {
      eventSettings: {
        type: EventType.SPORTS,
        scale: EventScale.LARGE,
        location: '體育場',
        attendees: 3000,
        description: '適用於球賽、競賽與大型觀賽活動。',
      },
      sopTemplate: {
        sections: [
          {
            id: 'sports-section-1',
            title: '賽務執行',
            order: 1,
            content: '統整選手報到、裁判協作與觀眾分區動線。',
            tasks: [
              {
                id: 'sports-task-1',
                title: '選手報到核對',
                description: '確認選手資格、裝備與暖身時程。',
                responsible: '賽務組',
                status: TaskStatus.PENDING,
              },
            ],
          },
        ],
      },
      riskTemplate: {
        risks: [
          {
            id: 'sports-risk-1',
            category: RiskCategory.HEALTH,
            title: '選手受傷',
            description: '競賽過程發生突發受傷或身體不適。',
            likelihood: 3,
            impact: 5,
            riskScore: 15,
            riskLevel: RiskSeverity.HIGH,
            mitigation: {
              approach: MitigationApproach.REDUCE,
              actions: ['場邊配置醫護人員', '建立緊急送醫流程'],
              timeline: '賽前完成動線確認',
              resources: ['醫護站', '擔架', '救護車'],
            },
            status: RiskStatus.IDENTIFIED,
          },
        ],
      },
    },
  },
];
