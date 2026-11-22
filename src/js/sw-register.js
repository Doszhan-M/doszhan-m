// Регистрация service worker — после ухода прелоадера, когда браузер простаивает.
// Раньше он регистрировался сразу при загрузке и качал свой precache параллельно со
// страницей, отнимая канал у первого экрана.
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  const register = () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
  };
  if ("requestIdleCallback" in window) {
    requestIdleCallback(register, { timeout: 5000 });
  } else {
    setTimeout(register, 2000);
  }
}
