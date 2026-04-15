import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function Layout() {
  return (
    <div className="app-layout">
      <main className="app-content">
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
