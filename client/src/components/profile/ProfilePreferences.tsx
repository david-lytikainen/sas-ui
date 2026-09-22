import { Box, Button, Typography, useTheme } from '@mui/material';
import type { ProfilePreferences as ProfilePreferenceValues } from '../../types/user';

interface ProfilePreferencesProps {
  values: ProfilePreferenceValues;
  onChange?: (field: keyof ProfilePreferenceValues, value: number | null) => void;
  editable?: boolean;
}

const importanceOptions = [1, 2, 3, 4, 5].map(value => ({ label: String(value), value }));
const questions: Array<{ field: keyof ProfilePreferenceValues; label: string; options: Array<{ label: string; value: number }>, leftNote?: string, rightNote?: string }> = [
  { field: 'faith_importance', label: 'How important is Faith to you?', options: importanceOptions, leftNote: 'Least' , rightNote: 'Most' },
  { field: 'traditional_roles_importance', label: 'How important are traditional marriage roles?', options: importanceOptions },
  { field: 'boundaries_importance', label: 'How important are boundaries?', options: importanceOptions },
  { field: 'looks_importance', label: 'How important are looks?', options: importanceOptions },
  { field: 'wants_kids', label: 'Do you want kids?', options: [{ label: 'No', value: 1 }, { label: 'Unsure', value: 2 }, { label: 'Yes', value: 3 }] },
  { field: 'age_gap', label: 'What is the maximum age gap you are comfortable with? (in years)', options: [3, 4, 5, 6, 7].map(value => ({ label: String(value), value })) },
];

const ProfilePreferences = ({ values, onChange, editable = false }: ProfilePreferencesProps) => {
  const theme = useTheme();
  const pillSx = (selected: boolean) => ({ flex: 1, minWidth: 0, borderRadius: 999, px: 1.7, py: 0.6, fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.2, bgcolor: selected ? theme.palette.primary.main : theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[200], color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary, boxShadow: 'none', '&:hover': { bgcolor: selected ? theme.palette.primary.main : theme.palette.action.hover, boxShadow: 'none' }, '@media (hover: none), (pointer: coarse)': { '&:hover': { bgcolor: selected ? theme.palette.primary.main : theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[200] } } });

  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {questions.map(question => <Box key={question.field}>
      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.75 }}>{question.label}</Typography>
      <Box sx={{ display: 'flex', width: '100%', gap: 0.75 }}>
        {question.options.map(option => <Button key={option.value} type="button" disabled={!editable} onClick={() => onChange?.(question.field, values[question.field] === option.value ? null : option.value)} sx={{ ...pillSx(values[question.field] === option.value), '&.Mui-disabled': { opacity: values[question.field] === option.value ? 0.65 : 0.4, filter: 'saturate(60%)', color: values[question.field] === option.value ? theme.palette.primary.contrastText : theme.palette.text.secondary } }}>{option.label}</Button>)}
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', float: 'left', pl: 1 }}>{question.leftNote}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', float: 'right', pr: 1 }}>{question.rightNote}</Typography>
    </Box>)}
  </Box>;
};

export default ProfilePreferences;
