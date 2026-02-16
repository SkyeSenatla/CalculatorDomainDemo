// Header.jsx — A simple presentational component.
// Components are functions that return JSX.
// JSX looks like HTML but is actually JavaScript syntax that React transforms into DOM elements.
// This component takes no props — it just renders a static header.

function Header() {
  return (
    <header>
      <h1>Calculator Dashboard</h1>
    </header>
  );
}

// Every component file must export its component so other files can import it.
// "export default" means this is the main thing this file provides.
export default Header;
