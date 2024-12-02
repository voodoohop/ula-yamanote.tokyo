const audio = new Audio('https://github.com/pollinations/ula-yamanote.tokyo/raw/refs/heads/main/convenience%20store%20-%20shabu%20shabu%20-%20please%20be%20careful.mp3');
const audioButton = document.getElementById('audioControl');

document.addEventListener('click', () => {
    if (Tone.context.state !== 'running') {
        Tone.context.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
});

audioButton.addEventListener('click', () => {
    if (audio.paused) {
        // Request GPS permissions and start tracking when play is clicked
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(() => {
                startGPSTracking();
                audio.play();
                audioButton.classList.add('playing');
                audioButton.textContent = '山手線 STOP';
                infoDiv.classList.add('gps-active');
            }, (error) => {
                console.error("Error getting location:", error);
                audio.play();
                audioButton.classList.add('playing');
                audioButton.textContent = '山手線 STOP';
            });
        } else {
            audio.play();
            audioButton.classList.add('playing');
            audioButton.textContent = '山手線 STOP';
        }
    } else {
        audio.pause();
        audio.currentTime = 0;
        audioButton.classList.remove('playing');
        audioButton.textContent = '山手線 SOUND';
        infoDiv.classList.remove('gps-active');
        // Reset the info div to its initial state
        infoDiv.innerHTML = `
            <div class="current-station">
                <div class="system-alert">
                    システム アラート:<br>
                    <span class="highlight">ウラ YAMANOTE</span><br>
                    ローンチング アット<br>
                    TRAFFIC TOKYO<br>
                    六本木<br>
                    12月7日 / DEC 7<br>
                    2024
                </div>
            </div>
        `;
    }
});

// Add floating kanji
function addFloatingKanji() {
    const kanjiList = '山手線東京渋谷新宿池袋上野';
    const kanji = document.createElement('div');
    kanji.className = 'kanji';
    kanji.textContent = kanjiList[Math.floor(Math.random() * kanjiList.length)];
    kanji.style.left = Math.random() * 100 + '%';
    document.querySelector('.kanji-decorations').appendChild(kanji);
    setTimeout(() => {
        kanji.remove();
    }, 20000);
}

setInterval(addFloatingKanji, 2000);

// Add glitch effect to announcement text
setInterval(() => {
    const stationName = document.querySelector('.station-name');
    const stations = [
        ['渋谷', 'SHIBUYA'],
        ['原宿', 'HARAJUKU'],
        ['代々木', 'YOYOGI'],
        ['新宿', 'SHINJUKU']
    ];
    const randomStation = stations[Math.floor(Math.random() * stations.length)];
    stationName.textContent = randomStation[0];
    stationName.setAttribute('data-romaji', randomStation[1]);
}, 5000);

// Simulated user location in train
function updateUserLocation() {
    const marker = document.getElementById('userLocation');
    const time = Date.now() * 0.001; // Convert to seconds
    const x = Math.sin(time) * 5; // Oscillate 5px left and right
    marker.style.transform = `translateX(${x}px)`;
}

setInterval(updateUserLocation, 50);

// Initialize Tone.js with reduced volume
const synth = new Tone.Synth().toDestination();
synth.volume.value = -20;

// Function to calculate beep interval based on distance
function getBeepInterval(distance) {
    // Base interval is 2 seconds
    const baseInterval = 2000;
    // Maximum interval is 5 seconds (when far)
    const maxInterval = 5000;
    // Minimum interval is 200ms (when very close)
    const minInterval = 200;
    
    if (distance > 1) {
        return maxInterval;
    } else {
        // Linear interpolation between min and max intervals based on distance
        return Math.max(minInterval, Math.min(maxInterval, baseInterval * distance));
    }
}

function playBeep() {
    synth.triggerAttackRelease("C4", "32n");
}

