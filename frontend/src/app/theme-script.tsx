// Inline script to prevent theme flash on page load.
// Reads the stored theme from localStorage and applies the dark class
// before React hydrates, avoiding a visible flash of the wrong theme.
// This is a static, hardcoded string with no user input - safe from XSS.

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("blocklancer-theme");if(t==="dark"||!t){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export function ThemeScript() {
  return (
    // eslint-disable-next-line react/no-danger
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
  );
}
