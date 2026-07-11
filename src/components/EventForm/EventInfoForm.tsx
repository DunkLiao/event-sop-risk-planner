import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import { Box, Chip, MenuItem, Paper, TextField, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import type { AutoSaveStatus } from '../../hooks/useAutoSave';
import type { UseEventFormReturn } from '../../hooks/useEventForm';
import { EVENT_SCALE_OPTIONS, EVENT_TYPE_OPTIONS } from '../../utils/constants';

type EventInfoFormProps = Pick<UseEventFormReturn, 'values' | 'errors' | 'handleFieldBlur' | 'handleFieldChange'> & {
  disabled?: boolean;
  autoSaveStatus?: AutoSaveStatus;
  autoSaveMessage?: string;
};

const sectionCardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 3,
  border: 1,
  borderColor: 'divider',
  boxShadow: 'none',
  bgcolor: 'background.paper',
};

const inputGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    md: 'repeat(2, minmax(0, 1fr))',
  },
};

const fullWidthSx = {
  gridColumn: {
    xs: 'span 1',
    md: 'span 2',
  },
};

const AUTO_SAVE_STATUS_CONFIG: Record<
  AutoSaveStatus,
  { label: string; color: 'default' | 'success' | 'warning' | 'error'; icon: ReactElement }
> = {
  idle: {
    label: '尚未開始自動儲存',
    color: 'default',
    icon: <HourglassTopRoundedIcon fontSize="small" />,
  },
  saving: {
    label: '自動儲存中',
    color: 'warning',
    icon: <HourglassTopRoundedIcon fontSize="small" />,
  },
  saved: {
    label: '已自動儲存',
    color: 'success',
    icon: <CloudDoneRoundedIcon fontSize="small" />,
  },
  error: {
    label: '自動儲存失敗',
    color: 'error',
    icon: <ErrorOutlineRoundedIcon fontSize="small" />,
  },
};

function EventInfoForm({
  values,
  errors,
  handleFieldBlur,
  handleFieldChange,
  disabled = false,
  autoSaveStatus = 'idle',
  autoSaveMessage,
}: EventInfoFormProps) {
  const autoSaveConfig = AUTO_SAVE_STATUS_CONFIG[autoSaveStatus];

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper sx={sectionCardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <InfoOutlinedIcon color="primary" />
          <Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              活動基本資訊
            </Typography>
            <Typography variant="body2" color="text.secondary">
              先填入關鍵條件，系統後續會依此生成 SOP 與風險規劃內容。
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              自動儲存
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {autoSaveMessage ?? '編輯後 3 秒會自動儲存為草稿。'}
            </Typography>
          </Box>
          <Chip
            icon={autoSaveConfig.icon}
            label={autoSaveConfig.label}
            color={autoSaveConfig.color}
            variant={autoSaveStatus === 'saved' ? 'filled' : 'outlined'}
          />
        </Box>

        <Box sx={inputGridSx}>
          <TextField
            required
            fullWidth
            label="活動名稱"
            placeholder="例如：2026 亞洲創新論壇"
            value={values.name}
            error={Boolean(errors.name)}
            helperText={errors.name ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('name', event.target.value)}
            onBlur={() => handleFieldBlur('name')}
            sx={fullWidthSx}
          />

          <TextField
            select
            required
            fullWidth
            label="活動類型"
            value={values.type}
            error={Boolean(errors.type)}
            helperText={errors.type ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('type', event.target.value)}
            onBlur={() => handleFieldBlur('type')}
          >
            {EVENT_TYPE_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            fullWidth
            label="活動規模"
            value={values.scale}
            error={Boolean(errors.scale)}
            helperText={errors.scale ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('scale', event.target.value)}
            onBlur={() => handleFieldBlur('scale')}
          >
            {EVENT_SCALE_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            required
            fullWidth
            type="date"
            label="開始日期"
            value={values.startDate}
            error={Boolean(errors.startDate)}
            helperText={errors.startDate ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('startDate', event.target.value)}
            onBlur={() => handleFieldBlur('startDate')}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            required
            fullWidth
            type="date"
            label="結束日期"
            value={values.endDate}
            error={Boolean(errors.endDate)}
            helperText={errors.endDate ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('endDate', event.target.value)}
            onBlur={() => handleFieldBlur('endDate')}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            required
            fullWidth
            label="活動地點"
            placeholder="例如：台北南港展覽館一館"
            value={values.location}
            error={Boolean(errors.location)}
            helperText={errors.location ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('location', event.target.value)}
            onBlur={() => handleFieldBlur('location')}
            sx={fullWidthSx}
          />
        </Box>
      </Paper>

      <Paper sx={sectionCardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <NotesRoundedIcon color="primary" />
          <Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              執行條件與補充說明
            </Typography>
            <Typography variant="body2" color="text.secondary">
              補充人數、預算與特殊需求，讓後續規劃更貼近實際執行情境。
            </Typography>
          </Box>
          {autoSaveStatus === 'saved' ? <CheckCircleRoundedIcon color="success" sx={{ ml: 'auto' }} /> : null}
        </Box>

        <Box sx={inputGridSx}>
          <TextField
            required
            fullWidth
            type="number"
            label="預計參加人數"
            placeholder="例如：350"
            value={values.attendees}
            error={Boolean(errors.attendees)}
            helperText={errors.attendees ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('attendees', event.target.value)}
            onBlur={() => handleFieldBlur('attendees')}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />

          <TextField
            fullWidth
            type="number"
            label="預算（選填）"
            placeholder="例如：500000"
            value={values.budget}
            error={Boolean(errors.budget)}
            helperText={errors.budget ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('budget', event.target.value)}
            onBlur={() => handleFieldBlur('budget')}
            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="活動描述"
            placeholder="說明活動目標、主要流程、核心亮點等背景資訊。"
            value={values.description}
            error={Boolean(errors.description)}
            helperText={errors.description ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('description', event.target.value)}
            onBlur={() => handleFieldBlur('description')}
            sx={fullWidthSx}
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="特殊需求（選填）"
            placeholder="例如：VIP 接待、直播需求、無障礙動線、雙語主持。"
            value={values.specialRequirements}
            error={Boolean(errors.specialRequirements)}
            helperText={errors.specialRequirements ?? ' '}
            disabled={disabled}
            onChange={event => handleFieldChange('specialRequirements', event.target.value)}
            onBlur={() => handleFieldBlur('specialRequirements')}
            sx={fullWidthSx}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default EventInfoForm;
