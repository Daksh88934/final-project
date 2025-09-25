import { getUserLocation, fetchWeather, renderWeather } from './weather.js';
import { renderCropRecommendations } from './crop.js';
import { openChatBox, closeChatBox } from './chat.js';
import { openModal, closeModal, autofillLocation } from './forms.js';

window.openChatBox = openChatBox;
window.closeChatBox = closeChatBox;
window.openModal = openModal;
window.closeModal = closeModal;
window.autofillLocation = autofillLocation;

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('detectBtn').onclick = async function() {
        const location = await getUserLocation();
        const weather = await fetchWeather(location);
        renderWeather(weather);

        // Crop recommendations
        const snap = {
            temperatureC: weather?.temp,
            cityName: weather?.city,
            month: (new Date()).getMonth() + 1
        };
        renderCropRecommendations(snap);
    };
});