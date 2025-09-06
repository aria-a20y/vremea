const apiKey = "ae826717ee8b19b14a693cff3a9c8a31";

window.onload = () => {
  showSavedCities();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("Coordonate detectate:", lat, lon);

        const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ro`;
        const airURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        axios.get(forecastURL)
          .then(response => {
            const data = response.data;
            showForecast(data);
            setBackgroundImage(data.list[0].weather[0].description);
          })
          .catch(error => {
            console.error("Eroare la prognoza automată:", error);
            document.getElementById("weatherResult").innerHTML = "Nu s-a putut obține prognoza automată.";
          });

        axios.get(airURL)
          .then(response => showAirQuality(response.data.list[0].components))
          .catch(error => console.error("Eroare calitate aer:", error));
      },
      error => console.error("Eroare geolocație:", error)
    );
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("✅ Service Worker înregistrat"))
      .catch(err => console.error("❌ Eroare Service Worker:", err));
  }

  document.getElementById("cityInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      getweather();
    }
  });

  document.getElementById("cityInput").addEventListener("input", async function () {
  const input = this.value.trim();
  const list = document.getElementById("citySuggestions");
  list.innerHTML = "";

  if (input.length < 2) return;

  const matches = await fetchCitySuggestions(input);

  matches.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.classList.add("suggestion-item");
    li.onclick = () => {
      document.getElementById("cityInput").value = city;
      getweather();
      list.innerHTML = "";
    };
    list.appendChild(li);
  });
});
};


async function fetchCitySuggestions(query) {
  const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}&limit=5&sort=-population`;

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": "9c191513ffmsh40239d83be184cep1ba085jsn57a2739880c5",
      "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result.data.map(city => city.name);
  } catch (error) {
    console.error("Eroare la sugestii orașe:", error);
    return [];
  }
}


function checkExtremeWeather(desc) {
  desc = desc.toLowerCase();
  const container = document.getElementById("weatherAlerts");
  container.innerHTML = ""; // curăță avertismentele anterioare

  if (desc.includes("furtună") || desc.includes("descărcări electrice")) {
    container.innerHTML = `<div class="alert-card severe">⚠️ Avertisment: furtună în zonă! Ia măsuri de siguranță.</div>`;
  } else if (desc.includes("ninsoare abundentă") || desc.includes("viscol")) {
    container.innerHTML = `<div class="alert-card snow">❄️ Avertisment: ninsoare puternică! Drumuri dificile posibile.</div>`;
  } else if (desc.includes("caniculă") || desc.includes("temperaturi extreme")) {
    container.innerHTML = `<div class="alert-card heat">🔥 Avertisment: caniculă! Hidratează-te și evită expunerea prelungită.</div>`;
  } else if (desc.includes("ceață")) {
    container.innerHTML = `<div class="alert-card fog">🌫️ Avertisment: vizibilitate redusă din cauza ceții.</div>`;
  }
}


function getweather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ro`;

  axios.get(url)
    .then(response => {
      const data = response.data;
      const normalizedCity = data.city.name;
      saveCity(normalizedCity);
      showForecast(data);
      setBackgroundImage(data.list[0].weather[0].description);
    })
    .catch(error => {
      console.error("Eroare Axios:", error);
      document.getElementById("weatherResult").innerHTML = "Orașul nu a fost găsit sau a apărut o eroare.";
    });
}

function getWindDirection(deg) {
  const directions = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Vest", "Vest", "Nord-Vest"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}


function showForecast(data) {
  const city = data.city.name;
  const today = data.list[0];
  const temp = Math.round(today.main.temp);
  const desc = today.weather[0].description;
checkExtremeWeather(desc);
const message = getWeatherMessage(desc);
  const icon = today.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const windSpeed = Math.round(today.wind.speed * 3.6);
  const windDir = getWindDirection(today.wind.deg);
  const humidity = today.main.humidity;
const timezoneOffset = data.city.timezone;
const offsetHours = data.city.timezone / 3600;
const gmtLabel = `GMT${offsetHours >= 0 ? "+" : ""}${offsetHours}`;
const sunrise = new Date((data.city.sunrise + timezoneOffset) * 1000).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
const sunset = new Date((data.city.sunset + timezoneOffset) * 1000).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });


  let forecastHTML = `
    <h2>Prognoză pentru ${city}</h2>
    <div class="today-card">
      <img src="${iconUrl}" alt="iconiță vreme"><br>
      <strong>${desc}</strong><br>
      🌡️ ${temp}°C<br>
      💨 Vânt: ${windSpeed} km/h dinspre ${windDir}<br>
      💧 Umiditate: ${humidity}%
