import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { UseEventFormReturn } from '../../hooks/useEventForm';
import { getEventScaleLabel, getEventTypeLabel } from '../../utils/project';

type Step3ReviewProps = Pick<
  UseEventFormReturn,
  'values' | 'errors' | 'handleFieldBlur' | 'handleFieldChange' | 'goToStep'
> & {
  disabled?: boolean;
};

const sectionCardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 3,
  border: 1,
  borderColor: 'divider',
  boxShadow: 'none',
  bgcolor: 'background.paper',
};

const summaryRowSx = {
  py: 1.25,
  px: 0,
  alignItems: 'flex-start',
};

function Step3Review({
  values,
  errors,
  handleFieldBlur,
  handleFieldChange,
  goToStep,
  disabled = false,
}: Step3ReviewProps) {
  return (
    <Stack spacing={3}>
      <Paper sx={sectionCardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <FactCheckRoundedIcon color="primary" />
          <Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              特殊需求與確認
            </Typography>
            <Typography variant="body2" color="text.secondary">
              最後補充特殊需求，並確認前兩步資料是否正確。
            </Typography>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={5}
          label="特殊需求（選填）"
          placeholder="例如：VIP 接待、直播需求、無障礙動線、雙語主持。"
          value={values.specialRequirements}
          error={Boolean(errors.specialRequirements)}
          helperText={errors.specialRequirements ?? ' '}
          disabled={disabled}
          onChange={event => handleFieldChange('specialRequirements', event.target.value)}
          onBlur={() => handleFieldBlur('specialRequirements')}
        />
      </Paper>

      <Paper sx={sectionCardSx}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Box>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                資料確認摘要
              </Typography>
              <Typography variant="body2" color="text.secondary">
                若需要修改，可直接返回對應步驟編輯。
              </Typography>
            </Box>
          </Stack>

          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                步驟 1：活動基本資訊
              </Typography>
              <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => goToStep(0)}>
                編輯
              </Button>
            </Stack>
            <Divider />
            <List disablePadding>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="活動名稱" secondary={values.name.trim() || '未填寫'} />
              </ListItem>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="活動類型" secondary={getEventTypeLabel(values.type)} />
              </ListItem>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="活動規模" secondary={getEventScaleLabel(values.scale)} />
              </ListItem>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="活動日期" secondary={`${values.startDate || '未填寫'} ～ ${values.endDate || '未填寫'}`} />
              </ListItem>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="活動地點" secondary={values.location.trim() || '未填寫'} />
              </ListItem>
            </List>
          </Box>

          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                步驟 2：詳細規劃
              </Typography>
              <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => goToStep(1)}>
                編輯
              </Button>
            </Stack>
            <Divider />
            <List disablePadding>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="預計參加人數" secondary={values.attendees.trim() || '未填寫'} />
              </ListItem>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="預算" secondary={values.budget.trim() || '未填寫'} />
              </ListItem>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="活動描述" secondary={values.description.trim() || '未填寫'} />
              </ListItem>
            </List>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              步驟 3：特殊需求
            </Typography>
            <Divider />
            <List disablePadding>
              <ListItem disableGutters sx={summaryRowSx}>
                <ListItemText primary="特殊需求" secondary={values.specialRequirements.trim() || '未填寫'} />
              </ListItem>
            </List>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default Step3Review;