function startGPSTracking() {
    if ("geolocation" in navigator) {
        // Initialize compass first
        checkCompassSupport().then(compassSupported => {
            console.log("Compass support:", compassSupported);
            hasCompass = compassSupported;
            
            // Then start GPS tracking
            navigator.geolocation.watchPosition((position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Find closest station and calculate bearing
                let closestStation = null;
                let minDistance = Infinity;
                
                stationCoordinates.forEach(station => {
                    const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestStation = station;
                    }
                });

                // Calculate bearing to closest station
                const bearing = calculateBearing(
                    {lat: userLat, lng: userLng},
                    {lat: closestStation.lat, lng: closestStation.lng}
                );

                // Get direction text
                const direction = getDirection(
                    {lat: userLat, lng: userLng},
                    {lat: closestStation.lat, lng: closestStation.lng}
                );

                // Find Japanese name for the station
                const stationInfo = japaneseStations.find(station => 
                    station[1].toLowerCase().includes(closestStation.name.toLowerCase())
                );
                const japaneseName = stationInfo ? stationInfo[0] : closestStation.name;

                // Update info display with compass if supported
                const compassHTML = hasCompass ? `
                    <div class="compass">
                        <div class="compass-arrow"></div>
                        <div class="compass-target"></div>
                    </div>
                ` : '';

                // Convert distance to meters and format
                const distanceInMeters = Math.round(minDistance * 1000);

                infoDiv.innerHTML = `
                    <div class="current-station">
                        <div class="proximity-info">
                            <div class="closest-station-label">最寄り駅 / NEAREST STATION</div>
                            <div class="station-name-display">
                                ${japaneseName}
                                <div class="romaji">${closestStation.name}</div>
                            </div>
                            <div class="distance">${distanceInMeters}m</div>
                            ${compassHTML}
                            <div class="direction">Head ${direction}</div>
                            <div class="status ${distanceInMeters > 100 ? 'out-of-range' : 'in-range'}">
                                ${distanceInMeters > 100 ? '駅の範囲外です / Not within station range' : '駅の範囲内です / Within station range'}
                            </div>
                        </div>
                    </div>
                `;

                // Position the target indicator based on bearing
                if (hasCompass) {
                    const compassTarget = document.querySelector('.compass-target');
                    if (compassTarget) {
                        compassTarget.style.transform = `translateX(-50%) rotate(${bearing}deg)`;
                    }
                }

                // Update station display if within range
                if (distanceInMeters <= 100) {
                    const stationIndex = japaneseStations.findIndex(station => 
                        station[1].toLowerCase().includes(closestStation.name.toLowerCase()));
                    if (stationIndex !== -1) {
                        currentStationIndex = stationIndex;
                    }
                }

                // Adjust beep interval based on distance
                const beepInterval = getBeepInterval(distanceInMeters);
                clearInterval(beepIntervalId);
                beepIntervalId = setInterval(playBeep, beepInterval);

            }, (error) => {
                console.error("Error getting location:", error);
                infoDiv.innerHTML = `
                    <div class="current-station">
                        <div style="color:#f55; font-size: 1.5em;">⚠️ GPS エラー / ERROR ⚠️</div>
                        <div>位置情報サービスにアクセスできません<br>Unable to access location services</div>
                    </div>
                `;
            }, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            });
        }).catch(error => {
            console.error("Compass initialization error:", error);
            hasCompass = false;
        });
    }
}

let beepIntervalId = setInterval(playBeep, 5000); // Default interval

// Station names in Japanese and English
const japaneseStations = [
    ['大崎', 'Osaki'],
    ['五反田', 'Gotanda'],
    ['目黒', 'Meguro'],
    ['恵比寿', 'Ebisu'],
    ['渋谷', 'Shibuya'],
    ['原宿', 'Harajuku'],
    ['代々木', 'Yoyogi'],
    ['新宿', 'Shinjuku'],
    ['新大久保', 'Shin-Okubo'],
    ['高田馬場', 'Takadanobaba'],
    ['目白', 'Mejiro'],
    ['池袋', 'Ikebukuro'],
    ['大塚', 'Otsuka'],
    ['巣鴨', 'Sugamo'],
    ['駒込', 'Komagome'],
    ['田端', 'Tabata'],
    ['西日暮里', 'Nishi-Nippori'],
    ['日暮里', 'Nippori'],
    ['鶯谷', 'Uguisudani'],
    ['上野', 'Ueno'],
    ['御徒町', 'Okachimachi'],
    ['秋葉原', 'Akihabara'],
    ['神田', 'Kanda'],
    ['東京', 'Tokyo'],
    ['有楽町', 'Yurakucho'],
    ['新橋', 'Shimbashi'],
    ['浜松町', 'Hamamatsucho'],
    ['田町', 'Tamachi'],
    ['高輪ゲートウェイ', 'Takanawa Gateway'],
    ['品川', 'Shinagawa']
];

