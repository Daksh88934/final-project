// Weather API helpers (no module; attach to window)
(function(){
    async function reverseGeocode(lat, lon) {
        try {
            const res = await fetch('https://geocoding-api.open-meteo.com/v1/reverse?latitude='+lat+'&longitude='+lon+'&language=en&format=json');
            const data = await res.json();
            if (data && data.results && data.results.length) {
                const r = data.results[0];
                const parts = [r.name, r.admin1, r.country].filter(Boolean);
                return parts.join(', ');
            }
        } catch (_) {}
        return '';
    }

    async function fetchOpenMeteo(lat, lon) {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=precipitation_probability_max&timezone=auto&forecast_days=1';
        const wxRes = await fetch(url).then(r=>r.json());
        const current = wxRes.current || {};
        const daily = wxRes.daily || {};
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m != null ? Math.round(current.relative_humidity_2m) : null;
        const windKmh = current.wind_speed_10m != null ? Math.round(current.wind_speed_10m) : null;
        const rainPct = daily.precipitation_probability_max ? (daily.precipitation_probability_max[0] ?? 0) : 0;
        return { temperatureC: temp, humidityPct: humidity, windKmh: windKmh, rainChancePct: rainPct };
    }

    window.reverseGeocodeLite = reverseGeocode;
    window.fetchWeatherLite = fetchOpenMeteo;
})();


