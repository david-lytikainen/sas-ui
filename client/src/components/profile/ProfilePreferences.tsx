import type { ProfilePreferences as ProfilePreferenceValues } from '../../types/user';

interface ProfilePreferencesProps {
  values: ProfilePreferenceValues;
  onChange?: (field: keyof ProfilePreferenceValues, value: number | null) => void;
  editable?: boolean;
}

const importanceOptions = [1, 2, 3, 4, 5].map((value) => ({ label: String(value), value }));
const questions: Array<{
  field: keyof ProfilePreferenceValues;
  label: string;
  options: Array<{ label: string; value: number }>;
  leftNote?: string;
  rightNote?: string;
}> = [
  { field: 'faith_importance', label: 'How important is Faith to you?', options: importanceOptions, leftNote: 'Least', rightNote: 'Most' },
  { field: 'traditional_roles_importance', label: 'How important are traditional marriage roles?', options: importanceOptions },
  { field: 'boundaries_importance', label: 'How important are boundaries?', options: importanceOptions },
  { field: 'looks_importance', label: 'How important are looks?', options: importanceOptions },
  {
    field: 'wants_kids',
    label: 'Do you want kids?',
    options: [
      { label: 'No', value: 1 },
      { label: 'Unsure', value: 2 },
      { label: 'Yes', value: 3 },
    ],
  },
  {
    field: 'age_gap',
    label: 'What is the maximum age gap you are comfortable with? (in years)',
    options: [3, 4, 5, 6, 7].map((value) => ({ label: String(value), value })),
  },
];

const ProfilePreferences = ({ values, onChange, editable = false }: ProfilePreferencesProps) => (
  <div className="d-flex flex-column gap-4">
    {questions.map((question) => (
      <div key={question.field}>
        <p className="fw-semibold mb-2">{question.label}</p>
        <div className="d-flex gap-2" role="group" aria-label={question.label}>
          {question.options.map((option) => (
            <button key={option.value} type="button" disabled={!editable} aria-pressed={values[question.field] === option.value} onClick={() => onChange?.(question.field, values[question.field] === option.value ? null : option.value)} className={`btn rounded-pill flex-fill px-1 ${values[question.field] === option.value ? 'btn-primary' : 'btn-outline-secondary'}`} > {option.label} </button>
          ))}
        </div>
        <div className="d-flex justify-content-between text-body-secondary small px-2">
          <span>{question.leftNote}</span>
          <span>{question.rightNote}</span>
        </div>
      </div>
    ))}
  </div>
);

export default ProfilePreferences;
