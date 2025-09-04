const CACHE_NAME = "vremea-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icon.jpg",
  "/sunny.jpeg",
  "/rainy.jpg",
  "/cloudy.jpg",
"/offline.html",
  "/snow.jpg",
  "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"
];

// Instalare și salvare în cache
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Dacă găsim în cache, returnăm direct
      if (response) {
        return response;
      }

      // Dacă nu e în cache, încercăm să-l luăm din rețea
      return fetch(event.request).catch(() => {
        // Dacă fetch eșuează (ex: offline), returnăm o pagină statică
        if (event.request.destination === "document") {
          return caches.match("/offline.html");
        }
      });
    })
  );
});

// Activare și curățare cache vechi
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Interceptare cereri și fallback din cache
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});