import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSplash } from '../../context/SplashContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setShowLoginSplash } = useSplash();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'email' ? e.target.value.toLowerCase() : e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submittedForm = new FormData(e.currentTarget);
    const email = String(submittedForm.get('email') || '').toLowerCase().trim();
    const password = String(submittedForm.get('password') || '');
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setShowLoginSplash(true);
      navigate('/events', { replace: true, state: { showIncompleteProfilePreferences: true } });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mt-5 mb-3 container content-narrow">
      <h1 className="text-center mb-4 fw-bold text-primary">Saved & Single</h1>
      <div className="p-3 p-sm-4 rounded border">
        <p className="text-center fw-bold fs-5 mb-0">Login</p>
        <form onSubmit={handleSubmit}>
          <button type="button" onClick={() => navigate('/register')} className="btn btn-link btn-sm w-100">Don't have an account? Register</button>
          <div className="my-2 w-100">
            <input className="form-control" placeholder='Email Address' required id="email" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} type="email" />
          </div>
          <div className="my-2 w-100">
            <span className="input-group">
              <input className="form-control" placeholder='Password' required name="password" type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password" value={formData.password} onChange={handleChange} />
              {
                <span className="input-group-text">
                  <button type="button" onClick={handleTogglePassword} className="btn btn-outline-secondary btn-sm" >
                    {showPassword ? (<i className="fa-solid fa-eye-slash" />) : (<i className="fa-solid fa-eye" aria-hidden="true" />)}
                  </button>
                </span>
              }
            </span>
          </div>

          {error && (
            <div hidden={!error}>
              <div role="alert" className="w-100 mb-2 py-1 alert alert-danger"> {error} </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="mt-3 mb-2 btn btn-primary w-100"> {loading ? 'Logging in...' : 'Login'} </button>
          <div className="text-center">
            <RouterLink to="/forgot-password">{'Forgot Password?'}</RouterLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
