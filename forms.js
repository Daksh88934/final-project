export function openModal() {
    document.getElementById('loginModal').style.display = 'block';
}
export function closeModal() {
    document.getElementById('loginModal').style.display = 'none';
}
export async function autofillLocation(inputId) {
    let lat, lon;
    if (navigator.geolocation) {
        await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                    resolve();
                },
                () => resolve(),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
    if (lat && lon) {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`);
        const data = await res.json();
        if (data && data.results && data.results.length) {
            document.getElementById(inputId).value = data.results[0].name;
        }
    }
}