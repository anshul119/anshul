import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer style={{ 
      borderTop: '1px solid var(--border-color)', 
      padding: 'var(--spacing-md) 0', 
      marginTop: 'var(--spacing-xl)',
      textAlign: 'center',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <div>
          &copy; {currentYear} Anshul Sharma. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link to="/" className="mono" style={{ fontSize: '0.75rem' }}>Home</Link>
          <Link to="/blog" className="mono" style={{ fontSize: '0.75rem' }}>Blog</Link>
          <Link to="/about" className="mono" style={{ fontSize: '0.75rem' }}>About</Link>
        </div>
      </div>
    </footer>
  );
}
