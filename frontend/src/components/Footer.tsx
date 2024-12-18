import React from 'react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© 2024 MMS. All rights reserved.</p>
        {/* <div className="footer-links">
          <a href="/terms" className="footer-link">Terms of Service</a>
          <a href="/privacy" className="footer-link">Privacy Policy</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;