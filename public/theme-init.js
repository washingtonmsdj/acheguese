(() => {
  const root = document.documentElement;
  const storageKey = root.dataset.themeStorageKey;
  if (!storageKey) return;

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    const isDark = storedTheme === "dark";
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  } catch {
    root.classList.remove("dark");
    root.classList.add("light");
  }
})();