// After the japaneseStations array, add the station coordinates
const stationCoordinates = [
    {lat: 35.6197, lng: 139.7286, name: 'Osaki'},
    {lat: 35.6264, lng: 139.7232, name: 'Gotanda'},
    {lat: 35.6330, lng: 139.7155, name: 'Meguro'},
    {lat: 35.6467, lng: 139.7101, name: 'Ebisu'},
    {lat: 35.6580, lng: 139.7016, name: 'Shibuya'},
    {lat: 35.6702, lng: 139.7028, name: 'Harajuku'},
    {lat: 35.6830, lng: 139.7022, name: 'Yoyogi'},
    {lat: 35.6900, lng: 139.7004, name: 'Shinjuku'},
    {lat: 35.7013, lng: 139.7005, name: 'Shin-Okubo'},
    {lat: 35.7123, lng: 139.7030, name: 'Takadanobaba'},
    {lat: 35.7212, lng: 139.7064, name: 'Mejiro'},
    {lat: 35.7289, lng: 139.7100, name: 'Ikebukuro'},
    {lat: 35.7311, lng: 139.7282, name: 'Otsuka'},
    {lat: 35.7335, lng: 139.7394, name: 'Sugamo'},
    {lat: 35.7365, lng: 139.7460, name: 'Komagome'},
    {lat: 35.7380, lng: 139.7600, name: 'Tabata'},
    {lat: 35.7325, lng: 139.7668, name: 'Nishi-Nippori'},
    {lat: 35.7289, lng: 139.7708, name: 'Nippori'},
    {lat: 35.7206, lng: 139.7772, name: 'Uguisudani'},
    {lat: 35.7138, lng: 139.7770, name: 'Ueno'},
    {lat: 35.7074, lng: 139.7745, name: 'Okachimachi'},
    {lat: 35.6987, lng: 139.7731, name: 'Akihabara'},
    {lat: 35.6917, lng: 139.7708, name: 'Kanda'},
    {lat: 35.6814, lng: 139.7670, name: 'Tokyo'},
    {lat: 35.6751, lng: 139.7639, name: 'Yurakucho'},
    {lat: 35.6655, lng: 139.7598, name: 'Shimbashi'},
    {lat: 35.6556, lng: 139.7570, name: 'Hamamatsucho'},
    {lat: 35.6457, lng: 139.7476, name: 'Tamachi'},
    {lat: 35.6365, lng: 139.7400, name: 'Takanawa Gateway'},
    {lat: 35.6285, lng: 139.7388, name: 'Shinagawa'}
];

// Add helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Helper function to get direction
function getDirection(from, to) {
    const bearing = calculateBearing(from, to);
    
    // Convert bearing to 8-point cardinal direction
    if (bearing >= 337.5 || bearing < 22.5) return '北 (North)';
    if (bearing >= 22.5 && bearing < 67.5) return '北東 (Northeast)';
    if (bearing >= 67.5 && bearing < 112.5) return '東 (East)';
    if (bearing >= 112.5 && bearing < 157.5) return '南東 (Southeast)';
    if (bearing >= 157.5 && bearing < 202.5) return '南 (South)';
    if (bearing >= 202.5 && bearing < 247.5) return '南西 (Southwest)';
    if (bearing >= 247.5 && bearing < 292.5) return '西 (West)';
    if (bearing >= 292.5 && bearing < 337.5) return '北西 (Northwest)';
    return '北 (North)'; // fallback
}

// Create and initialize the info div with system alert right after creating it
const infoDiv = document.createElement('div');
infoDiv.className = 'station-info';
document.querySelector('.container').appendChild(infoDiv);

// Initialize with system alert message
infoDiv.innerHTML = `
    <div class="current-station">
        <div class="system-alert">
            システム アラート:<br>
            <span class="highlight">ウラ YAMANOTE</span><br>
            ローンチング アット<br>
            TRAFFIC TOKYO<br>
            六本木<br>
            12月7日 / DEC 7<br>
            2024
        </div>
    </div>
`;

// Keep the glitch effect but apply it to the system-alert div
setInterval(() => {
    const alert = document.querySelector('.system-alert');
    if (alert && Math.random() > 0.9) {
        alert.style.transform = `skew(${Math.random() * 10 - 5}deg)`;
        alert.style.textShadow = `${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px #f0f`;
        setTimeout(() => {
            alert.style.transform = 'skew(0deg)';
            alert.style.textShadow = '0 0 5px #0f0';
        }, 100);
    }
}, 100);

// Check if device supports orientation
function checkCompassSupport() {
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ devices
            return DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        return true;
                    }
                })
                .catch(console.error);
        } else {
            // Non iOS 13+ devices
            window.addEventListener('deviceorientation', handleOrientation);
            return Promise.resolve(true);
        }
    }
    return Promise.resolve(false);
}

// Handle device orientation changes
function handleOrientation(event) {
    let heading;
    
    if (event.webkitCompassHeading) {
        // iOS devices
        heading = event.webkitCompassHeading;
    } else if (event.alpha) {
        // Android devices
        heading = 360 - event.alpha;
    } else {
        return;
    }
    
    updateCompass(heading);
}

// Update compass display
function updateCompass(heading) {
    const arrow = document.querySelector('.compass-arrow');
    if (arrow) {
        arrow.style.transform = `translateX(-50%) rotate(${heading}deg)`;
    }
}

// Calculate bearing between two points
function calculateBearing(from, to) {
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
