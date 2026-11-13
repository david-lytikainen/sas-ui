import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import authApi from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ColorModeContext } from '../../context/ColorModeContext';
import { formatDateOnly, parseDateOnly } from '../../utils/date';
import { formatPhone, normalizePhone } from '../../utils/phone';
import ProfilePreferences from './ProfilePreferences';
import type { ProfilePreferences as ProfilePreferenceValues } from '../../types/user';

const getUserFormData = (currentUser: ReturnType<typeof useAuth>['user']) => ({ first_name: currentUser?.first_name || '', last_name: currentUser?.last_name || '', email: currentUser?.email || '', phone: currentUser?.phone || '', birthday: currentUser?.birthday || '', gender: currentUser?.gender || '' });
const getUserPreferences = (currentUser: ReturnType<typeof useAuth>['user']): ProfilePreferenceValues => ({ faith_importance: currentUser?.faith_importance ?? null, traditional_roles_importance: currentUser?.traditional_roles_importance ?? null, boundaries_importance: currentUser?.boundaries_importance ?? null, looks_importance: currentUser?.looks_importance ?? null, wants_kids: currentUser?.wants_kids ?? null, age_gap: currentUser?.age_gap ?? null });

const ProfilePage = () => {
  const { user, refreshUser, updateUser, logout } = useAuth();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [stripeDashboardLoading, setStripeDashboardLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
    gender: '',
  });
  const [preferenceValues, setPreferenceValues] = useState<ProfilePreferenceValues>({ faith_importance: null, traditional_roles_importance: null, boundaries_importance: null, looks_importance: null, wants_kids: null, age_gap: null });
  const [savingPreferences, setSavingPreferences] = useState<Partial<Record<keyof ProfilePreferenceValues, boolean>>>({});
  const [savedPreferences, setSavedPreferences] = useState<Partial<Record<keyof ProfilePreferenceValues, number>>>({});
  const preferenceSaveTimeouts = useRef<Partial<Record<keyof ProfilePreferenceValues, number>>>({});
  const initializedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (initializedUserId.current === user.id) return;
    initializedUserId.current = user.id;
    setFormData(getUserFormData(user));
    setPreferenceValues(getUserPreferences(user));
  }, [user]);

  useEffect(() => () => Object.values(preferenceSaveTimeouts.current).forEach((timeout) => timeout && window.clearTimeout(timeout)), []);

  useEffect(() => {
    if (!user || (user.role_id !== 2 && user.role_id !== 3)) {
      setDashboard(null);
      return;
    }

    let active = true;
    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        const response = await authApi.getProfileDashboard();
        if (active) {
          setDashboard(response);
        }
      } catch (dashboardError: any) {
        if (active) {
          setError(dashboardError.message || 'Failed to load profile dashboard.');
        }
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user]);

  const resetForm = () => {
    if (!user) return;
    setFormData(getUserFormData(user));
  };

  const formattedPhone = formatPhone(formData.phone);

  const handleTextChange = (field: string, value: string) => {
    if (field === 'phone') {
      setFormData((prev) => ({ ...prev, phone: normalizePhone(value) }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: field === 'email' ? value.toLowerCase() : value,
    }));
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.birthday || !formData.gender) {
      return 'First name, last name, email, phone, birthday, and gender are required.';
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      return 'Phone number must be exactly 10 digits.';
    }

    const birthday = parseDateOnly(formData.birthday);
    if (!birthday) {
      return 'Birthday is required.';
    }
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }

    if (age < 18) {
      return 'You must be 18+ to use Saved & Single.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const updatedUser = await authApi.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender,
      });

      setFormData(getUserFormData(updatedUser));
      await refreshUser();
      setMessage('Profile updated.');
      setIsEditing(false);
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (field: keyof ProfilePreferenceValues, nextValue: number | null, clickedValue: number) => {
    if (savingPreferences[field]) return;
    const currentValue = preferenceValues[field];
    if (nextValue === currentValue) return;

    setSavingPreferences((prev) => ({ ...prev, [field]: true }));
    setError(null);
    try {
      await authApi.updatePreferences({ [field]: nextValue });
      setPreferenceValues((prev) => ({ ...prev, [field]: nextValue }));
      updateUser({ [field]: nextValue });
      setSavedPreferences((prev) => ({ ...prev, [field]: clickedValue }));
      if (preferenceSaveTimeouts.current[field]) window.clearTimeout(preferenceSaveTimeouts.current[field]);
      preferenceSaveTimeouts.current[field] = window.setTimeout(() => setSavedPreferences((prev) => { const next = { ...prev }; delete next[field]; return next; }), 1000);
    } catch (preferenceError: any) {
      setError(preferenceError.message || 'Failed to update profile preference.');
    } finally {
      setSavingPreferences((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleStopEditing = () => {
    resetForm();
    setIsEditing(false);
    setMessage(null);
    setError(null);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenStripeDashboard = async () => {
    const stripeTab = window.open('about:blank', '_blank');
    if (stripeTab) stripeTab.opener = null;
    try {
      setStripeDashboardLoading(true);
      setError(null);
      const { url } = await authApi.createConnectDashboardLink();
      if (stripeTab) stripeTab.location.href = url;
      else window.location.href = url;
    } catch (stripeError: any) {
      stripeTab?.close();
      setError(stripeError.message || 'Failed to open Stripe dashboard.');
      setStripeDashboardLoading(false);
    }
  };

  const ownBilling = dashboard?.billing?.own_summary;
  const organizerOverview = dashboard?.billing?.organizer_overview || [];

  const billingHighlights = ownBilling
    ? [
        { label: 'Gross', value: `$${ownBilling.gross_amount}` },
        { label: 'Registrations', value: String(ownBilling.successful_registrations ?? 0) },
      ]
    : [];

  const readOnlyRows = [
    { label: 'First Name', value: formData.first_name },
    { label: 'Last Name', value: formData.last_name },
    { label: 'Email Address', value: formData.email },
    { label: 'Phone Number', value: formattedPhone },
    {
      label: 'Birthday',
      value:
        parseDateOnly(formData.birthday)?.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }) || '',
    },
    { label: 'Gender', value: formData.gender },
  ];

  const hasChanges = useMemo(() => {
    if (!user) return false;

    return (
      formData.first_name !== (user.first_name || '') ||
      formData.last_name !== (user.last_name || '') ||
      formData.email !== (user.email || '') ||
      formData.phone !== (user.phone || '') ||
      formData.birthday !== (user.birthday || '')
    );
  }, [formData, user]);

  return (
    <div className="container content-narrow mb-4">
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <h1 className="fw-bold mb-0">Profile</h1>
          <div className="d-flex align-items-center gap-2">
            {isEditing ? (
              <>
                <button type="button" aria-label="Save profile changes" onClick={handleSubmit} disabled={!hasChanges || loading} className="border rounded px-3 py-2 btn btn-outline-secondary" >
                  <i className="fa-solid fa-check" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Stop editing profile" onClick={handleStopEditing} className="border rounded px-3 py-2 btn btn-outline-secondary" >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button type="button" aria-label="Edit profile" onClick={() => { setIsEditing(true); setMessage(null); setError(null); }} className="border rounded px-3 py-2 btn btn-outline-secondary" >
                <i className="fa-solid fa-pen" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
      {message && (
        <div role="alert" className="mb-3 alert alert-success alert-dismissible">
          {message}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage(null)} />
        </div>
      )}
      {error && (
        <div role="alert" className="mb-3 alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)} />
        </div>
      )}
      <div className="rounded card">
        <div className="d-flex flex-column gap-2 card-body">
          {isEditing ? (
            <>
              <div className="w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'First Name'}</span>
                  <input className="form-control" value={formData.first_name} onChange={(e) => handleTextChange('first_name', e.target.value)} required />
                </label>
              </div>
              <div className="w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Last Name'}</span>
                  <input className="form-control" value={formData.last_name} onChange={(e) => handleTextChange('last_name', e.target.value)} required />
                </label>
              </div>
              <div className="w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Email Address'}</span>
                  <input className="form-control" type="email" value={formData.email} onChange={(e) => handleTextChange('email', e.target.value)} required />
                </label>
              </div>
              <div className="w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Phone Number'}</span>
                  <input className="form-control" value={formattedPhone} onChange={(e) => handleTextChange('phone', e.target.value)} required inputMode="numeric" maxLength={14} />
                </label>
              </div>
              <label className="d-block">
                <span className="form-label d-block">Birthday</span>
                <input className="form-control" type="date" required max={formatDateOnly(new Date())} value={formData.birthday} onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))} />
              </label>
            </>
          ) : (
            <div className="d-flex flex-column gap-3">
              {readOnlyRows.map((row) => (
                <div key={row.label} className="border rounded px-3 py-1 bg-body-tertiary">
                  <p className="d-block text-body-secondary mb-0 small">{row.label}</p>
                  <p className="fw-medium mb-0">{row.value || 'Not provided'}</p>
                </div>
              ))}
              <label className="d-flex bg-body-tertiary align-items-center justify-content-between px-3 py-2 border rounded">
                <p className="fw-semibold mb-0">Dark Mode</p>
                <input type="checkbox" checked={mode === 'dark'} onChange={toggleColorMode} className="form-check-input" />
              </label>
            </div>
          )}
          {user?.role_id !== 3 && (
            <>
              <hr />
              <div>
                <ProfilePreferences values={preferenceValues} editable savingFields={savingPreferences} savedFields={savedPreferences} onChange={handlePreferenceChange} />
              </div>
            </>
          )}
        </div>
      </div>

      {user?.role_id === 3 && (
        <div className="rounded my-3 card">
          <div className="d-flex flex-column gap-2 card-body">
            <p className="fw-bold fs-5 mb-0">Organizer Earnings</p>
            {dashboardLoading ? (
              <p className="text-body-secondary mb-0 small">Loading organizer totals...</p>
            ) : organizerOverview.length ? (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead><tr><th scope="col">Organizer email</th><th scope="col" className="text-end">Events</th><th scope="col" className="text-end">Ticket sales</th><th scope="col" className="text-end">Organizer transfer</th><th scope="col" className="text-end">SAS net after Stripe</th></tr></thead>
                  <tbody>{organizerOverview.map((organizer: any) => (
                    <tr key={organizer.organizer_id}>
                      <td>{organizer.organizer_email}</td>
                      <td className="text-end">{organizer.event_count}</td>
                      <td className="text-end">{organizer.tracked_payment_count ? `$${organizer.ticket_sales_after_refunds}` : '—'}</td>
                      <td className="text-end">{organizer.tracked_payment_count ? `$${organizer.organizer_transfer_after_refunds}` : '—'}</td>
                      <td className="text-end">{organizer.tracked_payment_count ? `$${organizer.sas_net_after_stripe}` : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-body-secondary mb-0 small">No organizers found.</p>}
          </div>
        </div>
      )}

      {(user?.role_id === 2 || user?.role_id === 3) && (
        <div className="rounded my-3 card">
          <div className="d-flex flex-column gap-3 card-body">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <p className="fw-bold fs-5 mb-0">Billing</p>
              {user?.role_id === 3 ? (
                <a href={'https://dashboard.stripe.com'} target="_blank" rel="noopener noreferrer" className="btn btn-link btn-sm">
                  Open Stripe<span className="ms-2">{<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />}</span>
                </a>
              ) : (
                <button type="button" onClick={handleOpenStripeDashboard} disabled={stripeDashboardLoading} className="btn btn-link btn-sm">
                  {stripeDashboardLoading ? 'Opening...' : 'Open Stripe'}
                  <span className="ms-2">{<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />}</span>
                </button>
              )}
            </div>
            {dashboardLoading ? (
              <p className="text-body-secondary mb-0 small">Loading billing summary...</p>
            ) : (
              <>
                <div className="d-flex flex-wrap gap-3">
                  {billingHighlights.map((item) => (
                    <div key={item.label} className="flex-grow-1 border rounded px-3 py-3">
                      <p className="d-block text-body-secondary text-uppercase mb-1 small">{item.label}</p>
                      <p className="fw-semibold mb-0">{item.value}</p>
                    </div>
                  ))}
                </div>
                {ownBilling?.recent_activity?.length > 0 && (
                  <div className="d-flex flex-column gap-2">
                    <p className="fw-bold mb-0 small">Recent Billing Activity</p>
                    {ownBilling.recent_activity.map((activity: any, index: number) => (
                      <div key={`${activity.created_at || activity.event_name}-${index}`} className="border rounded px-3 py-3">
                        <p className="fw-semibold mb-0 small">{activity.event_name}</p>
                        <p className="text-body-secondary mb-0 small"> {activity.attendee_name} • ${activity.amount} </p>
                        <p className="text-body-secondary mb-0 small"> Payment {activity.payment_status} | Registration {activity.registration_status} {activity.refund_status ? ` | Refund ${activity.refund_status}` : ''} </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="d-flex justify-content-start mt-3">
        <button type="button" onClick={handleLogout} className="w-100 rounded-pill px-3 fw-semibold btn btn-outline-secondary">Log out</button>
      </div>
    </div>
  );
};

export default ProfilePage;
