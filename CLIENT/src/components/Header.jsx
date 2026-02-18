// Header.jsx — A simple presentational component.
// Now that Layout.jsx handles the main page header via composition,
// this component is kept as a reusable standalone header
// that could be used in other parts of the app if needed.

function Header() {
  return (
    <header>
      <h1>Calculator Dashboard</h1>
    </header>
  );
}

export default Header;
