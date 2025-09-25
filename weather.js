const WEATHER_API_KEY = "f63434267eaeefb3ba598f95276a07da";

    async function getUserLocation() {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            async () => {
              try {
                const ipRes = await fetch("https://ipapi.co/json/");
                const ipData = await ipRes.json();
                resolve({ lat: ipData.latitude, lon: ipData.longitude });
              } catch (_) {
                resolve(null);
              }
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          fetch("https://ipapi.co/json/")
            .then(res => res.json())
            .then(ipData => resolve({ lat: ipData.latitude, lon: ipData.longitude }))
            .catch(() => resolve(null));
        }
      });
    }

    async function fetchWeather(location) {
      if (!location) return null;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${WEATHER_API_KEY}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.cod === 401) return null;
        return {
          city: data.name,
          temp: data.main?.temp != null ? Math.round(data.main.temp) : "N/A",
          humidity: data.main?.humidity,
          wind: data.wind?.speed ? Math.round(data.wind.speed * 3.6) : null,
          desc: data.weather?.[0]?.description,
          time: new Date().toLocaleTimeString()
        };
      } catch {
        return null;
      }
    }

    function renderWeather(weather) {
      const weatherDiv = document.getElementById("weatherData");
      if (!weather) {
        weatherDiv.innerHTML = "<p>Error loading weather data.</p>";
        return;
      }
      weatherDiv.innerHTML = `
        <div style="font-size:1.1rem;color:#2d5a2d;margin-bottom:6px;">📍 ${weather.city}</div>
        <div class="dashboard">
          <div class="card">
            <div class="icon"><i class="fa-solid fa-sun"></i></div>
            <div class="info">
              <div class="label">Temperature</div>
              <div class="value">${weather.temp}°C</div>
            </div>
          </div>
          <div class="card">
            <div class="icon"><i class="fa-solid fa-droplet"></i></div>
            <div class="info">
              <div class="label">Humidity</div>
              <div class="value">${weather.humidity}%</div>
            </div>
          </div>
          <div class="card">
            <div class="icon"><i class="fa-solid fa-wind"></i></div>
            <div class="info">
              <div class="label">Wind Speed</div>
              <div class="value">${weather.wind} km/h</div>
            </div>
          </div>
          <div class="card">
            <div class="icon"><i class="fa-solid fa-cloud-showers-heavy"></i></div>
            <div class="info">
              <div class="label">Condition</div>
              <div class="value">${weather.desc ? weather.desc : ""}</div>
            </div>
          </div>
        </div>
        <div style="font-size:1rem;margin-top:8px;">🕒 ${weather.time}</div>
      `;
    }

    function renderRecommendations(weather) {
      const recDiv = document.getElementById("cropRecommendations");
      if (!weather) {
        recDiv.innerHTML = "<p>No recommendations available.</p>";
        recDiv.classList.remove("hidden");
        return;
      }

      let crops = [];
      if (weather.temp >= 20 && weather.temp <= 30 && weather.humidity > 50) {
        crops.push("🌾 Rice", "🌽 Maize", "🥒 Cucumbers");
      } else if (weather.temp > 30) {
        crops.push("🌻 Sunflower", "🍉 Watermelon", "🥭 Mango");
      } else if (weather.temp < 20) {
        crops.push("🥔 Potato", "🥬 Spinach", "🥦 Broccoli");
      } else {
        crops.push("🍅 Tomato", "🥜 Groundnut", "🍆 Brinjal");
      }

      recDiv.innerHTML = `
        <h4 style="color:#2d5a2d;">Recommended Crops for ${weather.city}:</h4>
        <ul>
          ${crops.map(c => `<li>${c}</li>`).join("")}
        </ul>
      `;
      recDiv.classList.remove("hidden");
    }

    async function detectLocation() {
      const location = await getUserLocation();
      const weather = await fetchWeather(location);
      renderWeather(weather);
      renderRecommendations(weather);
    }

    // Bind button
    document.getElementById("detectBtn").addEventListener("click", detectLocation);
