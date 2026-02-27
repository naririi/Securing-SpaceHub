import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <p style={styles.warningText}>
          <strong>⚠️ Sistema Informativo Istituzionale</strong><br />
          L'uso di SpaceHub è autorizzato esclusivamente per la consultazione degli orari e la prenotazione delle aule da parte dell'utenza accademica. 
          Gli accessi all'area pubblica sono soggetti a registrazione dei log di rete (IP e Timestamp) per la sola mitigazione di attacchi informatici (DoS/Brute Force).
        </p>
        <div style={styles.links}>
          <Link to="/privacy-policy" style={styles.link}>Privacy Policy</Link>
          <span style={styles.separator}>|</span>
          <Link to="/terms" style={styles.link}>Condizioni d'Uso</Link>
        </div>
        <p style={styles.copyright}>
          &copy; {new Date().getFullYear()} SpaceHub - Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
};

const styles = {
  footer: { backgroundColor: '#f8f9fa', padding: '20px 0', borderTop: '1px solid #e7e7e7', marginTop: 'auto', textAlign: 'center', fontSize: '13px', color: '#555' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '0 15px' },
  warningText: { marginBottom: '15px', lineHeight: '1.5' },
  links: { marginBottom: '10px' },
  link: { color: '#0056b3', textDecoration: 'none', fontWeight: 'bold' },
  separator: { margin: '0 10px', color: '#ccc' },
  copyright: { fontSize: '12px', color: '#888' }
};

export default Footer;