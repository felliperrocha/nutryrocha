import Sidebar from './Sidebar';

export default function Layout({ user, children }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main-content">
        {children}
      </main>
    </div>
  );
}
