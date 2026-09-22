/**
 * Runs before first paint to set the theme, so a dark-mode reader never sees a
 * white flash. Inlined into <head> as a string — it cannot be a component,
 * because by the time React hydrates the page has already painted.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem('scope.theme');
var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme=(s==='dark'||s==='light')?s:(d?'dark':'light');
var l=localStorage.getItem('scope.lang');
if(l==='de'||l==='en')document.documentElement.lang=l;
}catch(e){}})();`;
