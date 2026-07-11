import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { Box, Chip, LinearProgress, Stack, Step, StepButton, StepLabel, Stepper, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EVENT_FORM_STEPS } from '../../hooks/useEventForm';

interface StepNavigationProps {
  currentStep: number;
  completedSteps: boolean[];
  stepErrors: Record<number, string[]>;
  highestUnlockedStep: number;
  onStepClick: (step: number) => void;
}

const getStepStatusLabel = (isCompleted: boolean, isActive: boolean) => {
  if (isCompleted) {
    return '已完成';
  }

  if (isActive) {
    return '進行中';
  }

  return '待完成';
};

function StepNavigation({
  currentStep,
  completedSteps,
  stepErrors,
  highestUnlockedStep,
  onStepClick,
}: StepNavigationProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const progressValue = ((currentStep + 1) / EVENT_FORM_STEPS.length) * 100;

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
      >
        <Box>
          <Typography variant="overline" component="div" color="primary.main" sx={{ fontWeight: 700 }}>
            步驟 {currentStep + 1} / {EVENT_FORM_STEPS.length}
          </Typography>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
            {EVENT_FORM_STEPS[currentStep]}
          </Typography>
        </Box>
        <Chip color="primary" variant="outlined" label={`完成 ${completedSteps.filter(Boolean).length}/${EVENT_FORM_STEPS.length}`} />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 8,
          borderRadius: 999,
          bgcolor: 'action.hover',
        }}
      />

      <Stepper
        activeStep={currentStep}
        orientation={isDesktop ? 'horizontal' : 'vertical'}
        alternativeLabel={isDesktop}
        sx={{
          '& .MuiStepIcon-root.Mui-completed': {
            color: 'success.main',
          },
          '& .MuiStepIcon-root.Mui-active': {
            color: 'primary.main',
          },
        }}
      >
        {EVENT_FORM_STEPS.map((label, index) => {
          const isCompleted = completedSteps[index];
          const isActive = index === currentStep;
          const isClickable = index <= highestUnlockedStep || index <= currentStep;
          const errorCount = stepErrors[index]?.length ?? 0;

          return (
            <Step key={label} completed={isCompleted}>
              <StepButton disabled={!isClickable} onClick={() => onStepClick(index)}>
                <StepLabel
                  error={!isCompleted && !isActive && errorCount > 0}
                  optional={
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5 }}>
                      {isCompleted ? (
                        <CheckCircleRoundedIcon color="success" sx={{ fontSize: 16 }} />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon color="disabled" sx={{ fontSize: 16 }} />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {getStepStatusLabel(isCompleted, isActive)}
                      </Typography>
                    </Stack>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 500 }}>
                    {`步驟 ${index + 1}：${label}`}
                  </Typography>
                </StepLabel>
              </StepButton>
            </Step>
          );
        })}
      </Stepper>
    </Stack>
  );
}

export default StepNavigation;
