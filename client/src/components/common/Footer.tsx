import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="mt-0 py-2 px-3 bg-body-tertiary border-top text-center small">
        <p className="text-body-secondary d-block mb-0 text-center small">- Saved & Single {new Date().getFullYear()} -</p>
        <div className="d-flex justify-content-center gap-3">
          <a href="mailto:savedandsingle.events@gmail.com" className="text-body text-decoration-none text-muted small"> Contact Us </a>
          <RouterLink to="/privacy-policy" className="text-body text-decoration-none text-muted small"> Privacy Policy </RouterLink>
      </div>
    </footer>
  );
};

export default Footer;
