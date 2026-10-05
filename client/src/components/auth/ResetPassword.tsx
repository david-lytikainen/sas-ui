import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import realAuthApi from '../../services/api';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!token) {
        setError('Reset token is missing.');
        return;
      }
      await realAuthApi.resetPassword(token, formData.password);
      setSuccess('Your password has been reset successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 mb-5 container content-narrow">
      <div className="p-3 p-sm-4 rounded border">
        <h1 className="text-center mb-2 fw-bold text-primary">Saved & Single</h1>
        <h2 className="text-center mb-3 fw-bold">Set New Password</h2>
        {success ? (
          <div hidden={!success}>
            <div role="alert" className="w-100 mb-2 alert alert-success"> {success} </div>
          </div>
        ) : (
          <>
            <div hidden={!error}>
              <div role="alert" className="w-100 mb-2 alert alert-danger"> {error} </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="my-2 w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'New Password'}</span>
                  <span className="input-group">
                    <input className="form-control" required name="password" type={showPassword ? 'text' : 'password'} id="password" value={formData.password} onChange={handleChange} aria-invalid={!!error} />
                    {
                      <span className="input-group-text">
                        <button type="button" aria-label="Show or hide password" onClick={() => setShowPassword(!showPassword)} className="btn btn-outline-secondary btn-sm" >
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
                  <span className="form-label d-block">{'Confirm New Password'}</span>
                  <span className="input-group">
                    <input className="form-control" required name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} aria-invalid={!!error} />
                    {
                      <span className="input-group-text">
                        <button type="button" aria-label="Show or hide password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="btn btn-outline-secondary btn-sm" >
                          {showConfirmPassword ? (
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
              <button type="submit" disabled={loading} className="mt-3 mb-2 btn btn-primary w-100"> {loading ? 'Resetting...' : 'Set New Password'} </button>
            </form>
          </>
        )}
        <div className="text-center mt-3">
          <RouterLink to="/login">{'Back to Login'}</RouterLink>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
