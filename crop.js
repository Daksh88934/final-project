export function renderCropRecommendations(snap) {
    const cropRecommendations = document.getElementById('cropRecommendations');
    cropRecommendations.classList.remove('hidden');
    cropRecommendations.innerHTML = '<p>Analyzing local weather and season...</p>';

    const temp = snap.temperatureC;
    const m = snap.month;
    const season = (m >= 6 && m <= 9) ? 'Kharif (Monsoon)' : (m >= 10 && m <= 2 ? 'Rabi (Winter)' : 'Zaid (Summer)');

    const recs = [];
    if (season === 'Kharif (Monsoon)') {
        recs.push({ name: 'Soybean', reason: 'Good for monsoon sowing; nitrogen-fixing benefits.' });
    } else if (season === 'Rabi (Winter)') {
        recs.push({ name: 'Wheat', reason: 'Best for winter sowing.' });
    } else {
        recs.push({ name: 'Fodder maize', reason: 'Tolerates summer with irrigation.' });
    }
    if (temp != null) {
        if (temp >= 38) recs.unshift({ name: 'Millets (Bajra/Sorghum)', reason: 'High heat tolerance for hot days.' });
        else if (temp <= 10) recs.unshift({ name: 'Barley', reason: 'Handles very low temperatures.' });
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
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(76, 175, 80, 0.1); border-radius: 5px;">
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