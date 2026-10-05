import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="py-2 px-3 mt-auto bg-body-tertiary border-top text-center small">
      <div className="container">
        <p className="text-body-secondary d-block mb-0 small text-center">- Saved & Single {new Date().getFullYear()} -</p>
        <div className="d-flex justify-content-center gap-3">
          <a href="mailto:savedandsingle.events@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}> Contact Us </a>
          <RouterLink to="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}> Privacy Policy </RouterLink>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
