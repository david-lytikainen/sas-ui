import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user
    ? [
        { label: 'S&S', to: '/' },
        { label: 'Events', to: '/events' },
        { label: `Hi, ${user.first_name}`, to: '/profile' },
      ]
    : [
        { label: 'S&S', to: '/' },
        { label: 'Register', to: '/register' },
      ];
  return (
    <header className="sticky-top border-bottom bg-body-tertiary">
      <nav className="container content-medium d-flex flex-nowrap overflow-hidden align-items-center gap-2 py-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = location.pathname === item.to || (item.to === '/register' && ['/login', '/forgot-password'].includes(location.pathname));
          return (
            <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} className={`btn btn-link text-decoration-none fw-bold ${active ? 'text-primary border-bottom border-primary' : 'text-body'} ${item.to === '/profile' ? 'text-truncate' : 'flex-shrink-0'} ${item.to === '/' ? 'fs-4' : ''}`} > {item.label} </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default Navigation;