<p class="weather-message">${message}</p>

    <div class="sun-times">
      🌅 <strong>Răsărit:</strong> ${sunrise}<br>
      🌇 <strong>Apus:</strong> ${sunset}
    </div>
    <h3>Următoarele 5 zile</h3>
    <div class="forecast-row">
  `;

  const dailyMap = new Map();

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().split("T")[0];

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, {
        dayName: date.toLocaleDateString("ro-RO", { weekday: "long" }),
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        icon: item.weather[0].icon,
        desc: item.weather[0].description,
        windSpeed: item.wind.speed,
        windDir: item.wind.deg,
        humidity: item.main.humidity
      });
    } else {
      const existing = dailyMap.get(dayKey);
      existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
      existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
    }

  });


  const todayDate = new Date(today.dt * 1000).toISOString().split("T")[0];
  const entries = Array.from(dailyMap.entries())
    .filter(([date]) => date !== todayDate)
    .slice(0, 7);

  entries.forEach(([_, info]) => {
    const iconUrl = `https://openweathermap.org/img/wn/${info.icon}@2x.png`;
    const isWeekend = info.dayName.toLowerCase().includes("sâmbătă") || info.dayName.toLowerCase().includes("duminică");
    const cardClass = isWeekend ? "forecast-card weekend" : "forecast-card";
    const windSpeed = Math.round(info.windSpeed * 3.6);
    const windDir = getWindDirection(info.windDir);

    forecastHTML += `
      <div class="${cardClass}">
        <strong>${info.dayName}</strong><br>
        <img src="${iconUrl}" alt="iconiță vreme"><br>
        🌡️ ${Math.round(info.tempMax)}° / ${Math.round(info.tempMin)}°<br>
        💨 ${windSpeed} km/h dinspre ${windDir}<br>
        💧 Umiditate: ${info.humidity}%
      </div>
    `;
  });

  forecastHTML += `</div>`;
  document.getElementById("weatherResult").innerHTML = forecastHTML;
}

function getWeatherMessage(desc) {
  desc = desc.toLowerCase();
  if (desc.includes("senin")) return "☀️ Zi perfectă pentru plimbări!";
  if (desc.includes("furtună")) return "⛈️ Stai în siguranță!";
  if (desc.includes("ninsoare")) return "Ia-ți haine groase și ai grijă la drum!❄️";
  if (desc.includes("ploaie")) return "Nu uita umbrela! ☔";
  if (desc.includes("ceață")) return "Vizibilitate redusă – circulă cu atenție. 🌫️";

  return "Verifică prognoza detaliată pentru mai multe informații.";
}

function setBackgroundImage(desc) {
  desc = desc.toLowerCase();4
const body = document.body;

  const snowWords = ["ninsoare", "zăpadă", "viscol", "fulgi"];
  const rainWords = ["ploaie", "averse", "burniță", "torențial"];
  const fogWords = ["ceață", "vizibilitate redusă", "nor dens"];
  const sunWords = ["soare", "senin", "cer senin", "parțial însorit"];
  const stormWords = ["furtună", "descărcări electrice", "tunete", "fulgere"];
  const cloudsWords = ["noros", "înnorat", "cer acoperit", "nori", "nori împrăștiați", "cer fragmentat"];

 let image = "default.jpg";
  if (snowWords.some(word => desc.includes(word))) image = "snow.jpg";
  else if (rainWords.some(word => desc.includes(word))) image = "rainy.jpg";
  else if (fogWords.some(word => desc.includes(word))) image = "fog.jpg";
  else if (stormWords.some(word => desc.includes(word))) image = "storm.jpg";
  else if (sunWords.some(word => desc.includes(word))) image = "sunny.jpg";
  else if (cloudsWords.some(word => desc.includes(word))) image = "cloudy.jpg";
  
  body.style.backgroundImage = `url('${image}')`;
}

