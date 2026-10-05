import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { default as realAuthApi } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase());
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await realAuthApi.forgotPassword(email);
      setSuccess(response.message);
    } catch (err: any) {
      // The API is designed to not throw for this call, but in case it does.
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 mb-3 container content-narrow">
      <h1 className="text-center mb-4 fw-bold text-primary">Saved & Single</h1>
      <div className="p-3 p-sm-4 rounded border">
        <h2 className="text-center fw-bold mb-0">Forgot Password</h2>
        {success ? (
          <div hidden={!success}>
            <div role="alert" className="w-100 mt-2 mb-2 py-1 alert alert-success"> {success} </div>
          </div>
        ) : (
          <>
            {error && (
              <div hidden={!error}>
                <div role="alert" className="w-100 mb-2 py-1 alert alert-danger"> {error} </div>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="my-2 w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Email Address'}</span>
                  <input className="form-control" required id="email" name="email" autoComplete="email" autoFocus value={email} onChange={handleChange} type="email" />
                </label>
              </div>
              <button type="submit" disabled={loading || !!success} className="mt-3 mb-2 btn btn-primary w-100"> {loading ? 'Sending...' : 'Send Reset Link'} </button>
            </form>
          </>
        )}
        <RouterLink to="/login" className="mt-1 btn btn-link btn-sm w-100"> Remembered your password? Login </RouterLink>
      </div>
    </div>
  );
};

export default ForgotPassword;
