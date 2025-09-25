// Weather UI helpers (no module; attach to window)

(function(){
    function renderWeatherTiles(tiles, placeName) {
        var grid = document.getElementById('weatherGrid');
        if (!grid) return;
        grid.classList.add('hidden');
        grid.innerHTML = '';
        tiles.forEach(function(t, i){
            var el = document.createElement('div');
            var variant = i===0 ? 'variant-temp' : i===1 ? 'variant-humidity' : i===2 ? 'variant-rain' : 'variant-wind';
            el.className = 'metric-tile ' + variant;
            el.innerHTML = '<span class="metric-icon-circle"><span class="metric-icon" style="--d:'+i+'">'+t.icon+'</span></span>'+
                           '<div class="metric-value">'+t.value+'</div>'+
                           '<div class="metric-label">'+t.label+'</div>';
            grid.appendChild(el);
        });
        grid.classList.remove('hidden');
        if (placeName) {
            var weatherContainer = document.getElementById('weatherData');
            if (weatherContainer) {
                var existing = weatherContainer.querySelector('.weather-place');
                if (existing) existing.remove();
                var place = document.createElement('div');
                place.className = 'weather-place';
                place.textContent = '📍 ' + placeName;
                weatherContainer.appendChild(place);
            }
        }
        // subtle motion if anime.js present
        if (window.anime) {
            window.anime({ targets: '#weatherGrid .metric-tile', translateY: [16, 0], opacity: [0, 1], scale: [0.96, 1], duration: 650, easing: 'cubicBezier(.2,.8,.2,1)', delay: window.anime.stagger(80) });
            window.anime({ targets: '#weatherGrid .metric-icon', rotate: [ -12, 0 ], duration: 700, easing: 'spring(1, 70, 10, 0)', delay: window.anime.stagger(120) });
        }
        var card = document.querySelector('.info-card.weather-info');
        if (card) {
            card.classList.add('weather-detected');
            setTimeout(function(){ card.classList.remove('weather-detected'); }, 1500);
        }
    }

    function setWeatherHeader(conditionText, sourceNoteHtml) {
        var container = document.getElementById('weatherData');
        if (!container) return;
        var headerHtml = '<div style="font-size:1.2rem;margin-top:4px;">'+(conditionText || '')+'</div>' + (sourceNoteHtml || '');
        container.innerHTML = headerHtml;
    }

    window.renderWeatherTiles = renderWeatherTiles;
    window.setWeatherHeader = setWeatherHeader;
})();