function getAirQualityLevel(value, type) {
  if (type === "pm25") {
    if (value <= 12) return { level: "Bun", color: "green" };
    if (value <= 35) return { level: "Moderat", color: "yellow" };
    if (value <= 55) return { level: "Nesănătos", color: "orange" };
    return { level: "Periculos", color: "red" };
  }
  if (type === "pm10") {
    if (value <= 20) return { level: "Bun", color: "green" };
    if (value <= 50) return { level: "Moderat", color: "yellow" };
    if (value <= 100) return { level: "Nesănătos", color: "orange" };
    return { level: "Periculos", color: "red" };
  }
  if (type === "co") {
    if (value <= 4) return { level: "Bun", color: "green" };
    if (value <= 9) return { level: "Moderat", color: "yellow" };
    return { level: "Periculos", color: "red" };
  }
}

function getAirQualityMessage(value, type) {
  if (type === "pm25") {
    if (value <= 12) return "Aer curat. Poți respira adânc fără griji! 🌿";
    if (value <= 35) return "Calitate moderată. Persoanele sensibile ar trebui să evite efortul intens.";
    if (value <= 55) return "Aer nesănătos. Evită activitățile în aer liber prelungite.";
    return "Nivel periculos de particule fine! Stai în interior și evită expunerea. 🚨";
  }

  if (type === "pm10") {
    if (value <= 20) return "Aer bun. Particulele grosiere sunt la un nivel sigur.";
    if (value <= 50) return "Nivel moderat. Poate afecta persoanele cu afecțiuni respiratorii.";
    if (value <= 100) return "Aer nesănătos. Poartă mască dacă ieși afară.";
    return "Nivel periculos de PM10! Evită complet expunerea. 🛑";
  }

  if (type === "co") {
    if (value <= 4) return "Nivel sigur de monoxid de carbon. 🌬️";
    if (value <= 9) return "Nivel moderat de CO. Ventilează bine spațiile închise.";
    return "Concentrație periculoasă de CO! Evită zonele aglomerate și închise. ⚠️";
  }

  return "Date indisponibile.";
}

function showAirQuality(components) {
  const pm25 = components.pm2_5;
  const pm10 = components.pm10;
  const co = components.co;

  const pm25Level = getAirQualityLevel(pm25, "pm25");
  const pm10Level = getAirQualityLevel(pm10, "pm10");
  const coLevel = getAirQualityLevel(co, "co");

  const pm25Msg = getAirQualityMessage(pm25, "pm25");
  const pm10Msg = getAirQualityMessage(pm10, "pm10");
  const coMsg = getAirQualityMessage(co, "co");

  const airText = `
    <div class="air-block">
      <h3>🌫️ Particule fine (PM2.5)</h3>
      <p style="color:${pm25Level.color}">${pm25} µg/m³ – ${pm25Level.level}</p>
      <p>${pm25Msg}</p>
    </div>
    <div class="air-block">
      <h3>🌪️ Particule grosiere (PM10)</h3>
      <p style="color:${pm10Level.color}">${pm10} µg/m³ – ${pm10Level.level}</p>
      <p>${pm10Msg}</p>
    </div>
    <div class="air-block">
      <h3>🧪 Monoxid de carbon (CO)</h3>
      <p style="color:${coLevel.color}">${co} ppm – ${coLevel.level}</p>
      <p>${coMsg}</p>
    </div>
  `;

  document.getElementById("airResult").innerHTML = airText;
}

// Salvează orașul cu număr de căutări
function saveCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || {};
  cities[city] = (cities[city] || 0) + 1;
  localStorage.setItem("cities", JSON.stringify(cities));
  showSavedCities();
}

// Afișează orașele salvate și butonul de resetare
function showSavedCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || {};
  const container = document.getElementById("savedCities");
  container.innerHTML = "<h3>Orașe salvate</h3>";

  let found = false;

  for (const city in cities) {
    if (cities[city] >= 3) {
      found = true;
      const btn = document.createElement("button");
      btn.textContent = `${city}`;
      btn.onclick = () => {
        document.getElementById("cityInput").value = city;
        getweather();
      };
      container.appendChild(btn);
    }
  }

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Resetare orașe";
  resetBtn.style.background = "#ffebee";
  resetBtn.style.color = "#c62828";
  resetBtn.style.border = "1px solid #c62828";
  resetBtn.style.marginTop = "10px";
  resetBtn.onclick = () => {
localStorage.removeItem("cities");
    location.reload();
  };
  container.appendChild(resetBtn);

  if (!found) {
    const msg = document.createElement("p");
    msg.textContent = "Niciun oraș salvat.";
    msg.style.color = "#777";
    msg.style.fontStyle = "italic";
    container.appendChild(msg);
  }
}




