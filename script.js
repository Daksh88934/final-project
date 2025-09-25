// Global variables
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
let userLocation = null;
let locationSource = null; // 'gps' | 'ip'
let currentLanguage = 'en';

// i18n via API
let translations = {};

async function loadLanguage(lang) {
    try {
        const res = await fetch(`https://your-backend-url.com/i18n/${lang}.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error('lang fetch failed');
        translations = await res.json();
    } catch (e) {
        const fallbacks = {
            en: { login:'Login', detectLocation:'📍 Detect My Location', weatherTitle:'Weather In Your Area', alertsTitle:'⚠️ Alerts', recTitle:'Recommendations', schemesTitle:'Government Schemes & Policies', featuresTitle:'Our Features', news:'Farming updates' },
            hi: { login:'लॉगिन', detectLocation:'📍 मेरा स्थान खोजें', weatherTitle:'आपके क्षेत्र का मौसम', alertsTitle:'⚠️ अलर्ट', recTitle:'सिफ़ारिशें', schemesTitle:'सरकारी योजनाएँ', featuresTitle:'हमारी विशेषताएँ', news:'खेती से जुड़ी खबरें' }
        };
        translations = fallbacks[lang] || fallbacks.en;
    }
    applyTranslations();
}

function t(key, def='') { return (translations && translations[key]) || def || key; }

function applyTranslations() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.textContent = t('login','Login');
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) detectBtn.textContent = t('detectLocation','📍 Detect My Location');
    const weatherTitle = document.getElementById('weatherTitle');
    if (weatherTitle) weatherTitle.textContent = t('weatherTitle','Weather In Your Area');
    const alertsTitle = document.getElementById('alertsTitle');
    if (alertsTitle) alertsTitle.textContent = t('alertsTitle','⚠️ Alerts');
    const recTitle = document.getElementById('recTitle');
    if (recTitle) recTitle.textContent = t('recTitle','Recommendations');
    const schemesTitle = document.getElementById('schemesTitle');
    if (schemesTitle) schemesTitle.textContent = t('schemesTitle','Government Schemes & Policies');
    const featuresTitle = document.getElementById('featuresTitle');
    if (featuresTitle) featuresTitle.textContent = t('featuresTitle','Our Features');
    const ticker = document.getElementById('newsTicker');
    if (ticker) ticker.textContent = t('news', ticker.textContent);
}

// Initialize website
document.addEventListener('DOMContentLoaded', function() {
    startSlideshow();
    updateTicker();
    setupForms();
    loadLanguage(currentLanguage);
    setupChatLauncher();
    initWeatherOnLoad();
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
});

// News ticker
function fetchNews() {
    const farmingNews = [
        "🌾 Breaking: New subsidies announced for organic farming",
        "🚜 Modern farming techniques increase crop yield by 40%",
        "💧 Drip irrigation schemes launched in 5 states",
        "🌱 Weather alert: Heavy rains expected in North India next week",
        "📈 Market prices for wheat touch new highs",
        "🏛️ Government launches digital farming portal for farmers",
        "🌿 Sustainable agriculture practices showing promising results",
        "📱 New mobile app for crop disease identification launched",
    ];
    return farmingNews.join(' • ');
}
function updateTicker() {
    const ticker = document.getElementById('newsTicker');
    if (ticker) ticker.textContent = fetchNews();
}

function startSlideshow() {
    setInterval(() => {
        if (!slides.length) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

function setupChatLauncher() {
    const launcher = document.getElementById('chat-launcher');
    const defaultBtn = document.getElementById('chat-float-btn');
    if (defaultBtn) defaultBtn.style.display = 'none';
    if (launcher) {
        launcher.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openChatBox();
        });
        const bubble = launcher.querySelector('.speech-bubble');
        if (bubble) setTimeout(() => { bubble.style.display = 'none'; }, 5000);
    }
    // Also guard the floating chat button against tap-through
    const floatBtnEl = document.querySelector('#chat-float-btn button');
    if (floatBtnEl) {
        floatBtnEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openChatBox();
        });
    }
}

// Location detection
async function detectLocation() {
    const btn = document.querySelector('.detect-location-btn');
    if (!btn) return;
    btn.textContent = '🔄 Detecting Location...';
    btn.disabled = true;
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
                    locationSource = 'gps';
                    btn.textContent = '✅ Location Detected!';
                    await fetchWeatherData(userLocation);
                    await fetchCropRecommendations(userLocation);
                    setTimeout(() => { btn.textContent = '📍 Detect My Location'; btn.disabled = false; }, 2000);
                },
                async () => {
                    const approx = await getApproxLocationViaIP();
                    if (approx) {
                        userLocation = approx;
                        locationSource = 'ip';
                        btn.textContent = '✅ Approx Location Detected';
                        await fetchWeatherData(userLocation);
                        await fetchCropRecommendations(userLocation);
                    } else {
                        btn.textContent = '❌ Location Access Denied';
                    }
                    setTimeout(() => { btn.textContent = '📍 Detect My Location'; btn.disabled = false; }, 2000);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            const approx = await getApproxLocationViaIP();
            if (!approx) throw new Error('Geolocation not supported');
            userLocation = approx;
            locationSource = 'ip';
            await fetchWeatherData(userLocation);
            await fetchCropRecommendations(userLocation);
            btn.textContent = '✅ Approx Location Detected';
            setTimeout(() => { btn.textContent = '📍 Detect My Location'; btn.disabled = false; }, 2000);
        }
    } catch (error) {
        btn.textContent = '❌ Error Detecting Location';
        setTimeout(() => { btn.textContent = '📍 Detect My Location'; btn.disabled = false; }, 2000);
    }
}

async function getApproxLocationViaIP() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) return null;
        const d = await res.json();
        if (d && d.latitude && d.longitude) return { lat: d.latitude, lon: d.longitude };
    } catch (_) {}
    return null;
}

// Custom provider hook (same as inline)
window.CUSTOM_WEATHER = {
    buildUrl: (lat, lon) => `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=f63434267eaeefb3ba598f95276a07da`,
    map: (raw) => ({
        cityName: raw && raw.name,
        temperatureC: raw && raw.main && typeof raw.main.temp === 'number' ? Math.round(raw.main.temp) : null,
        humidityPct: raw && raw.main && typeof raw.main.humidity === 'number' ? raw.main.humidity : null,
        windKmh: raw && raw.wind && typeof raw.wind.speed === 'number' ? Math.round(raw.wind.speed * 3.6) : null,
        rainChancePct: null,
        conditionText: raw && raw.weather && raw.weather[0] && raw.weather[0].description ? raw.weather[0].description : 'Weather',
        alerts: []
    })
};

// Clean fetch function for weather with error handling
async function fetchWeatherWithKey(lat, lon) {
    const apiKey = 'f63434267eaeefb3ba598f95276a07da';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (response.status === 401 || data.cod === 401) {
            alert('API key expired or invalid!');
            return null;
        }
        return data;
    } catch (err) {
        alert('Error fetching weather data.');
        return null;
    }
}

// Example usage:
const lat = 28.6139;
const lon = 77.2090;
fetchWeatherWithKey(lat, lon).then(data => {
    if (data) {
        console.log('Weather Data:', data);
        // Update your UI here
    }
});

function renderBasicWeatherUI(model) {
    const weatherContainer = document.getElementById('weatherData');
    const grid = document.getElementById('weatherGrid');
    grid.classList.add('hidden');
    grid.innerHTML = '';

    // Strict 4 tiles in the requested order: temp, humidity, rain, wind
    const tiles = [
        { icon: '<i class="fa-solid fa-sun"></i>', label: 'Temperature', value: model.temperatureC != null ? `${model.temperatureC} °C` : '—' },
        { icon: '<i class="fa-solid fa-droplet"></i>', label: 'Humidity', value: model.humidityPct != null ? `${model.humidityPct}%` : '—' },
        { icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>', label: 'Rain chances', value: model.rainChancePct != null ? `${model.rainChancePct}%` : '—' },
        { icon: '<i class="fa-solid fa-wind"></i>', label: 'Wind Speed', value: model.windKmh != null ? `${model.windKmh} km/h` : '—' }
    ];

    const sourceNoteHtml = model.sourceNote ? '<div style="color:#666;font-size:0.9rem;margin-top:2px;">' + model.sourceNote + '</div>' : '';
    if (window.setWeatherHeader) {
        window.setWeatherHeader(model.conditionText || '', sourceNoteHtml);
    } else {
        const header = `
            <div style="font-size:1.2rem;margin-top:4px;">${model.conditionText || ''}</div>
            ${sourceNoteHtml}
        `;
        weatherContainer.innerHTML = header;
    }
    if (window.renderWeatherTiles) {
        window.renderWeatherTiles(tiles, model.cityName || '');
    } else {
        tiles.forEach((t, i) => {
            const el = document.createElement('div');
            const variant = i===0 ? 'variant-temp' : i===1 ? 'variant-humidity' : i===2 ? 'variant-wind' : 'variant-rain';
            el.className = `metric-tile ${variant}`;
            el.innerHTML = `<span class="metric-icon-circle"><span class="metric-icon" style="--d:${i}">${t.icon}</span></span><div class="metric-value">${t.value}</div><div class="metric-label">${t.label}</div>`;
            grid.appendChild(el);
        });
        if (window.anime) {
            anime({ targets: '#weatherGrid .metric-tile', translateY: [16, 0], opacity: [0, 1], scale: [0.96, 1], duration: 650, easing: 'cubicBezier(.2,.8,.2,1)', delay: anime.stagger(80) });
            anime({ targets: '#weatherGrid .metric-icon', rotate: [ -12, 0 ], duration: 700, easing: 'spring(1, 70, 10, 0)', delay: anime.stagger(120) });
        }
        // place name under metrics
        const place = document.createElement('div');
        place.className = 'weather-place';
        place.textContent = model.cityName ? `📍 ${model.cityName}` : '';
        weatherContainer.appendChild(place);
    }
    // pulse glow on first paint
    const weatherCard = document.querySelector('.info-card.weather-info');
    if (weatherCard) {
        weatherCard.classList.add('weather-detected');
        setTimeout(()=>weatherCard.classList.remove('weather-detected'), 1500);
    }
    grid.classList.remove('hidden');
    // place name under metrics
    const place = document.createElement('div');
    place.className = 'weather-place';
    place.textContent = model.cityName ? `📍 ${model.cityName}` : '';
    weatherContainer.appendChild(place);
}

// NOTE: declared once above; remove duplicate declarations below
let latestWeatherSnapshot = null;
function decodeWeatherCode(code) {
    const map = { 0:'Clear sky ☀️',1:'Mainly clear 🌤️',2:'Partly cloudy ⛅',3:'Overcast ☁️',45:'Fog 🌫️',48:'Depositing rime fog 🌫️',51:'Light drizzle 🌦️',53:'Moderate drizzle 🌦️',55:'Dense drizzle 🌧️',56:'Light freezing drizzle 🥶🌦️',57:'Dense freezing drizzle 🥶🌧️',61:'Slight rain 🌦️',63:'Moderate rain 🌧️',65:'Heavy rain ⛈️',66:'Light freezing rain 🥶🌧️',67:'Heavy freezing rain 🥶⛈️',71:'Slight snow 🌨️',73:'Moderate snow 🌨️',75:'Heavy snow ❄️',77:'Snow grains 🌨️',80:'Rain showers 🌦️',81:'Moderate rain showers 🌧️',82:'Violent rain showers ⛈️',85:'Snow showers 🌨️',86:'Heavy snow showers ❄️',95:'Thunderstorm ⛈️',96:'Thunderstorm with hail ⛈️',99:'Thunderstorm with heavy hail ⛈️' };
    return map[code] || `Code ${code}`;
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`);
        const data = await res.json();
        if (data && data.results && data.results.length) {
            const r = data.results[0];
            const parts = [r.name, r.admin1, r.country].filter(Boolean);
            return parts.join(', ');
        }
    } catch (e) {}
    return '';
}

