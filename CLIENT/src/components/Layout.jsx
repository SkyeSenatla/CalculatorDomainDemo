// Layout.jsx — A reusable page wrapper that uses Component Composition.
// Instead of passing props down through many levels (prop drilling),
// we use the {children} prop so Layout doesn't need to know what's inside it.
// It just provides the "frame" — header, content area, and footer.

function Layout({ children, title }) {
  return (
    <div className="app-container">
      {/* The header displays a dynamic title passed as a prop */}
      <header className="main-header">
        <h1>{title}</h1>
      </header>

      {/* {children} renders whatever components are nested inside <Layout> */}
      <main className="content">
        {children}
      </main>

      {/* A static footer shared across all pages */}
      <footer className="main-footer">
        <p>&copy; 2026 Calculator Corp</p>
      </footer>
    </div>
  );
}

export default Layout;
