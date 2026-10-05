import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSplash } from '../../context/SplashContext';
import { formatDateOnly, parseDateOnly } from '../../utils/date';
import { formatPhone, normalizePhone } from '../../utils/phone';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { setShowLoginSplash } = useSplash();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    gender: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedPhone = formatPhone(formData.phone);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, phone: normalizePhone(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: name === 'email' ? value.toLowerCase() : value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.birthday ||
      !formData.gender ||
      !formData.phone
    ) {
      return 'All fields are required';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      return 'Phone number must be exactly 10 digits';
    }

    const birthday = parseDateOnly(formData.birthday);
    if (!birthday) {
      return 'Birthday is required';
    }
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    if (age < 18) {
      return 'You must be 18+ to Register';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await register({
        email: formData.email.toLowerCase(),
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthday: formData.birthday,
        gender: formData.gender,
        phone: formData.phone,
      });
      setShowLoginSplash(true);
      navigate('/events', { replace: true, state: { showProfilePreferences: true } });
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 mb-3 container content-narrow">
      <h1 className="text-center mb-4 fw-bold text-primary">Saved & Single</h1>
      <div className="p-3 p-sm-3 p-md-4 rounded border">
        <p className="text-center fw-bold mb-0">Register</p>
        {error && (
          <div role="alert" className="mb-2 py-1 alert alert-danger"> {error} </div>
        )}
        <form onSubmit={handleSubmit}>
          <button type="button" onClick={() => navigate('/login')} className="btn btn-link btn-sm w-100"> Already have an account? Login </button>
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'First Name'}</span>
              <input className="form-control" name="first_name" value={formData.first_name} onChange={handleTextChange} required />
            </label>
          </div>
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Last Name'}</span>
              <input className="form-control" name="last_name" value={formData.last_name} onChange={handleTextChange} required />
            </label>
          </div>
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Email Address'}</span>
              <input className="form-control" name="email" type="email" value={formData.email} onChange={handleTextChange} required />
            </label>
          </div>
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Phone Number'}</span>
              <input className="form-control" name="phone" value={formattedPhone} onChange={handleTextChange} required type="tel" inputMode="numeric" maxLength={14} pattern={'\\(\\d{3}\\)-\\d{3}-\\d{4}'} />
            </label>
          </div>
          <label className="d-block my-2">
            <span className="form-label d-block">Birthday</span>
            <input className="form-control" type="date" required max={formatDateOnly(new Date())} value={formData.birthday} onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))} />
            <small className="form-text">18+ only</small>
          </label>
          <div className="my-2 w-100">
            <label htmlFor="gender-select" id="gender-select-label" className="form-label"> Gender </label>
            <select required id="gender-select" name="gender" value={formData.gender} onChange={handleSelectChange} className="form-select">
              <option value="" disabled> Select </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Password'}</span>
              <span className="input-group">
                <input className="form-control" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleTextChange} required />
                {
                  <span className="input-group-text">
                    <button type="button" aria-label="Show or hide password" onClick={() => setShowPassword((prev) => !prev)} className="btn btn-outline-secondary btn-sm" >
                      {showPassword ? (
                        <i className="fa-solid fa-eye-slash" aria-hidden="true" />
                      ) : (
                        <i className="fa-solid fa-eye" aria-hidden="true" />
                      )}
                    </button>
                  </span>
                }
              </span>
            </label>
          </div>
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Confirm Password'}</span>
              <input className="form-control" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleTextChange} required />
            </label>
          </div>
          <button type="submit" disabled={loading} className="mt-3 mb-2 btn btn-primary w-100"> {loading ? 'Working...' : 'Register'} </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