async function autofillLocation(inputId) {
    try {
        if (!navigator.geolocation) throw new Error('Geolocation not supported');
        const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        );
        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
        const place = await reverseGeocode(lat, lon);
        const input = document.getElementById(inputId);
        if (input) input.value = place || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (err) {
        alert('Unable to detect location. Please enter manually.');
    }
}

async function fetchWeatherData(location) {
    const lat = location.lat;
    const lon = location.lon;
    const weatherContainer = document.getElementById('weatherData');
    const grid = document.getElementById('weatherGrid');
    weatherContainer.innerHTML = '<p>Loading real-time weather...</p>';
    grid.classList.add('hidden');
    grid.innerHTML = '';
    if (window.CUSTOM_WEATHER && typeof window.CUSTOM_WEATHER.buildUrl === 'function') {
        try {
            const reqUrl = window.CUSTOM_WEATHER.buildUrl(lat, lon);
            const raw = await fetch(reqUrl).then(r => r.json());
            const map = typeof window.CUSTOM_WEATHER.map === 'function' ? window.CUSTOM_WEATHER.map : (d)=>d;
            const model = map(raw) || {};
            model.sourceNote = locationSource === 'gps' ? 'Using precise GPS' : (locationSource === 'ip' ? 'Using approximate IP location' : '');
            
            // After fetching OpenWeatherMap daily forecast
            const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${owmKey}`;
            const dailyRes = await fetch(oneCallUrl).then(r => r.json());
            const todayRainChance = dailyRes && dailyRes.daily && dailyRes.daily[0] ? Math.round((dailyRes.daily[0].pop || 0) * 100) : null;
            model.rainChancePct = todayRainChance;

            renderBasicWeatherUI(model);
            latestWeatherSnapshot = {
                cityName: model.cityName || '',
                temperatureC: model.temperatureC ?? null,
                precipTodayPct: model.rainChancePct ?? 0,
                month: (new Date()).getMonth() + 1
            };
            return;
        } catch (e) {}
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=5`;
    const warnUrl = `https://api.open-meteo.com/v1/warnings?latitude=${lat}&longitude=${lon}&timezone=auto&language=en`;
    try {
        const [wxRes, warnRes, cityName] = await Promise.all([
            fetch(url).then(r => r.json()),
            fetch(warnUrl).then(r => r.json()).catch(() => null),
            reverseGeocode(lat, lon)
        ]);
        const current = wxRes.current || {};
        const daily = wxRes.daily || {};
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m != null ? Math.round(current.relative_humidity_2m) : null;
        const wind = current.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : 'N/A';
        const conditionText = decodeWeatherCode(current.weather_code);
        const todayPrecip = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
        const tiles = [
            { icon: '<i class="fa-solid fa-sun"></i>', label: 'Temperature', value: `${temp} °C` },
            { icon: '<i class="fa-solid fa-droplet"></i>', label: 'Humidity', value: humidity != null ? `${humidity}%` : 'N/A' },
            { icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>', label: 'Rain chances', value: `${daily.precipitation_probability_max ? (daily.precipitation_probability_max[0] ?? 0) : 0}%` },
            { icon: '<i class="fa-solid fa-wind"></i>', label: 'Wind Speed', value: wind }
        ];
        const header = `
            <div style="font-size:1.2rem;margin-top:4px;">${conditionText}</div>
            <div style="color:#666;font-size:0.9rem;margin-top:2px;">${locationSource === 'gps' ? 'Using precise GPS' : 'Using approximate IP location'}</div>
        `;
        weatherContainer.innerHTML = header;
        tiles.forEach((t,i) => {
            const el = document.createElement('div');
            const variant = i===0 ? 'variant-temp' : i===1 ? 'variant-humidity' : i===2 ? 'variant-wind' : 'variant-rain';
            el.className = `metric-tile anim ${variant}`;
            el.style.setProperty('--d', i);
            el.innerHTML = `<span class=\"metric-icon-circle\"><span class=\"metric-icon\" style=\"--d:${i}\">${t.icon}</span></span><div class=\"metric-value\">${t.value}</div><div class=\"metric-label\">${t.label}</div>`;
            grid.appendChild(el);
        });
        grid.classList.remove('hidden');
        const place = document.createElement('div');
        place.className = 'weather-place';
        place.textContent = cityName ? `📍 ${cityName}` : '';
        weatherContainer.appendChild(place);
        const weatherCard = document.querySelector('.info-card.weather-info');
        if (weatherCard) {
            weatherCard.classList.add('weather-detected');
            setTimeout(()=>weatherCard.classList.remove('weather-detected'), 1500);
        }
        const alerts = [];
        if (todayPrecip >= 70) alerts.push('⚠️ High chance of rain today. Protect stored grain and plan irrigation.');
        if (temp >= 40) alerts.push('🔥 Heat stress risk. Schedule irrigation early morning/evening.');
        const alertsCard = document.getElementById('alertsCard');
        const existingHeuristics = alertsCard.querySelector('.heuristic-alerts');
        if (existingHeuristics) existingHeuristics.remove();
        if (alerts.length) {
            const heur = document.createElement('div');
            heur.className = 'heuristic-alerts';
            heur.innerHTML = alerts.map(a => `<span class=\"alert-chip\">⚠️ ${a.replace('⚠️ ','')} </span>`).join('');
            alertsCard.appendChild(heur);
        }
    } catch (err) {
        console.error('Weather load failed', err);
        weatherContainer.innerHTML = '<p>Error loading weather data. Please try again.</p>';
    }
}

async function initWeatherOnLoad() {
    try {
        const approx = await getApproxLocationViaIP();
        if (!approx) return;
        userLocation = approx;
        locationSource = 'ip';
        await fetchWeatherData(userLocation);
        await fetchCropRecommendations(userLocation);
    } catch (_) {}
}

async function scrollWeather() {
    const card = document.querySelector('.weather-info');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!userLocation) {
        const approx = await getApproxLocationViaIP();
        if (approx) {
            userLocation = approx;
            locationSource = 'ip';
            await fetchWeatherData(userLocation);
            await fetchCropRecommendations(userLocation);
        }
    }
    closeMenuBar();
}

async function fetchCropRecommendations() {
    const cropRecommendations = document.getElementById('cropRecommendations');
    cropRecommendations.classList.remove('hidden');
    cropRecommendations.innerHTML = '<p>Analyzing local weather and season...</p>';
    const snap = latestWeatherSnapshot || { temperatureC: null, precipTodayPct: null, month: (new Date()).getMonth() + 1 };
    const temp = snap.temperatureC;
    const rain = snap.precipTodayPct;
    const m = snap.month;
    const season = (m >= 6 && m <= 9) ? 'Kharif (Monsoon)' : (m >= 10 && m <= 2 ? 'Rabi (Winter)' : 'Zaid (Summer)');
    const recs = [];
    if (season === 'Kharif (Monsoon)') {
        if ((rain ?? 50) >= 50) recs.push({ name: 'Paddy (Rice)', reason: 'High rain probability suits puddled fields.' });
        recs.push({ name: 'Maize', reason: 'Performs well with moderate rains and warmth.' });
        recs.push({ name: 'Soybean', reason: 'Good for monsoon sowing; nitrogen-fixing benefits.' });
    } else if (season === 'Rabi (Winter)') {
        recs.push({ name: 'Wheat', reason: 'Prefers cool, dry conditions.' });
        recs.push({ name: 'Mustard', reason: 'Thrives in cool season with low humidity.' });
        recs.push({ name: 'Chickpea (Chana)', reason: 'Low water requirement in winter.' });
    } else {
        recs.push({ name: 'Moong (Green gram)', reason: 'Short-duration summer pulse.' });
        recs.push({ name: 'Cucumber/Vegetables', reason: 'Fast-growing summer vegetables.' });
        recs.push({ name: 'Fodder maize', reason: 'Tolerates summer with irrigation.' });
    }
    if (temp != null) {
        if (temp >= 38) recs.unshift({ name: 'Millets (Bajra/Sorghum)', reason: 'High heat tolerance for hot days.' });
        else if (temp <= 10) recs.unshift({ name: 'Barley', reason: 'Handles very low temperatures better than many cereals.' });
    }
    const fertilizers = [
        'Basal: 10-26-26 or DAP during sowing as per soil test',
        'Top-dress: Urea split doses aligned with crop stages',
        'Micronutrients: Zinc/Boron if soil test indicates deficiency'
    ];
    cropRecommendations.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>📅 Season:</strong> ${season}
            ${snap.cityName ? `<div><strong>📍 Area:</strong> ${snap.cityName}</div>` : ''}
        </div>
        <div style="margin-bottom: 0.5rem;"><strong>🌾 Recommended Crops:</strong></div>
        <div>
            ${recs.map((crop,i) => `<span class=\"rec-chip\" style=\"--d:${i}\"><strong>${crop.name}</strong></span>`).join('')}
        </div>
        <div style="margin-top: 1rem;">
            <strong>🧪 Recommended Fertilizers:</strong>
            <ul style="margin-top: 0.5rem;">
                ${fertilizers.map(f => `<li>${f}</li>`).join('')}
            </ul>
        </div>
    `;
}

function openModal() { document.getElementById('loginModal').style.display = 'block'; }
function closeModal() { document.getElementById('loginModal').style.display = 'none'; }
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) modal.style.display = 'none';
}
function changeLanguage(lang) { currentLanguage = lang; loadLanguage(lang); }

function setupForms() {
    document.getElementById('farmerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = { type: 'farmer', name: document.getElementById('farmerName').value, phone: document.getElementById('farmerPhone').value, location: document.getElementById('farmerLocation').value };
        localStorage.setItem('userData', JSON.stringify(formData));
        alert('Registration successful! Redirecting to Farmer Dashboard...');
        closeModal();
        setTimeout(() => { redirectToFarmerDashboard(); }, 1000);
    });
    document.getElementById('helperForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = { type: 'helper', name: document.getElementById('helperName').value, phone: document.getElementById('helperPhone').value, location: document.getElementById('helperLocation').value, helperType: document.getElementById('helperType').value };
        localStorage.setItem('userData', JSON.stringify(formData));
        alert('Registration successful! Redirecting to Helper Dashboard...');
        closeModal();
        setTimeout(() => { redirectToHelperDashboard(); }, 1000);
    });
}

function redirectToFarmerDashboard() {
    const helperSection = document.querySelector('.helper-section');
    helperSection.querySelector('.section-title').textContent = 'Farmer Dashboard';
    const infoGrid = helperSection.querySelector('.info-grid');
    // Remove existing duplicates if present
    const oldContacts = infoGrid.querySelector('#helper-contacts-card');
    const oldRental = infoGrid.querySelector('#rental-equipment-card');
    if (oldContacts) infoGrid.removeChild(oldContacts);
    if (oldRental) infoGrid.removeChild(oldRental);

    const contactsCard = document.createElement('div');
    contactsCard.id = 'helper-contacts-card';
    contactsCard.className = 'info-card';
    contactsCard.style.background = 'linear-gradient(135deg, #fff3e0, #ffe0b2)';
    contactsCard.innerHTML = `
        <div class="card-title">👥 Helper Contacts</div>
        <div style="text-align: left;">
            <h4>Labour Contacts:</h4>
            <p>📞 Ramesh Kumar - 9876543210 (Harvesting)</p>
            <p>📞 Suresh Patel - 9876543211 (Plowing)</p>
            <h4 style="margin-top: 1rem;">Shopkeeper Contacts:</h4>
            <p>🏪 Agro Store - 9876543212 (Seeds & Fertilizers)</p>
            <p>🏪 Farm Supply - 9876543213 (Equipment)</p>
            <h4 style="margin-top: 1rem;">Supplier Contacts:</h4>
            <p>🚚 Green Supply Co. - 9876543214 (Organic Fertilizers)</p>
            <p>🚚 Farm Tech - 9876543215 (Modern Equipment)</p>
        </div>
    `;
    const rentalCard = document.createElement('div');
    rentalCard.id = 'rental-equipment-card';
    rentalCard.className = 'info-card';
    rentalCard.style.background = 'linear-gradient(135deg, #e1f5fe, #b3e5fc)';
    rentalCard.innerHTML = `
        <div class="card-title">🚜 Rental Equipment</div>
        <div style="text-align: left;">
            <p><strong>Available Now:</strong></p>
            <p>🚜 Tractor - ₹800/day</p>
            <p>🌾 Harvester - ₹1200/day</p>
            <p>💧 Water Pump - ₹300/day</p>
            <p>🌱 Seed Drill - ₹500/day</p>
            <button style="margin-top: 1rem; background: #2196f3; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Book Equipment</button>
        </div>
    `;
    infoGrid.appendChild(contactsCard);
    infoGrid.appendChild(rentalCard);
    alert('Welcome to your Farmer Dashboard! You can now see helper contacts and rental equipment.');
}

function redirectToHelperDashboard() {
    const infoGrid = document.querySelector('.helper-section .info-grid');
    // Remove by id to avoid duplicate blocks
    const oldContacts = infoGrid.querySelector('#helper-contacts-card');
    const oldRental = infoGrid.querySelector('#rental-equipment-card');
    if (oldContacts) infoGrid.removeChild(oldContacts);
    if (oldRental) infoGrid.removeChild(oldRental);
    const slides = document.querySelectorAll('.slide');
    slides[0].style.backgroundImage = "url('https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')";
    slides[0].querySelector('.slide-title').textContent = 'Modern Farm Equipment';
    slides[0].querySelector('p').textContent = 'High-quality machinery for efficient farming';
    slides[1].style.backgroundImage = "url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')";
    slides[1].querySelector('.slide-title').textContent = 'Premium Fertilizers';
    slides[1].querySelector('.slide-overlay p').textContent = 'Organic and chemical fertilizers for all crops';
    slides[2].style.backgroundImage = "url('https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80')";
    slides[2].querySelector('.slide-title').textContent = 'Agricultural Tools';
    slides[2].querySelector('.slide-overlay p').textContent = 'Complete range of farming tools and equipment';
    const helperSection = document.querySelector('.helper-section');
    helperSection.querySelector('.section-title').textContent = 'Helper Dashboard';
    const farmingMethods = document.getElementById('farmingMethods');
    farmingMethods.innerHTML = `
        <h4>🧪 Modern Fertilizer Knowledge:</h4>
        <ul>
            <li><strong>NPK Fertilizers:</strong> Balanced nutrition for all crops</li>
            <li><strong>Organic Compost:</strong> Eco-friendly soil enrichment</li>
            <li><strong>Micronutrients:</strong> Zinc, Iron, Manganese supplements</li>
            <li><strong>Bio-fertilizers:</strong> Beneficial microorganism cultures</li>
        </ul>
        <h4 style="margin-top: 1rem;">🔧 Service Areas:</h4>
        <p>Ready to provide services in: Equipment rental, Fertilizer supply, Labor assistance, Technical consultation</p>
    `;
    alert('Welcome to your Helper Dashboard! Your services are now visible to farmers in your area.');
}

setInterval(() => { if (currentLanguage === 'en') updateTicker(); }, 30000);
function simulateNewsUpdates() {
    const additionalNews = [
        "🌡️ Temperature alert: Heat wave warning issued for central states",
        "💰 New market prices: Onion rates increase by 15%",
        "🏭 Agricultural processing units to get special loans",
        "🌍 Climate-smart agriculture practices workshop announced",
        "📊 Digital crop monitoring system trials begin in Punjab",
    ];
    const randomNews = additionalNews[Math.floor(Math.random() * additionalNews.length)];
    const currentTicker = document.getElementById('newsTicker').textContent;
    document.getElementById('newsTicker').textContent = randomNews + ' • ' + currentTicker;
}
setInterval(simulateNewsUpdates, 120000);

(function enableSchemesDrag(){
    const container = document.querySelector('.schemes-slider-container');
    if (!container) return;
    let isDown = false; let startX = 0; let scrollLeft = 0;
    container.addEventListener('mousedown', (e)=>{ isDown = true; startX = e.pageX - container.offsetLeft; scrollLeft = container.scrollLeft; container.style.cursor='grabbing'; });
    container.addEventListener('mouseleave', ()=>{ isDown = false; container.style.cursor='grab'; });
    container.addEventListener('mouseup', ()=>{ isDown = false; container.style.cursor='grab'; });
    container.addEventListener('mousemove', (e)=>{ if(!isDown) return; e.preventDefault(); const x = e.pageX - container.offsetLeft; const walk = (x - startX) * 1.2; container.scrollLeft = scrollLeft - walk; });
    let touchStartX = 0; let touchStartScroll = 0;
    container.addEventListener('touchstart',(e)=>{ touchStartX = e.touches[0].pageX; touchStartScroll = container.scrollLeft; });
    container.addEventListener('touchmove',(e)=>{ const x = e.touches[0].pageX; const walk = (x - touchStartX) * 1.2; container.scrollLeft = touchStartScroll - walk; });
})();

function openChatBox() {
    const chat = document.getElementById('chat-box');
    const launcher = document.getElementById('chat-launcher');
    if (launcher) launcher.style.display = 'none';
    // Defer showing to avoid the original tap triggering close on newly shown UI
    setTimeout(() => {
        if (chat) {
            chat.style.display = 'flex';
            chat.style.flexDirection = 'column';
            chat.style.zIndex = '10001';
        }
    }, 0);
}
function closeChatBox() {
    document.getElementById('chat-box').style.display = 'none';
    const launcher = document.getElementById('chat-launcher');
    if (launcher) launcher.style.display = 'flex';
}
function openFeedback() { document.getElementById('feedbackModal').style.display = 'block'; }
function closeFeedback() { document.getElementById('feedbackModal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => {
    const fbForm = document.getElementById('feedbackForm');
    if (fbForm) {
        fbForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { name: document.getElementById('fbName').value, phone: document.getElementById('fbPhone').value, message: document.getElementById('fbMessage').value };
            try {
                await fetch('https://your-backend-url.com/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                alert('Thanks for your feedback!');
                closeFeedback();
                fbForm.reset();
            } catch (_) {
                alert('Could not send feedback right now. Please try later.');
            }
        });
    }
});

async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg && !pendingAttachment) return;
    if (msg) addChatMessage('You', msg);
    input.value = '';
    try {
        let responseText = '';
        if (pendingAttachment) {
            const mediaRes = await fetch('https://your-backend-url.com/chat/upload', { method: 'POST', body: JSON.stringify({ file: pendingAttachment }), headers: { 'Content-Type': 'application/json' } });
            const mediaData = await mediaRes.json();
            responseText = mediaData.answer || 'Received your media.';
            pendingAttachment = null;
        } else {
            const res = await fetch('https://your-backend-url.com/chat?q=' + encodeURIComponent(msg) + '&lang=' + encodeURIComponent(currentLanguage));
            const data = await res.json();
            responseText = data.answer || 'Sorry, no info found.';
        }
        addChatMessage('Bot', responseText);
        speakAnswer(responseText, currentLanguage);
    } catch (e) {
        addChatMessage('Bot', 'Error fetching info.');
        speakAnswer('Error fetching info.', currentLanguage);
    }
}

function speakAnswer(text, lang='en') {
    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        const map = { en:'en-IN', hi:'hi-IN', pa:'pa-IN', te:'te-IN', ta:'ta-IN' };
        utter.lang = map[lang] || 'en-IN';
        window.speechSynthesis.speak(utter);
    }
}

// single declaration for attachment holder
// removed duplicate declaration (keep only the first one)
// let pendingAttachment = null;
function attachFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        pendingAttachment = reader.result; // base64
        addChatMessage('You', `[Attached ${file.type.startsWith('video') ? 'video' : 'image'}]`);
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function startMic() {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice recognition not supported!'); return; }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        let name = transcript.match(/name is (\w+)/i);
        let phone = transcript.match(/phone (number )?is (\d{10})/i);
        let work = transcript.match(/work (is|as) (\w+)/i);
        if (name && phone && work) {
            localStorage.setItem('micUserData', JSON.stringify({ name: name[1], phone: phone[2], work: work[2] }));
            alert(`Mic Registration Saved!\nName: ${name[1]}\nPhone: ${phone[2]}\nWork: ${work[2]}`);
            fetch('https://api.example.com/register', { method: 'POST', body: JSON.stringify({ name: name[1], phone: phone[2], work: work[2] }), headers: { 'Content-Type': 'application/json' } });
        } else {
            alert('Please say your name, phone number, and work clearly.');
        }
    };
    recognition.start();
}

function startChatMic() {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice recognition not supported!'); return; }
    const recognition = new webkitSpeechRecognition();
    const map = { en:'en-IN', hi:'hi-IN', pa:'pa-IN', te:'te-IN', ta:'ta-IN' };
    recognition.lang = map[currentLanguage] || 'en-IN';
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chat-input').value = transcript;
        sendChat();
    };
    recognition.start();
}

function openCamera() {
    document.getElementById('camera-modal').style.display = 'flex';
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        document.getElementById('camera-stream').srcObject = stream;
    });
}
function closeCamera() {
    document.getElementById('camera-modal').style.display = 'none';
    let video = document.getElementById('camera-stream');
    if (video.srcObject) { video.srcObject.getTracks().forEach(track => track.stop()); video.srcObject = null; }
}
async function sendPestDetection(imgData) {
    const apiUrl = 'https://your-backend-url.com/api/pest-detection';
    addChatMessage('You', '[Photo sent]');
    try {
        const res = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ image: imgData }), headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        addChatMessage('Bot', data.result || 'No info found.');
    } catch (err) {
        addChatMessage('Bot', 'Error analyzing photo.');
    }
}
function takePhoto() {
    let video = document.getElementById('camera-stream');
    let canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    let imgData = canvas.toDataURL('image/png');
    closeCamera();
    sendPestDetection(imgData);
}

// remove earlier duplicate implementation if any; keep this one
function openMenuBar() {
    document.getElementById('menu-bar').style.display = 'flex';
    document.getElementById('menu-features').innerHTML = `
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🏠 Home</button>
        <button onclick=\"scrollWeather()\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🌤️ Weather</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">⚠️ Alerts</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🧠 Recommendations</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">✨ Features</button>
        <button onclick=\"alert('Advisory feature coming soon!')\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🎯 Advisory</button>
        <button onclick=\"alert('Helpers section coming soon!')\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">👥 Helpers</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🏛️ Schemes</button>
        <button onclick=\"alert('Market Price feature coming soon!')\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">💰 Market Price</button>
        <button onclick=\"openChatBox()\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🤖 Chatbot</button>
        <button onclick=\"alert('IoT Tutorial feature coming soon!')\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">📡 IoT Tutorial</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">📞 Contact</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">ℹ️ About</button>
        <button onclick=\"location.href='#'\" style=\"width:100%;margin-bottom:8px;padding:10px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-size:14px;text-align:left;\">🔒 Privacy Policy</button>
    `;
    let user = localStorage.getItem('userData');
    if (user) {
        user = JSON.parse(user);
        document.getElementById('menu-user').innerHTML = `
            <div style=\"color:#666;margin-bottom:6px;\">Signed in</div>
            <div><b>Name:</b> ${user.name || ''}</div>
            <div><b>Phone:</b> ${user.phone || ''}</div>
            ${user.work ? `<div><b>Work:</b> ${user.work}</div>` : ''}
            <button onclick=\"logout()\" style=\"width:100%;margin-top:12px;background:#ff6b35;color:#fff;border:none;border-radius:8px;padding:8px 0;font-size:14px;\">Logout</button>
        `;
    } else {
        document.getElementById('menu-user').innerHTML = `
            <div style=\"color:#666;margin-bottom:6px;\">Welcome</div>
            <button onclick=\"openModal()\" style=\"width:100%;background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px 0;font-size:14px;\">Sign In / Sign Up</button>
        `;
    }
}
function closeMenuBar() { document.getElementById('menu-bar').style.display = 'none'; }
window.addEventListener('click', function(e) { if (e.target === document.getElementById('menu-bar')) document.getElementById('menu-bar').style.display = 'none'; });
function logout() { localStorage.removeItem('userData'); document.getElementById('menu-bar').style.display = 'none'; alert('Logged out!'); }

function micRegister() {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice recognition not supported!'); return; }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        let name = transcript.match(/name is (\w+)/i);
        let phone = transcript.match(/phone (number )?is (\d{10})/i);
        let work = transcript.match(/work (is|as) (\w+)/i);
        if (name && phone && work) {
            document.getElementById('farmerName').value = name[1];
            document.getElementById('farmerPhone').value = phone[2];
            document.getElementById('farmerLocation').value = work[2];
            openModal();
            setTimeout(() => { document.getElementById('farmerForm').dispatchEvent(new Event('submit', {cancelable: true, bubbles: true})); }, 500);
        } else {
            alert('Please say your name, phone number, and work clearly.');
        }
    };
    recognition.start();
}

async function loadLanguage(lang) {
    try {
        const res = await fetch(`https://your-backend-url.com/i18n/${lang}.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error('lang fetch failed');
        translations = await res.json();
    } catch (e) {
        // fallback minimal strings
        const fallbacks = {
            en: { login:'Login', detectLocation:'📍 Detect My Location', weatherTitle:'Weather In Your Area', alertsTitle:'⚠️ Alerts', recTitle:'Recommendations', schemesTitle:'Government Schemes & Policies', featuresTitle:'Our Features', news:'Farming updates' },
            hi: { login:'लॉगिन', detectLocation:'📍 मेरा स्थान खोजें', weatherTitle:'आपके क्षेत्र का मौसम', alertsTitle:'⚠️ अलर्ट', recTitle:'सिफ़ारिशें', schemesTitle:'सरकारी योजनाएँ', featuresTitle:'हमारी विशेषताएँ', news:'खेती से जुड़ी खबरें' }
        };
        translations = fallbacks[lang] || fallbacks.en;
    }
    applyTranslations();
}

function t(key, def='') { return (translations && translations[key]) || def || key; }

function applyTranslations() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.textContent = t('login','Login');
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) detectBtn.textContent = t('detectLocation','📍 Detect My Location');
    const weatherTitle = document.getElementById('weatherTitle');
    if (weatherTitle) weatherTitle.textContent = t('weatherTitle','Weather In Your Area');
    const alertsTitle = document.getElementById('alertsTitle');
    if (alertsTitle) alertsTitle.textContent = t('alertsTitle','⚠️ Alerts');
    const recTitle = document.getElementById('recTitle');
    if (recTitle) recTitle.textContent = t('recTitle','Recommendations');
    const schemesTitle = document.getElementById('schemesTitle');
    if (schemesTitle) schemesTitle.textContent = t('schemesTitle','Government Schemes & Policies');
    const featuresTitle = document.getElementById('featuresTitle');
    if (featuresTitle) featuresTitle.textContent = t('featuresTitle','Our Features');
    const ticker = document.getElementById('newsTicker');
    if (ticker) ticker.textContent = t('news', ticker.textContent);
}

