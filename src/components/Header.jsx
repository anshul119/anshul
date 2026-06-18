import { NavLink } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-container">
        <NavLink to="/" className="logo">
          <img src={logoImg} alt="Anshul Sharma" className="logo-icon" />
          ANSHUL SHARMA
        </NavLink>
        <nav>
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/blog"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                Stories
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                About
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
