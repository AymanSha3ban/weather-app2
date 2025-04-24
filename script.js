const apiKey = '813d5004478546273e369feb15887dce';
let map;
let marker;
let currentLang = 'en';

window.onload = function () {
    const defaultLat = 30.0444; 
    const defaultLon = 31.2357;

    map = L.map('map').setView([defaultLat, defaultLon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLon]).addTo(map);
}

function setLanguage() {
    currentLang = document.getElementById('languageSelect').value;

    document.getElementById('title').innerText = currentLang === 'ar' ? 'تحقق من الطقس' : 'Check the Weather';
    document.getElementById('cityInput').placeholder = currentLang === 'ar' ? 'ادخل اسم البلد' : 'Enter city name';
    document.querySelector('.btn-search').innerText = currentLang === 'ar' ? 'بحث' : 'Search';
    document.querySelector('.logo').innerText = currentLang === 'ar' ? 'سكاي كاست 🌦️' : 'SkyCast 🌦️';

    if (document.getElementById('location').innerText !== '--') {
        getWeather();
    }
}

async function getWeather() {
    document.getElementById('loading').classList.add('active');

    const city = document.getElementById('cityInput').value;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=${currentLang}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.cod !== 200) {
            alert(data.message);
            return;
        }

        document.getElementById('location').innerText =` ${data.name}, ${data.sys.country}`;
        document.getElementById('temperature').innerText = `${Math.round(data.main.temp)}°C`;
        document.getElementById('description').innerText = data.weather[0].description;
        document.getElementById('extra').innerText =`${currentLang === 'ar' ? 'الرطوبة' : 'Humidity'}: ${data.main.humidity}% | ${currentLang === 'ar' ? 'الرياح' : 'Wind'}: ${data.wind.speed} m/s `;

        const weatherCondition = data.weather[0].main.toLowerCase();
        let videoSrc = '';

        if (weatherCondition.includes('rain')) videoSrc = 'videos/rain.mp4';
        else if (weatherCondition.includes('snow')) videoSrc = 'videos/snow.mp4';
        else if (weatherCondition.includes('clear')) videoSrc = 'videos/sunny.mp4';
        else if (weatherCondition.includes('cloud')) videoSrc = 'videos/cloudy.mp4';
        else if (weatherCondition.includes('thunderstorm')) videoSrc = 'videos/storm.mp4';
        else if (weatherCondition.includes('drizzle')) videoSrc = 'videos/drizzle.mp4';
        if (!videoSrc) videoSrc = 'videos/snow.mp4';

        document.getElementById('video-source').src = videoSrc;
        document.getElementById('bg-video').load();

        if (!map) {
            map = L.map('map').setView([data.coord.lat, data.coord.lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data © OpenStreetMap contributors'
            }).addTo(map);
            marker = L.marker([data.coord.lat, data.coord.lon]).addTo(map);
        } else {
            map.setView([data.coord.lat, data.coord.lon], 10);
            marker.setLatLng([data.coord.lat, data.coord.lon]);
        }

        await getPastWeather(data.coord.lat, data.coord.lon);

    } catch (err) {
        console.error(err);
        alert(currentLang === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading weather data.');
    } finally {
        document.getElementById('loading').classList.remove('active');
    }
}

function getPastTimestamp(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return Math.floor(date.getTime() / 1000);
}

async function getPastWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${currentLang}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();

        const daysData = {};

        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateStr = date.toLocaleDateString(currentLang, { weekday: 'short', day: 'numeric', month: 'short' });

            if (!daysData[dateStr]) {
                daysData[dateStr] = {
                    temp: item.main.temp,
                    desc: item.weather[0].description,
                    date: dateStr
                };
            }
        });

        const keys = Object.keys(daysData).slice(0, 3);
        keys.forEach((key, i) => {
            const day = daysData[key];
            document.getElementById(`day${i + 1}`).innerHTML = `
                <h4>${day.date}</h4>
                <p>${Math.round(day.temp)}°C</p>
                <small>${day.desc}</small>
            `;
        });

    } catch (err) {
        console.error("Error loading forecast:", err);
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`day${i}`).innerText = currentLang === 'ar' ? 'خطأ في التحميل' : 'Error';
        }
    }
}