// Initialize website
document.addEventListener('DOMContentLoaded', function() {
    startSlideshow();
    updateTicker();
    setupForms();
    loadLanguage(currentLanguage);
    setupChatLauncher();
    initWeatherOnLoad();
});

// Slideshow functionality
function startSlideshow() {
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

// News ticker functionality
function fetchNews() {
    // Simulating real farming news API
    const farmingNews = [
        "🌾 Breaking: New subsidies announced for organic farming",
        "🚜 Modern farming techniques increase crop yield by 40%",
        "💧 Drip irrigation schemes launched in 5 states",
        "🌱 Weather alert: Heavy rains expected in North India next week",
        "📈 Market prices for wheat touch new highs",
        "🏛️ Government launches digital farming portal for farmers",
        "🌿 Sustainable agriculture practices showing promising results",
        "📱 New mobile app for crop disease identification launched",
    ];
    return farmingNews.join(' • ');
}

function updateTicker() {
    const ticker = document.getElementById('newsTicker');
    ticker.textContent = fetchNews();
}

function setupChatLauncher() {
    const launcher = document.getElementById('chat-launcher');
    const defaultBtn = document.getElementById('chat-float-btn');
    if (defaultBtn) defaultBtn.style.display = 'none';
    if (launcher) {
        launcher.addEventListener('click', openChatBox);
        const bubble = launcher.querySelector('.speech-bubble');
        if (bubble) setTimeout(() => { bubble.style.display = 'none'; }, 5000);
    }
}

// Location detection
async function detectLocation() {
    const btn = document.querySelector('.detect-location-btn');
    btn.textContent = '🔄 Detecting Location...';
    btn.disabled = true;
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    };
                    locationSource = 'gps';
                    btn.textContent = '✅ Location Detected!';
                    // Fetch weather and crop data
                    await fetchWeatherData(userLocation);
                    await fetchCropRecommendations(userLocation);
                    setTimeout(() => {
                        btn.textContent = '📍 Detect My Location';
                        btn.disabled = false;
                    }, 2000);
                },
                async (error) => {
                    // Fallback to IP-based approximate location
                    const approx = await getApproxLocationViaIP();
                    if (approx) {
                        userLocation = approx;
                        locationSource = 'ip';
                        btn.textContent = '✅ Approx Location Detected';
                        await fetchWeatherData(userLocation);
                        await fetchCropRecommendations(userLocation);
                    } else {
                    btn.textContent = '❌ Location Access Denied';
                    }
                    setTimeout(() => {
                        btn.textContent = '📍 Detect My Location';
                        btn.disabled = false;
                    }, 2000);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            // No geolocation; use IP fallback
            const approx = await getApproxLocationViaIP();
            if (!approx) throw new Error('Geolocation not supported');
            userLocation = approx;
            locationSource = 'ip';
            await fetchWeatherData(userLocation);
            await fetchCropRecommendations(userLocation);
            btn.textContent = '✅ Approx Location Detected';
            setTimeout(() => { btn.textContent = '📍 Detect My Location'; btn.disabled = false; }, 2000);
        }
    } catch (error) {
        btn.textContent = '❌ Error Detecting Location';
        setTimeout(() => {
            btn.textContent = '📍 Detect My Location';
            btn.disabled = false;
        }, 2000);
    }
}

