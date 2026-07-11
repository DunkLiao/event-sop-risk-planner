import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  TaskStatus,
  type ChecklistItem,
  type SOPDocument,
  type SOPSection,
  type SOPTask,
  type TimelineItem,
} from '../../types/event';
import { moveArrayItem } from '../../utils/resultEditing';

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const reorderSections = (sections: SOPSection[]) => sections.map((section, index) => ({ ...section, order: index + 1 }));

interface Props {
  document: SOPDocument;
  onChange: (document: SOPDocument) => void;
  disabled?: boolean;
}

export default function SOPEditor({ document, onChange, disabled }: Props) {
  const setSections = (sections: SOPSection[]) => onChange({ ...document, sections: reorderSections(sections) });
  const updateSection = (index: number, patch: Partial<SOPSection>) => {
    setSections(document.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };
  const addSection = () =>
    setSections([
      ...document.sections,
      { id: id('section'), title: '新章節', order: document.sections.length + 1, content: '', tasks: [] },
    ]);

  const addTask = (sectionIndex: number) =>
    updateSection(sectionIndex, {
      tasks: [
        ...document.sections[sectionIndex].tasks,
        { id: id('task'), title: '新任務', description: '', responsible: '', estimatedDuration: undefined, deadline: '', dependencies: [], status: TaskStatus.PENDING },
      ],
    });
  const updateTask = (sectionIndex: number, taskIndex: number, patch: Partial<SOPTask>) =>
    updateSection(sectionIndex, {
      tasks: document.sections[sectionIndex].tasks.map((task, index) => (index === taskIndex ? { ...task, ...patch } : task)),
    });

  const setTimeline = (timeline: TimelineItem[]) => onChange({ ...document, timeline });
  const setChecklist = (checklist: ChecklistItem[]) => onChange({ ...document, checklist });

  return (
    <Stack spacing={3}>
      {document.sections.map((section, sectionIndex) => (
        <Paper key={section.id} variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label={`章節 ${section.order}`}
                value={section.title}
                disabled={disabled}
                fullWidth
                onChange={event => updateSection(sectionIndex, { title: event.target.value })}
              />
              <Stack direction="row">
                <IconButton
                  aria-label="上移章節"
                  disabled={disabled || sectionIndex === 0}
                  onClick={() => setSections(moveArrayItem(document.sections, sectionIndex, sectionIndex - 1))}
                >
                  <KeyboardArrowUpRoundedIcon />
                </IconButton>
                <IconButton
                  aria-label="下移章節"
                  disabled={disabled || sectionIndex === document.sections.length - 1}
                  onClick={() => setSections(moveArrayItem(document.sections, sectionIndex, sectionIndex + 1))}
                >
                  <KeyboardArrowDownRoundedIcon />
                </IconButton>
                <IconButton
                  aria-label="刪除章節"
                  color="error"
                  disabled={disabled}
                  onClick={() => setSections(document.sections.filter((_, index) => index !== sectionIndex))}
                >
                  <DeleteRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 160px' } }}>
              <TextField
                label="章節說明"
                value={section.content}
                disabled={disabled}
                multiline
                minRows={2}
                onChange={event => updateSection(sectionIndex, { content: event.target.value })}
              />
              <TextField
                label="預估工時（分鐘）"
                type="number"
                value={section.estimatedDuration ?? ''}
                disabled={disabled}
                onChange={event =>
                  updateSection(sectionIndex, {
                    estimatedDuration: event.target.value === '' ? undefined : Number(event.target.value),
                  })
                }
              />
            </Box>
            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              任務與責任分工
            </Typography>
            {section.tasks.map((task, taskIndex) => (
              <Box
                key={task.id}
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: '1.2fr 1.8fr 1fr 120px 1fr auto' },
                }}
              >
                <TextField
                  label="任務"
                  value={task.title}
                  disabled={disabled}
                  onChange={event => updateTask(sectionIndex, taskIndex, { title: event.target.value })}
                />
                <TextField
                  label="說明"
                  value={task.description}
                  disabled={disabled}
                  onChange={event => updateTask(sectionIndex, taskIndex, { description: event.target.value })}
                />
                <TextField
                  label="負責人"
                  value={task.responsible}
                  disabled={disabled}
                  onChange={event => updateTask(sectionIndex, taskIndex, { responsible: event.target.value })}
                />
                <TextField
                  label="預估工時"
                  type="number"
                  value={task.estimatedDuration ?? ''}
                  disabled={disabled}
                  onChange={event =>
                    updateTask(sectionIndex, taskIndex, {
                      estimatedDuration: event.target.value === '' ? undefined : Number(event.target.value),
                    })
                  }
                />
                <TextField
                  label="截止日期"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={task.deadline ?? ''}
                  disabled={disabled}
                  onChange={event => updateTask(sectionIndex, taskIndex, { deadline: event.target.value })}
                />
                <Stack direction="row">
                  <IconButton
                    aria-label="上移任務"
                    disabled={disabled || taskIndex === 0}
                    onClick={() => updateSection(sectionIndex, { tasks: moveArrayItem(section.tasks, taskIndex, taskIndex - 1) })}
                  >
                    <KeyboardArrowUpRoundedIcon />
                  </IconButton>
                  <IconButton
                    aria-label="下移任務"
                    disabled={disabled || taskIndex === section.tasks.length - 1}
                    onClick={() => updateSection(sectionIndex, { tasks: moveArrayItem(section.tasks, taskIndex, taskIndex + 1) })}
                  >
                    <KeyboardArrowDownRoundedIcon />
                  </IconButton>
                  <IconButton
                    aria-label="刪除任務"
                    color="error"
                    disabled={disabled}
                    onClick={() => updateSection(sectionIndex, { tasks: section.tasks.filter((_, index) => index !== taskIndex) })}
                  >
                    <DeleteRoundedIcon />
                  </IconButton>
                </Stack>
                <TextField
                  sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}
                  label="相依任務（以逗號分隔）"
                  value={(task.dependencies ?? []).join(', ')}
                  disabled={disabled}
                  onChange={event =>
                    updateTask(sectionIndex, taskIndex, {
                      dependencies: event.target.value
                        .split(',')
                        .map(item => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <TextField
                  select
                  label="狀態"
                  value={task.status}
                  disabled={disabled}
                  onChange={event => updateTask(sectionIndex, taskIndex, { status: event.target.value as TaskStatus })}
                >
                  {Object.values(TaskStatus).map(status => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            ))}
            <Button startIcon={<AddRoundedIcon />} disabled={disabled} onClick={() => addTask(sectionIndex)}>
              新增任務
            </Button>
          </Stack>
        </Paper>
      ))}
      <Button variant="outlined" startIcon={<AddRoundedIcon />} disabled={disabled} onClick={addSection}>
        新增章節
      </Button>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">時程</Typography>
          {document.timeline.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr 2fr auto' },
              }}
            >
              <TextField
                label="日期"
                value={item.date}
                onChange={event => setTimeline(document.timeline.map((value, i) => (i === index ? { ...value, date: event.target.value } : value)))}
              />
              <TextField
                label="時間"
                value={item.time ?? ''}
                onChange={event => setTimeline(document.timeline.map((value, i) => (i === index ? { ...value, time: event.target.value } : value)))}
              />
              <TextField
                label="里程碑"
                value={item.milestone}
                onChange={event =>
                  setTimeline(document.timeline.map((value, i) => (i === index ? { ...value, milestone: event.target.value } : value)))
                }
              />
              <TextField
                label="說明"
                value={item.description}
                onChange={event =>
                  setTimeline(document.timeline.map((value, i) => (i === index ? { ...value, description: event.target.value } : value)))
                }
              />
              <Stack direction="row" sx={{ alignItems: 'center' }}>
                <IconButton
                  aria-label="上移時程"
                  disabled={disabled || index === 0}
                  onClick={() => setTimeline(moveArrayItem(document.timeline, index, index - 1))}
                >
                  <KeyboardArrowUpRoundedIcon />
                </IconButton>
                <IconButton
                  aria-label="下移時程"
                  disabled={disabled || index === document.timeline.length - 1}
                  onClick={() => setTimeline(moveArrayItem(document.timeline, index, index + 1))}
                >
                  <KeyboardArrowDownRoundedIcon />
                </IconButton>
                <IconButton aria-label="刪除時程" onClick={() => setTimeline(document.timeline.filter((_, i) => i !== index))}>
                  <DeleteRoundedIcon />
                </IconButton>
              </Stack>
            </Box>
          ))}
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => setTimeline([...document.timeline, { id: id('timeline'), date: '', milestone: '新里程碑', description: '' }])}
          >
            新增時程
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">檢查清單</Typography>
          {document.checklist.map((item, index) => (
            <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
              <Checkbox
                checked={item.checked}
                onChange={event => setChecklist(document.checklist.map((value, i) => (i === index ? { ...value, checked: event.target.checked } : value)))}
              />
              <TextField
                label="分類"
                value={item.category}
                onChange={event => setChecklist(document.checklist.map((value, i) => (i === index ? { ...value, category: event.target.value } : value)))}
              />
              <TextField
                fullWidth
                label="項目"
                value={item.item}
                onChange={event => setChecklist(document.checklist.map((value, i) => (i === index ? { ...value, item: event.target.value } : value)))}
              />
              <Stack direction="row">
                <IconButton
                  aria-label="上移檢查項目"
                  disabled={disabled || index === 0}
                  onClick={() => setChecklist(moveArrayItem(document.checklist, index, index - 1))}
                >
                  <KeyboardArrowUpRoundedIcon />
                </IconButton>
                <IconButton
                  aria-label="下移檢查項目"
                  disabled={disabled || index === document.checklist.length - 1}
                  onClick={() => setChecklist(moveArrayItem(document.checklist, index, index + 1))}
                >
                  <KeyboardArrowDownRoundedIcon />
                </IconButton>
                <IconButton aria-label="刪除檢查項目" onClick={() => setChecklist(document.checklist.filter((_, i) => i !== index))}>
                  <DeleteRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>
          ))}
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => setChecklist([...document.checklist, { id: id('check'), category: '一般', item: '新檢查項目', checked: false }])}
          >
            新增檢查項目
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
