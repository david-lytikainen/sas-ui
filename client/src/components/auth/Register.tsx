import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSplash } from '../../context/SplashContext';
import { parseDateOnly } from '../../utils/date';
import { formatPhone, normalizePhone } from '../../utils/phone';
import BirthdayPicker from '../common/BirthdayPicker';

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
        <p className="text-center fw-bold fs-5 mb-0">Register</p>
        <form onSubmit={handleSubmit} autoComplete="off">
          <button type="button" onClick={() => navigate('/login')} className="btn btn-link btn-sm w-100"> Already have an account? Login </button>
          <input className="form-control mt-2" placeholder='First Name' name="first_name" autoComplete="off" value={formData.first_name} onChange={handleTextChange} required />
          <input className="form-control my-2" placeholder='Last Name' name="last_name" autoComplete="off" value={formData.last_name} onChange={handleTextChange} required />
          <BirthdayPicker value={formData.birthday} minAge={18} startingYear={2000} onChange={(birthday) => setFormData((prev) => ({ ...prev, birthday }))} />
          <select className="form-select mt-2" required id="gender-select" name="gender" autoComplete="off" value={formData.gender} onChange={handleSelectChange}>
            <option value="" disabled>Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input className="form-control mt-2" placeholder='Phone Number' name="phone" autoComplete="off" value={formattedPhone} onChange={handleTextChange} required type="tel" inputMode="numeric" maxLength={14} pattern={'\\(\\d{3}\\)-\\d{3}-\\d{4}'} />
          <input className="form-control mt-2" placeholder='Email Address' name="email" autoComplete="off" type="email" value={formData.email} onChange={handleTextChange} required />
          <div className="input-group mt-2">
            <input className="form-control" placeholder='Password' name="password" autoComplete="off" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleTextChange} required />
              <span className="input-group-text">
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="btn btn-outline-secondary btn-sm" >
                  {showPassword ? (<i className="fa-solid fa-eye-slash" />) : (<i className="fa-solid fa-eye" />)}
                </button>
              </span>
          </div>
          <div className="my-2 w-100">
            <input className="form-control" placeholder='Confirm Password' name="confirmPassword" autoComplete="off" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleTextChange} required />
          </div>
          {error && (
            <div role="alert" className="mb-2 py-1 alert alert-danger"> {error} </div>
          )}
          <button type="submit" disabled={loading} className="mt-3 mb-2 btn btn-primary w-100"> {loading ? 'Working...' : 'Register'} </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