async function getApproxLocationViaIP() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) return null;
        const d = await res.json();
        if (d && d.latitude && d.longitude) {
            return { lat: d.latitude, lon: d.longitude };
        }
    } catch (_) {}
    return null;
}

// --- Open-Meteo integration (no API key) ---

 // Optional custom provider hook. If set, we will use this instead of Open-Meteo.
 // Example to set from your script (uncomment and replace API_KEY):
 window.CUSTOM_WEATHER = {
     buildUrl: (lat, lon) => `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=f63434267eaeefb3ba598f95276a07da`,
     map: (raw) => ({
         cityName: raw.name,
         temperatureC: Math.round(raw.main?.temp),
         humidityPct: raw.main?.humidity ?? null,
         windKmh: raw.wind?.speed != null ? Math.round(raw.wind.speed * 3.6) : null,
         rainChancePct: null,
        conditionText: (raw.weather && raw.weather[0] && raw.weather[0].description) ? raw.weather[0].description : 'Weather',
        alerts: []
     })
 };

// Renders a simple weather UI block compatible with our cards
function renderBasicWeatherUI(model) {
    const weatherContainer = document.getElementById('weatherData');
const grid = document.getElementById('weatherGrid');
    grid.classList.add('hidden');
    grid.innerHTML = '';

    const tiles = [];
    if (model.temperatureC != null) tiles.push({ icon: '<i class="fa-solid fa-sun"></i>', label: 'Temperature', value: `${model.temperatureC} °C` });
    if (model.humidityPct != null) tiles.push({ icon: '<i class="fa-solid fa-droplet"></i>', label: 'Humidity', value: `${model.humidityPct}%` });
    if (model.windKmh != null) tiles.push({ icon: '<i class="fa-solid fa-wind"></i>', label: 'Wind Speed', value: `${model.windKmh} km/h` });
    if (model.rainChancePct != null) tiles.push({ icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>', label: 'Rain chances', value: `${model.rainChancePct}%` });

    const sourceNoteHtml = model.sourceNote ? '<div style="color:#666;font-size:0.9rem;margin-top:2px;">' + model.sourceNote + '</div>' : '';
    const header = `
        <div style="font-size:1.1rem;color:#2d5a2d;margin-bottom:4px;">${model.cityName ? '📍 ' + model.cityName : ''}</div>
        <div style="font-size:1.2rem;margin-top:4px;">${model.conditionText || ''}</div>
        ${sourceNoteHtml}
    `;
    weatherContainer.innerHTML = header;
    tiles.forEach(t => {
        const el = document.createElement('div');
        el.className = 'metric-tile';
        el.innerHTML = `<div style=\"font-size:1.6rem;\">${t.icon}</div><div class=\"metric-value\">${t.value}</div><div class=\"metric-label\">${t.label}</div>`;
        grid.appendChild(el);
    });
    grid.classList.remove('hidden');

    // Optional alerts from provider
    if (Array.isArray(model.alerts) && model.alerts.length) {
        const alertsCard = document.getElementById('alertsCard');
        const existingHeuristics = alertsCard.querySelector('.heuristic-alerts');
        if (existingHeuristics) existingHeuristics.remove();
        const heur = document.createElement('div');
        heur.className = 'heuristic-alerts';
        heur.innerHTML = `<div style=\"border-left:4px solid #2e7d32;background:#e8f5e9;padding:8px 12px;border-radius:6px;margin:6px 0;\">${model.alerts.join('<br>')}</div>`;
        alertsCard.appendChild(heur);
    }
}

// removed duplicate declaration (keep only the first one)
// let latestWeatherSnapshot = null; // used for crop recommendations

function decodeWeatherCode(code) {
    const map = {
        0: 'Clear sky ☀️', 1: 'Mainly clear 🌤️', 2: 'Partly cloudy ⛅', 3: 'Overcast ☁️',
        45: 'Fog 🌫️', 48: 'Depositing rime fog 🌫️',
        51: 'Light drizzle 🌦️', 53: 'Moderate drizzle 🌦️', 55: 'Dense drizzle 🌧️',
        56: 'Light freezing drizzle 🥶🌦️', 57: 'Dense freezing drizzle 🥶🌧️',
        61: 'Slight rain 🌦️', 63: 'Moderate rain 🌧️', 65: 'Heavy rain ⛈️',
        66: 'Light freezing rain 🥶🌧️', 67: 'Heavy freezing rain 🥶⛈️',
        71: 'Slight snow 🌨️', 73: 'Moderate snow 🌨️', 75: 'Heavy snow ❄️',
        77: 'Snow grains 🌨️',
        80: 'Rain showers 🌦️', 81: 'Moderate rain showers 🌧️', 82: 'Violent rain showers ⛈️',
        85: 'Snow showers 🌨️', 86: 'Heavy snow showers ❄️',
        95: 'Thunderstorm ⛈️', 96: 'Thunderstorm with hail ⛈️', 99: 'Thunderstorm with heavy hail ⛈️'
    };
    return map[code] || `Code ${code}`;
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`);
        const data = await res.json();
        if (data && data.results && data.results.length) {
            const r = data.results[0];
            const parts = [r.name, r.admin1, r.country].filter(Boolean);
            return parts.join(', ');
        }
    } catch (e) {}
    return '';
}

async function autofillLocation(inputId) {
    try {
        if (!navigator.geolocation) throw new Error('Geolocation not supported');
        const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        );
        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
        const place = await reverseGeocode(lat, lon);
        const input = document.getElementById(inputId);
        if (input) input.value = place || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (err) {
        alert('Unable to detect location. Please enter manually.');
    }
}

async function fetchWeatherData(location) {
    const lat = location.lat;
    const lon = location.lon;
    const weatherContainer = document.getElementById('weatherData');
    const grid = document.getElementById('weatherGrid');
    weatherContainer.innerHTML = '<p>Loading real-time weather...</p>';
    grid.classList.add('hidden');
    grid.innerHTML = '';

    // If custom provider is present, use it and return
    if (window.CUSTOM_WEATHER && typeof window.CUSTOM_WEATHER.buildUrl === 'function') {
        try {
            const reqUrl = window.CUSTOM_WEATHER.buildUrl(lat, lon);
            const raw = await fetch(reqUrl).then(r => r.json());
            const map = typeof window.CUSTOM_WEATHER.map === 'function' ? window.CUSTOM_WEATHER.map : (d)=>d;
            const model = map(raw) || {};
            model.sourceNote = locationSource === 'gps' ? 'Using precise GPS' : (locationSource === 'ip' ? 'Using approximate IP location' : '');
            renderBasicWeatherUI(model);
            latestWeatherSnapshot = {
                cityName: model.cityName || '',
                temperatureC: model.temperatureC ?? null,
                precipTodayPct: model.rainChancePct ?? 0,
                month: (new Date()).getMonth() + 1
            };
            return;
        } catch (e) {
            // Fallback to Open-Meteo below
        }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=5`;
    const warnUrl = `https://api.open-meteo.com/v1/warnings?latitude=${lat}&longitude=${lon}&timezone=auto&language=en`;

    try {
        const [wxRes, warnRes, cityName] = await Promise.all([
            fetch(url).then(r => r.json()),
            fetch(warnUrl).then(r => r.json()).catch(() => null),
            reverseGeocode(lat, lon)
        ]);

        const current = wxRes.current || {};
        const daily = wxRes.daily || {};

        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m != null ? Math.round(current.relative_humidity_2m) : null;
        const wind = current.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : 'N/A';
        const conditionText = decodeWeatherCode(current.weather_code);

        // alerts (simple heuristics)
        const todayPrecip = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
        const alerts = [];
        if (todayPrecip >= 70) alerts.push('⚠️ High chance of rain today. Protect stored grain and plan irrigation.');
        if (temp >= 40) alerts.push('🔥 Heat stress risk. Schedule irrigation early morning/evening.');

        // Build metric tiles (Temp, Humidity, Wind, Rain chance)
        const rainChanceToday = daily.precipitation_probability_max ? (daily.precipitation_probability_max[0] ?? 0) : 0;
        
        grid.innerHTML = '';
        const tiles = [
            { icon: '<i class="fa-solid fa-sun"></i>', label: 'Temperature', value: `${temp} °C` },
            { icon: '<i class="fa-solid fa-droplet"></i>', label: 'Humidity', value: humidity != null ? `${humidity}%` : 'N/A' },
            { icon: '<i class="fa-solid fa-wind"></i>', label: 'Wind Speed', value: wind },
            { icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>', label: 'Rain chances', value: `${rainChanceToday}%` },
        ];

        const sourceNoteHtml2 = locationSource ? '<div style="color:#666;font-size:0.9rem;margin-top:2px;">' + (locationSource === 'gps' ? 'Using precise GPS' : 'Using approximate IP location') + '</div>' : '';
        const header = `
            <div style="font-size:1.1rem;color:#2d5a2d;margin-bottom:4px;">${cityName ? '📍 ' + cityName : ''}</div>
            <div style="font-size:1.2rem;margin-top:4px;">${conditionText}</div>
            ${sourceNoteHtml2}
        `;
        weatherContainer.innerHTML = header;
        tiles.forEach((t,i) => {
            const el = document.createElement('div');
            const variant = i===0 ? 'variant-temp' : i===1 ? 'variant-humidity' : i===2 ? 'variant-wind' : 'variant-rain';
            el.className = `metric-tile ${variant}`;
            el.innerHTML = `<div class=\"metric-icon\" style=\"--d:${i}\">${t.icon}</div><div class=\"metric-value\">${t.value}</div><div class=\"metric-label\">${t.label}</div>`;
            grid.appendChild(el);
        });
        grid.classList.remove('hidden');
        if (window.anime) {
            anime({ targets: '#weatherGrid .metric-tile', translateY: [16, 0], opacity: [0, 1], scale: [0.96, 1], duration: 650, easing: 'cubicBezier(.2,.8,.2,1)', delay: anime.stagger(80) });
            anime({ targets: '#weatherGrid .metric-icon', rotate: [ -12, 0 ], duration: 700, easing: 'spring(1, 70, 10, 0)', delay: anime.stagger(120) });
        }

        // Also show simple heuristic alerts above tiles (in alertsCard)
        const alertsCard = document.getElementById('alertsCard');
        // clear previous heuristic alerts
        const existingHeuristics = alertsCard.querySelector('.heuristic-alerts');
        if (existingHeuristics) existingHeuristics.remove();
        if (alerts.length) {
            const heur = document.createElement('div');
            heur.className = 'heuristic-alerts';
            heur.innerHTML = `<div style=\"border-left:4px solid #2e7d32;background:#e8f5e9;padding:8px 12px;border-radius:6px;margin:6px 0;\">${alerts.join('<br>')}</div>`;
            alertsCard.appendChild(heur);
        }

        // Official weather alerts (if available)
        try {
            const warnings = warnRes && warnRes.warnings ? warnRes.warnings : [];
            const officialBox = document.getElementById('officialAlerts');
            if (officialBox) {
                if (warnings.length) {
                    const items = warnings.map(w => {
                        const title = w.event || w.title || 'Weather alert';
                        const sev = w.severity ? ` - ${w.severity}` : '';
                        const desc = w.description || '';
                        const start = w.start ? new Date(w.start).toLocaleString() : '';
                        const end = w.end ? new Date(w.end).toLocaleString() : '';
                        const time = start || end ? `<div style=\"color:#555;\"><small>${start}${end ? ' - ' + end : ''}</small></div>` : '';
                        return `
                            <div style=\"border-left:4px solid #c62828;background:#ffebee;padding:8px 12px;border-radius:6px;margin:6px 0;\">
                                <div style=\"font-weight:bold;color:#b71c1c;\">🚨 ${title}${sev}</div>
                                ${desc ? `<div style=\"color:#6b0000;\">${desc}</div>` : ''}
                                ${time}
            </div>
                        `;
                    }).join('');
                    officialBox.innerHTML = items;
                } else {
                    officialBox.innerHTML = '<p>No official alerts.</p>';
                }
            }
        } catch (_) {}

        // five-day mini forecast
        // If using OpenWeather provider, fetch One Call daily forecast for 5 days
        try {
            if (window.CUSTOM_WEATHER && typeof window.CUSTOM_WEATHER.buildUrl === 'function') {
                const owmKeyMatch = (window.CUSTOM_WEATHER.buildUrl(0,0) || '').match(/appid=([^&]+)/);
                const owmKey = owmKeyMatch ? owmKeyMatch[1] : null;
                if (owmKey) {
                    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${owmKey}`;
                    const dailyRes = await fetch(oneCallUrl).then(r => r.json());
                    const days = (dailyRes && dailyRes.daily) ? dailyRes.daily.slice(0,5) : [];
                    for (const day of days) {
                        const d = new Date(day.dt * 1000);
                        const label = d.toLocaleDateString(undefined, { weekday: 'short' });
                        const icon = day.weather && day.weather[0] && day.weather[0].icon ? day.weather[0].icon : null;
                        const desc = day.weather && day.weather[0] && day.weather[0].description ? day.weather[0].description : '';
                        const card = document.createElement('div');
                        card.className = 'day-weather';
                        card.innerHTML = `
                            <div style="font-weight:bold;">${label}</div>
                            ${icon ? `<img alt="" src="https://openweathermap.org/img/wn/${icon}.png" style="width:42px;height:42px;"/>` : ''}
                            <div style="font-size:0.95rem;margin:4px 0;">${desc}</div>
                            <div>🌡️ ${Math.round(day.temp?.min)}° / ${Math.round(day.temp?.max)}°C</div>
                            <div>🌧️ ${Math.round((day.pop || 0) * 100)}%</div>
                        `;
                        grid.appendChild(card);
                    }
                    grid.classList.remove('hidden');
                }
            }
        } catch (_) {
            // ignore forecast errors
        }

        // store snapshot for crop recommendations
        const month = (new Date()).getMonth() + 1; // 1-12
        latestWeatherSnapshot = {
            cityName,
            temperatureC: temp,
            precipTodayPct: todayPrecip || 0,
            month
        };
    } catch (err) {
        console.error('Weather load failed', err);
        weatherContainer.innerHTML = '<p>Error loading weather data. Please try again.</p>';
    }
}

// Auto-load approximate weather on first visit using IP (no permission needed)
async function initWeatherOnLoad() {
    try {
        const approx = await getApproxLocationViaIP();
        if (!approx) return;
        userLocation = approx;
        locationSource = 'ip';
        await fetchWeatherData(userLocation);
        await fetchCropRecommendations(userLocation);
    } catch (_) {}
}

// Menu helper: jump to weather and ensure data present
async function scrollWeather() {
    const card = document.querySelector('.weather-info');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!userLocation) {
        const approx = await getApproxLocationViaIP();
        if (approx) {
            userLocation = approx;
            locationSource = 'ip';
            await fetchWeatherData(userLocation);
            await fetchCropRecommendations(userLocation);
        }
    }
    closeMenuBar();
}

// Crop recommendations (local logic using latestWeatherSnapshot)
async function fetchCropRecommendations(location) {
    const cropRecommendations = document.getElementById('cropRecommendations');
    cropRecommendations.classList.remove('hidden');
    cropRecommendations.innerHTML = '<p>Analyzing local weather and season...</p>';

    // Ensure we have weather snapshot
    const snap = latestWeatherSnapshot || { temperatureC: null, precipTodayPct: null, month: (new Date()).getMonth() + 1 };

    const temp = snap.temperatureC;
    const rain = snap.precipTodayPct;
    const m = snap.month; // 1-12

    // Very simple seasonal grouping for India-like climate
    const season = (m >= 6 && m <= 9) ? 'Kharif (Monsoon)' : (m >= 10 && m <= 2 ? 'Rabi (Winter)' : 'Zaid (Summer)');

    // Heuristic rules
    const recs = [];
    if (season === 'Kharif (Monsoon)') {
        if ((rain ?? 0) >= 50) recs.push({ name: 'Paddy (Rice)', reason: 'High rain probability suits puddled fields.' });
        recs.push({ name: 'Maize', reason: 'Performs well with moderate rains and warmth.' });
        recs.push({ name: 'Soybean', reason: 'Good for monsoon sowing; nitrogen-fixing benefits.' });
    } else if (season === 'Rabi (Winter)') {
        recs.push({ name: 'Wheat', reason: 'Prefers cool, dry conditions.' });
        recs.push({ name: 'Mustard', reason: 'Thrives in cool season with low humidity.' });
        recs.push({ name: 'Chickpea (Chana)', reason: 'Low water requirement in winter.' });
    } else {
        recs.push({ name: 'Moong (Green gram)', reason: 'Short-duration summer pulse.' });
        recs.push({ name: 'Cucumber/Vegetables', reason: 'Fast-growing summer vegetables.' });
        recs.push({ name: 'Fodder maize', reason: 'Tolerates summer with irrigation.' });
    }

    // Temperature adjustment
    if (temp != null) {
        if (temp >= 38) {
            recs.unshift({ name: 'Millets (Bajra/Sorghum)', reason: 'High heat tolerance for hot days.' });
        } else if (temp <= 10) {
            recs.unshift({ name: 'Barley', reason: 'Handles very low temperatures better than many cereals.' });
        }
    }

    const fertilizers = [
        'Basal: 10-26-26 or DAP during sowing as per soil test',
        'Top-dress: Urea split doses aligned with crop stages',
        'Micronutrients: Zinc/Boron if soil test indicates deficiency'
    ];

        cropRecommendations.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>📅 Season:</strong> ${season}
            ${snap.cityName ? `<div><strong>📍 Area:</strong> ${snap.cityName}</div>` : ''}
        </div>
            <div style="margin-bottom: 1rem;">
                <strong>🌾 Recommended Crops for Your Area:</strong>
            ${recs.map(crop => `
                <div style=\"margin: 0.5rem 0; padding: 0.5rem; background: rgba(76, 175, 80, 0.1); border-radius: 5px;\">
                    <strong>${crop.name}</strong><br>
                        <small>${crop.reason}</small>
                    </div>
                `).join('')}
            </div>
            <div>
                <strong>🧪 Recommended Fertilizers:</strong>
                <ul style="margin-top: 0.5rem;">
                ${fertilizers.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        `;
}

async function showWeatherWithLocation() {
    const weatherDiv = document.getElementById('weatherData');
    weatherDiv.innerHTML = 'Detecting location & loading weather...';

    // Get user location (GPS or fallback to IP)
    let lat, lon, city = '';
    if (navigator.geolocation) {
        await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                    resolve();
                },
                async () => {
                    // Fallback to IP
                    try {
                        const ipRes = await fetch('https://ipapi.co/json/');
                        const ipData = await ipRes.json();
                        lat = ipData.latitude;
                        lon = ipData.longitude;
                    } catch (_) {}
                    resolve();
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    } else {
        // Only IP fallback
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        lat = ipData.latitude;
        lon = ipData.longitude;
    }

    // Fetch weather from OpenWeatherMap
    const apiKey = 'f63434267eaeefb3ba598f95276a07da';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        city = data.name || '';
        const temp = data.main?.temp != null ? Math.round(data.main.temp) : 'N/A';
        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        weatherDiv.innerHTML = `
            <div style="font-size:1.1rem;color:#2d5a2d;margin-bottom:4px;">📍 ${city}</div>
            <div style="font-size:1.2rem;margin-top:4px;">🌡️ Temperature: <b>${temp}°C</b></div>
            <div style="font-size:1rem;margin-top:4px;">🕒 Time: ${timeStr}</div>
        `;
    } catch (err) {
        weatherDiv.innerHTML = '<p>Error loading weather data.</p>';
    }
}

// Call this function on page load or button click
showWeatherWithLocation();


