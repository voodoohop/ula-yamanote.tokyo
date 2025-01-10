const osc = require('node-osc');
const { exec } = require('child_process');

const trains = [
    '--[@_@]--[#]-->',
    '==[O_O]=[@]=[@]>',
    '+-[><]=-[$]-[$]-[$]-->',
    '..[=v=]~[B]~>#>',
    '(@_@)----[%]..>',
    '|==[^_^]==#=@=>',
    '.-<(.)>-[+]-[@]->',
    ']-[#_#]=-[=]-[@]-[&]->',
    '<>[(@@)]>[H]>#>',
    '---(0_0)--[$]-[$]->',
    '|==[{@}]==[#]->',
    '<<[o_o]=[&]=[@]=#>',
    '.-[^_^]-[%]->#>',
    '==(x_x)==[?]-[$]->',
    '[=0_0=][#][#]->',
    '<[@_@]=[H]=[H]=>',
    '.-[._.]->[@]->#>',
    '[o_0]=[@]==[&]->',
    '--[^^]-[#]-[$]->'
];

const stations = [
    'EBISU',
    'SHIBUYA',
    'HARAJUKU',
    'YOYOGI',
    'SHINJUKU',
    'SHIN-OKUBO',
    'TAKADANOBABA',
    'MEJIRO',
    'IKEBUKURO',
    'OTSUKA',
    'SUGAMO',
    'KOMAGOME',
    'TABATA',
    'NISHI-NIPPORI',
    'NIPPORI',
    'UGUISUDANI',
    'UENO',
    'OKACHIMACHI',
    'AKIHABARA',
    'KANDA',
    'TOKYO',
    'YURAKUCHO',
    'SHIMBASHI',
    'HAMAMATSUCHO',
    'TAMACHI',
    'SHINAGAWA',
    'OSAKI',
    'GOTANDA',
    'MEGURO'
];

const fillers = [
    '----', '~~~~', '....', '===>',
    '-->', '>>>', '-.->', '--->'
];

const announcements = [
    'next station is', 'approaching', 'now arriving at', 'next stop',
    'arriving at', 'coming up next', 'prepare for'
];

// ASCII characters for glitch effect - removed problematic shell characters
const glitchChars = '@#$%&*+=<>^~|?!;{}[]';

function escapeShellString(str) {
    return str.replace(/(["\\'$`])/g, '\\$1');
}

function glitchText(text) {
    if (currentStationIndex < 26) return text; // Only glitch after OSAKI
    
    return text.split('').map(char => 
        char === ' ' ? char : // preserve spaces
        Math.random() < 0.2 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
    ).join('');
}

// Global state
let currentStationIndex = 0;
const DEBOUNCE_MS = 1000;
const INTERVAL_MS = 60000;
let intervalTimer = null;

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage() {
    // Generate 3-4 announcement segments
    const numSegments = 3 + Math.floor(Math.random() * 2);
    let segments = [];
    const station = stations[currentStationIndex];
    const doorSide = currentStationIndex % 2 === 0 ? 'right' : 'left';
    const progress = `[${currentStationIndex + 1}/${stations.length}]`;
    
    console.log(`\nGenerating message for station ${currentStationIndex} (${station}):`);
    console.log(`Door side: ${doorSide}`);
    
    for (let i = 0; i < numSegments; i++) {
        const train = getRandomItem(trains);
        const filler = getRandomItem(fillers);
        const announcement = getRandomItem(announcements);
        
        const segment = [
            train,
            ` ${announcement} ${station} ${progress} `,
            filler,
            ` the doors on the ${doorSide} will open `,
            filler,
            ` ${station} ${progress} `,
            (Math.random() < 0.5 ? train : getRandomItem(trains))  // 50% chance of using same train
        ];
        
        console.log(`\nSegment ${i + 1}:`);
        console.log(`Train: ${train}`);
        console.log(`Announcement: ${announcement}`);
        console.log(`Filler: ${filler}`);
        
        segments.push(segment.join(''));
    }
    
    // Add some shorter segments between the main announcements
    const shortSegments = [
        ` ${station} ${progress} ${getRandomItem(fillers)} `,
        ` ${getRandomItem(trains)} `,
        ` ${station} ${progress} station ${getRandomItem(fillers)} `,
        ` ${getRandomItem(trains)} ${station} ${progress} ${getRandomItem(trains)} `
    ];
    
    // Interleave main segments with short segments
    let finalMessage = segments[0];
    for (let i = 1; i < segments.length; i++) {
        finalMessage += getRandomItem(shortSegments) + segments[i];
    }
    
    console.log('\nFinal message:', finalMessage);
    return finalMessage;
}

function updateDisplay() {
    let message = generateMessage();
    message = glitchText(message);
    message = escapeShellString(message);  // Escape special characters
    
    // After OSAKI (index 26), change display behavior
    const isAfterOsaki = currentStationIndex >= 26;
    const mode = isAfterOsaki && Math.random() < 0.5 ? 1 : 0; // right-to-left after OSAKI
    const blink = isAfterOsaki && Math.random() < 0.4 ? 1 : 0; // 40% chance of blinking after OSAKI
    const border = Math.random() < 0.5 ? 1 : 0;  // 50% chance of animated border
    const brightness = currentStationIndex === 26 ? 20 : 100; // 50% chance of low brightness after OSAKI
    
    console.log('\nDisplay parameters:');
    console.log(`Mode: ${mode} (${mode === 0 ? 'left scroll' : 'right scroll'})`);
    console.log(`Blink: ${blink}`);
    console.log(`Border: ${border}`);

    const command = `cd led-name-badge-ls32 && source venv/bin/activate && python3 led-badge-11x44.py -B ${brightness} -m ${mode} -b ${blink} -a ${border} -s 8 "${message}"`;
    console.log('\nExecuting command:', command);
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing command:', error);
            return;
        }
        if (stderr) {
            console.error('Command stderr:', stderr);
        }
        if (stdout) {
            console.log('Command stdout:', stdout);
        }
    });
}

// Create debounced update function
const updateDisplayDebounced = debounce(updateDisplay, DEBOUNCE_MS);

// Function to map 0-1 to station index
function mapToStationIndex(value) {
    // Ensure value is between 0 and 1
    const normalized = Math.max(0, Math.min(1, value));
    // Map to 0-127 and wrap to station count
    return Math.floor(normalized * 128) % stations.length;
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to handle cleanup
function cleanup() {
    if (intervalTimer) {
        clearInterval(intervalTimer);
    }
    server.close();
    process.exit(0);
}

// Set up cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    cleanup();
});

// Create OSC server
const server = new osc.Server(12345, '127.0.0.1');

// Reset interval timer
function resetInterval() {
    if (intervalTimer) {
        clearInterval(intervalTimer);
    }
    intervalTimer = setInterval(() => {
        console.log(`\nInterval timer: advancing to next station ${currentStationIndex} (${stations[currentStationIndex]})`);
        updateDisplay();
    }, INTERVAL_MS);
}

// Handle incoming OSC messages
server.on('message', (msg) => {
    if (msg[0] === '/station/next') {
        const oscValue = parseFloat(msg[1]) || 0;
        currentStationIndex = mapToStationIndex(oscValue);
        console.log(`\nReceived OSC message: ${msg[0]}, value: ${oscValue} (mapped to index: ${currentStationIndex}, station: ${stations[currentStationIndex]})`);
        
        // Reset interval and update display
        resetInterval();
        updateDisplayDebounced();
    }
});

// Initial update
console.log(`Starting with station ${currentStationIndex} (${stations[currentStationIndex]})`);
updateDisplay();
resetInterval();
