// Escapes backslashes for use in URLs (e.g., from Windows paths)
export function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

// Capitalizes the first letter of a string
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Debounce function to limit how often a function is called
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}