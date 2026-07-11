import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import {
  MitigationApproach,
  RiskCategory,
  RiskLevel,
  RiskSeverity,
  RiskStatus,
  type Risk,
  type RiskAssessment,
} from '../../types/risk';
import { moveArrayItem, rebuildRiskAssessment } from '../../utils/resultEditing';

const severityColor: Record<RiskSeverity, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

interface Props {
  assessment: RiskAssessment;
  onChange: (assessment: RiskAssessment) => void;
  disabled?: boolean;
}

export default function RiskEditor({ assessment, onChange, disabled }: Props) {
  const setRisks = (risks: Risk[]) => onChange(rebuildRiskAssessment({ ...assessment, risks }));
  const update = (index: number, patch: Partial<Risk>) =>
    setRisks(assessment.risks.map((risk, i) => (i === index ? { ...risk, ...patch } : risk)));
  const add = () =>
    setRisks([
      ...assessment.risks,
      {
        id: `risk-${crypto.randomUUID()}`,
        category: RiskCategory.OTHER,
        title: '新風險',
        description: '',
        likelihood: RiskLevel.MEDIUM,
        impact: RiskLevel.MEDIUM,
        riskScore: 9,
        riskLevel: RiskSeverity.MEDIUM,
        mitigation: { approach: MitigationApproach.REDUCE, actions: [], timeline: '', resources: [], contingencyPlan: '' },
        responsiblePerson: '',
        status: RiskStatus.IDENTIFIED,
      },
    ]);

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="h6">風險摘要：{assessment.summary.totalRisks} 項</Typography>
          {Object.entries(assessment.summary.risksBySeverity).map(([key, count]) => (
            <Chip key={key} label={`${key}: ${count}`} color={severityColor[key as RiskSeverity]} variant="outlined" />
          ))}
        </Stack>
      </Paper>
      {assessment.risks.map((risk, index) => (
        <Paper key={risk.id} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField fullWidth label="風險名稱" value={risk.title} disabled={disabled} onChange={event => update(index, { title: event.target.value })} />
              <TextField
                select
                label="分類"
                value={risk.category}
                disabled={disabled}
                sx={{ minWidth: 150 }}
                onChange={event => update(index, { category: event.target.value as RiskCategory })}
              >
                {Object.values(RiskCategory).map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row">
                <IconButton aria-label="上移風險" disabled={disabled || index === 0} onClick={() => setRisks(moveArrayItem(assessment.risks, index, index - 1))}>
                  <KeyboardArrowUpRoundedIcon />
                </IconButton>
                <IconButton
                  aria-label="下移風險"
                  disabled={disabled || index === assessment.risks.length - 1}
                  onClick={() => setRisks(moveArrayItem(assessment.risks, index, index + 1))}
                >
                  <KeyboardArrowDownRoundedIcon />
                </IconButton>
                <IconButton aria-label="刪除風險" color="error" disabled={disabled} onClick={() => setRisks(assessment.risks.filter((_, i) => i !== index))}>
                  <DeleteRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>
            <TextField label="說明" value={risk.description} multiline minRows={2} disabled={disabled} onChange={event => update(index, { description: event.target.value })} />
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' } }}>
              <TextField select label="可能性" value={risk.likelihood} onChange={event => update(index, { likelihood: Number(event.target.value) as RiskLevel })}>
                {Object.values(RiskLevel)
                  .filter(value => typeof value === 'number')
                  .map(value => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField select label="影響" value={risk.impact} onChange={event => update(index, { impact: Number(event.target.value) as RiskLevel })}>
                {Object.values(RiskLevel)
                  .filter(value => typeof value === 'number')
                  .map(value => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField label="分數" value={risk.riskScore} slotProps={{ input: { readOnly: true } }} />
              <TextField label="等級" value={risk.riskLevel} slotProps={{ input: { readOnly: true } }} />
              <TextField label="負責人" value={risk.responsiblePerson ?? ''} onChange={event => update(index, { responsiblePerson: event.target.value })} />
            </Box>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <TextField
                select
                label="狀態"
                value={risk.status}
                onChange={event => update(index, { status: event.target.value as RiskStatus })}
              >
                {Object.values(RiskStatus).map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="資源需求（每行一項）"
                multiline
                minRows={2}
                value={(risk.mitigation.resources ?? []).join('\n')}
                onChange={event =>
                  update(index, {
                    mitigation: {
                      ...risk.mitigation,
                      resources: event.target.value.split('\n').map(item => item.trim()).filter(Boolean),
                    },
                  })
                }
              />
            </Box>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' } }}>
              <TextField select label="應對方式" value={risk.mitigation.approach} onChange={event => update(index, { mitigation: { ...risk.mitigation, approach: event.target.value as MitigationApproach } })}>
                {Object.values(MitigationApproach).map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="應對行動（每行一項）"
                multiline
                minRows={3}
                value={risk.mitigation.actions.join('\n')}
                onChange={event =>
                  update(index, {
                    mitigation: {
                      ...risk.mitigation,
                      actions: event.target.value.split('\n').filter(Boolean),
                    },
                  })
                }
              />
              <TextField label="應對時程" value={risk.mitigation.timeline} onChange={event => update(index, { mitigation: { ...risk.mitigation, timeline: event.target.value } })} />
            </Box>
            <TextField
              label="應變備案"
              multiline
              minRows={2}
              value={risk.mitigation.contingencyPlan ?? ''}
              onChange={event => update(index, { mitigation: { ...risk.mitigation, contingencyPlan: event.target.value } })}
            />
          </Stack>
        </Paper>
      ))}
      <Button variant="outlined" startIcon={<AddRoundedIcon />} disabled={disabled} onClick={add}>
        新增風險
      </Button>
    </Stack>
  );
}
