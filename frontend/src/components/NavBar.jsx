import { NavLink, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  const hideNav = ['/dashboard', '/onboarding'].includes(location.pathname);

  if (hideNav) return null;

  return (
    <nav className="nav-bar">
      <div className="nav-inner">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">⌂</span>
          Home
        </NavLink>
        <NavLink to="/week" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">▦</span>
          This Week
        </NavLink>
        <NavLink to="/anchors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⚓</span>
          Anchors
        </NavLink>
        <NavLink to="/support" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">◎</span>
          Support
        </NavLink>
      </div>
    </nav>
  );
}
