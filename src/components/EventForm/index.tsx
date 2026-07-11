import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fade,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { FormEvent, useMemo, useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { EVENT_FORM_STEPS, useEventForm } from '../../hooks/useEventForm';
import { useAppStore } from '../../store/appStore';
import { formatDateTime } from '../../utils/helpers';
import { hasProjectContent } from '../../utils/project';
import Step1BasicInfo from './Step1BasicInfo';
import Step2Details from './Step2Details';
import Step3Review from './Step3Review';
import StepNavigation from './StepNavigation';

interface EventFormProps {
  onOpenTemplatePicker?: () => void;
}

function EventForm({ onOpenTemplatePicker }: EventFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isGenerating = useAppStore(state => state.isGenerating);
  const error = useAppStore(state => state.error);
  const setError = useAppStore(state => state.setError);
  const setIsGenerating = useAppStore(state => state.setIsGenerating);
  const currentEvent = useAppStore(state => state.currentEvent);
  const currentProjectId = useAppStore(state => state.currentProjectId);
  const projectHydrationKey = useAppStore(state => state.projectHydrationKey);
  const saveCurrentProject = useAppStore(state => state.saveCurrentProject);
  const createNewProject = useAppStore(state => state.createNewProject);
  const {
    currentStep,
    values,
    errors,
    allErrors,
    stepErrors,
    completedSteps,
    highestUnlockedStep,
    handleFieldBlur,
    handleFieldChange,
    goToStep,
    nextStep,
    prevStep,
    resetForm,
    submitForm,
  } = useEventForm();

  const canAutoSave = useMemo(() => hasProjectContent(values) || Boolean(currentProjectId), [currentProjectId, values]);
  const autoSavePayload = useMemo(() => ({ values, currentStep }), [currentStep, values]);
  const { status: autoSaveStatus, error: autoSaveError, lastSavedAt } = useAutoSave({
    value: autoSavePayload,
    enabled: true,
    delay: 3000,
    resetKey: `${projectHydrationKey}-${currentProjectId ?? 'new'}`,
    canSave: canAutoSave,
    onSave: async () => {
      await saveCurrentProject();
    },
  });

  const autoSaveMessage = autoSaveError
    ? autoSaveError
    : autoSaveStatus === 'saved' && lastSavedAt
      ? `最近一次自動儲存：${formatDateTime(lastSavedAt)}`
      : '編輯後 3 秒會自動儲存為草稿。';

  const completedFieldCount = useMemo(
    () => Object.keys(values).filter(key => values[key as keyof typeof values].trim() !== '').length,
    [values]
  );

  const currentStepContent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <Step1BasicInfo
            values={values}
            errors={errors}
            handleFieldBlur={handleFieldBlur}
            handleFieldChange={handleFieldChange}
            disabled={isGenerating}
          />
        );
      case 1:
        return (
          <Step2Details
            values={values}
            errors={errors}
            handleFieldBlur={handleFieldBlur}
            handleFieldChange={handleFieldChange}
            disabled={isGenerating}
          />
        );
      case 2:
      default:
        return (
          <Step3Review
            values={values}
            errors={errors}
            handleFieldBlur={handleFieldBlur}
            handleFieldChange={handleFieldChange}
            goToStep={goToStep}
            disabled={isGenerating}
          />
        );
    }
  }, [currentStep, errors, goToStep, handleFieldBlur, handleFieldChange, isGenerating, values]);

  const handleNextStep = () => {
    setSuccessMessage(null);

    if (nextStep()) {
      setError(null);
      return;
    }

    setError('請先完成目前步驟的必填欄位，再前往下一步。');
  };

  const handlePreviousStep = () => {
    setSuccessMessage(null);
    setError(null);
    prevStep();
  };

  const handleStepClick = (step: number) => {
    setSuccessMessage(null);
    setError(null);
    goToStep(step);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setError(null);
    setIsGenerating(true);

    try {
      const isSuccess = submitForm();

      if (!isSuccess) {
        setError('請先修正表單欄位錯誤後再提交。');
        return;
      }

      await saveCurrentProject({ status: 'in_progress' });
      setSuccessMessage('活動資訊已儲存，可進入下一階段生成 SOP 與風險規劃。');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '表單提交失敗，請稍後再試。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    resetForm();
    createNewProject();
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        border: theme => `1px solid ${theme.palette.divider}`,
        background: theme =>
          `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
      }}
    >
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
        >
          <Box>
            <Typography variant="overline" component="span" color="primary.main" sx={{ fontWeight: 700 }}>
              Phase 5 · Template-enabled Form
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              活動資訊輸入表單
            </Typography>
            <Typography variant="body1" color="text.secondary">
              以三個步驟逐步蒐集活動需求，建立後續 SOP 與風險規劃生成的基礎資料。
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeRoundedIcon />}
              onClick={onOpenTemplatePicker}
              disabled={!onOpenTemplatePicker}
            >
              從範本開始
            </Button>
            <Button variant="text" color="inherit" onClick={handleReset}>
              建立空白草稿
            </Button>
          </Stack>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: '1.6fr minmax(280px, 0.8fr)',
            },
          }}
        >
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 3,
                }}
              >
                <StepNavigation
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  stepErrors={stepErrors}
                  highestUnlockedStep={highestUnlockedStep}
                  onStepClick={handleStepClick}
                />
              </Paper>

              <Fade in key={currentStep} timeout={250}>
                <Box>{currentStepContent}</Box>
              </Fade>

              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={handleReset}
                  disabled={isGenerating}
                  startIcon={<ReplayRoundedIcon />}
                >
                  重置表單
                </Button>

                <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="inherit"
                    onClick={handlePreviousStep}
                    disabled={isGenerating || currentStep === 0}
                    startIcon={<ArrowBackRoundedIcon />}
                  >
                    上一步
                  </Button>

                  {currentStep < EVENT_FORM_STEPS.length - 1 ? (
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleNextStep}
                      disabled={isGenerating}
                      endIcon={<ArrowForwardRoundedIcon />}
                    >
                      下一步
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isGenerating}
                      startIcon={
                        isGenerating ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />
                      }
                    >
                      {isGenerating ? '儲存中...' : '提交'}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3,
              alignSelf: 'start',
              position: { md: 'sticky' },
              top: { md: 24 },
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  即時摘要
                </Typography>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                  {values.name.trim() || '尚未命名的活動'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {values.location.trim() || '尚未設定地點'}
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  目前步驟：{currentStep + 1} / {EVENT_FORM_STEPS.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已完成步驟：{completedSteps.filter(Boolean).length} / {EVENT_FORM_STEPS.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已填寫欄位：{completedFieldCount} / {Object.keys(values).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  待修正欄位：{Object.keys(allErrors).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  儲存狀態：
                  {autoSaveStatus === 'saving'
                    ? ' 自動儲存中'
                    : autoSaveStatus === 'saved'
                      ? ' 已同步到本機專案'
                      : currentEvent
                        ? ' 已同步到 Zustand store'
                        : ' 尚未提交'}
                </Typography>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  自動儲存
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {autoSaveMessage}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  表單提示
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 必填欄位請完整填寫
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 步驟完成後會顯示綠色勾號
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 最後一步可直接回到前面編輯
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={1}>
                {EVENT_FORM_STEPS.map((stepLabel, index) => (
                  <Stack
                    key={stepLabel}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', color: index === currentStep ? 'primary.main' : 'text.secondary' }}
                  >
                    <TaskAltRoundedIcon
                      fontSize="small"
                      color={completedSteps[index] ? 'success' : index === currentStep ? 'primary' : 'disabled'}
                    />
                    <Typography variant="body2">{`步驟 ${index + 1}：${stepLabel}`}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Paper>
  );
}

export default EventForm;
