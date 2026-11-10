import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky-top border-bottom bg-body">
      <nav className="container d-flex align-items-center justify-content-between position-relative">
        {user ? (
          <>
            <div className={`fw-bold py-3 ms-2 ${location.pathname === '/events' ? 'text-primary' : 'text-body'}`} style={{ cursor: 'pointer' }} onClick={() => navigate('/events')}>Events</div>
            <div className={`position-absolute start-50 translate-middle-x fw-bold fs-4 ${location.pathname === '/' ? 'text-primary' : 'text-body'}`} style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>S&S</div>
            <div className={`fw-bold me-2 rounded-circle d-flex align-items-center justify-content-center ${location.pathname === '/profile' ? 'bg-primary text-white' : 'border border-secondary'}`} style={{ width: "30px", height: "30px" }} onClick={() => navigate('/profile')}>{user.first_name[0].toUpperCase()}</div>
          </>
        ) : (
          <>
            <div className={`fw-bold fs-4 ms-2 ${location.pathname === '/' ? 'text-primary' : 'text-body'}`} style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>S&S</div>
            <div className={`fw-bold py-3 me-2 ${['/register', '/login', '/forgot-password'].includes(location.pathname) ? 'text-primary' : 'text-body'}`} style={{ cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</div>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navigation;
