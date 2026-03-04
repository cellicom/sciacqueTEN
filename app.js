// Translations are loaded from i18n.js via global variables window.translations and window.availableLanguages
const translations = window.translations;
const availableLanguages = window.availableLanguages;

const schoolGrades = [
    { value: 0, label: "0" }, { value: 0.25, label: "0+" }, { value: 0.5, label: "½" }, { value: 0.75, label: "1-" },
    { value: 1, label: "1" }, { value: 1.25, label: "1+" }, { value: 1.5, label: "1 ½" }, { value: 1.75, label: "2-" },
    { value: 2, label: "2" }, { value: 2.25, label: "2+" }, { value: 2.5, label: "2 ½" }, { value: 2.75, label: "3-" },
    { value: 3, label: "3" }, { value: 3.25, label: "3+" }, { value: 3.5, label: "3 ½" }, { value: 3.75, label: "4-" },
    { value: 4, label: "4" }, { value: 4.25, label: "4+" }, { value: 4.5, label: "4 ½" }, { value: 4.75, label: "5-" },
    { value: 5, label: "5" }, { value: 5.25, label: "5+" }, { value: 5.5, label: "5 ½" }, { value: 5.75, label: "6-" },
    { value: 6, label: "6" }, { value: 6.25, label: "6+" }, { value: 6.5, label: "6 ½" }, { value: 6.75, label: "7-" },
    { value: 7, label: "7" }, { value: 7.25, label: "7+" }, { value: 7.5, label: "7 ½" }, { value: 7.75, label: "8-" },
    { value: 8, label: "8" }, { value: 8.25, label: "8+" }, { value: 8.5, label: "8 ½" }, { value: 8.75, label: "9-" },
    { value: 9, label: "9" }, { value: 9.25, label: "9+" }, { value: 9.5, label: "9 ½" }, { value: 9.75, label: "10-" },
    { value: 10, label: "10" }
];

let state = {
    maxScore: '10',
    scores: [''],
    lang: 'it',
    theme: 'light',
    formatMode: 'half', // 'half' or 'decimal'
    micId: 'default'
};

// DOM Elements
const elements = {
    maxScore: document.getElementById('maxScore'),
    clearMax: document.getElementById('clearMax'),
    resetAll: document.getElementById('resetAll'),
    scoresContainer: document.getElementById('scoresContainer'),
    addScore: document.getElementById('addScore'),
    resDecimal: document.getElementById('resDecimal'),
    resFloor: document.getElementById('resFloor'),
    resCeil: document.getElementById('resCeil'),
    resSuggested: document.getElementById('resSuggested'),
    resSummary: document.getElementById('resSummary'),
    langSelect: document.getElementById('langSelect'),
    themeToggleOptions: document.getElementById('themeToggleOptions'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),
    voiceToggle: document.getElementById('voiceToggle'),
    formatSwitch: document.getElementById('formatSwitch'),
    gradeFlipCard: document.getElementById('gradeFlipCard'),
    resSuggestedBackVal: document.getElementById('resSuggestedBackVal'),
    heartSurprise: document.getElementById('heartEasterEgg'),
    micSelect: document.getElementById('micSelect'),
    recordingModal: new bootstrap.Modal(document.getElementById('recordingModal')),
    audioWaveCanvas: document.getElementById('audioWaveCanvas'),
    rawVoiceDebug: document.getElementById('rawVoiceDebug'),
    btnStopRecordingModal: document.getElementById('btnStopRecordingModal'),
    btnRestartRecordingModal: document.getElementById('btnRestartRecordingModal'), // New button
    html: document.documentElement
};

// Init
function init() {
    loadState();
    populateLangSelect();
    populateMicSelect();
    elements.maxScore.value = state.maxScore;
    renderScores();
    updateTranslations();
    applyTheme();
    applyFormatMode();
    calculate();
}

async function populateMicSelect() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(device => device.kind === 'audioinput');

        const t = translations[state.lang];
        elements.micSelect.innerHTML = `<option value="default" id="lblDefaultMic">${t.lblDefaultMic || 'Predefinito'}</option>`;

        let foundSaved = false;
        mics.forEach((mic, index) => {
            if (mic.deviceId && mic.deviceId !== 'default' && mic.deviceId !== 'communications') {
                const option = document.createElement('option');
                option.value = mic.deviceId;
                option.textContent = mic.label || `Microfono ${index + 1}`;
                elements.micSelect.appendChild(option);
                if (state.micId === mic.deviceId) foundSaved = true;
            }
        });

        if (foundSaved) {
            elements.micSelect.value = state.micId;
        } else {
            state.micId = 'default';
            elements.micSelect.value = 'default';
            saveState();
        }
    } catch (err) {
        console.error("Error enumerating mics:", err);
    }
}

function populateLangSelect() {
    elements.langSelect.innerHTML = '';
    availableLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        // Provide the full extended name plus the emoji
        option.textContent = `${lang.label} - ${lang.name || lang.code.toUpperCase()}`;
        elements.langSelect.appendChild(option);
    });
}

function loadState() {
    const saved = localStorage.getItem('gradeConverterState');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
    } else {
        // Detect system language
        const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
        state.lang = translations[browserLang] ? browserLang : 'en';

        // Default theme based on system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            state.theme = 'dark';
        }
    }
}

function saveState() {
    localStorage.setItem('gradeConverterState', JSON.stringify(state));
}

// Logic
function calculate() {
    const sum = state.scores.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
    const max = parseFloat(state.maxScore) || 0;

    // Update Summary Card
    elements.resSummary.textContent = `${sum} / ${max > 0 ? max : '-'}`;

    if (max > 0) {
        let result = (sum / max) * 10;
        result = Math.min(10, Math.max(0, result)); // Clamp 0-10

        elements.resDecimal.textContent = result.toFixed(2);
        elements.resFloor.textContent = Math.floor(result);
        elements.resCeil.textContent = Math.ceil(result);

        const suggested = getSuggestedGrade(result);
        elements.resSuggested.textContent = suggested;

        // Populate back card with decimal format (.5)
        const suggestedDecimal = getSuggestedGrade(result, true);
        elements.resSuggestedBackVal.textContent = suggestedDecimal;

        // Color coding logic
        const decimalPass = result >= 6;
        const suggestedVal = Math.round(result * 4) / 4;
        const suggestedPass = suggestedVal >= 6;

        const lblSuggested = document.getElementById('lblSuggested');
        const lblSuggestedBack = document.getElementById('lblSuggestedBack');
        const lblDecimal = document.getElementById('lblDecimal');

        // Suggested Grade Styling (Front)
        elements.resSuggested.className = 'fs-4 fw-bold ' + (suggestedPass ? 'grade-text-success' : 'grade-text-danger');
        elements.resSuggested.parentElement.className = 'result-badge border-primary h-100 ' + (suggestedPass ? 'grade-success' : 'grade-danger');
        lblSuggested.className = 'd-block fw-semibold mb-1 ' + (suggestedPass ? 'lbl-suggested-success' : 'lbl-suggested-danger');

        // Suggested Grade Styling (Back)
        elements.resSuggestedBackVal.className = 'fs-4 fw-bold ' + (suggestedPass ? 'grade-text-success' : 'grade-text-danger');
        elements.resSuggestedBackVal.parentElement.className = 'result-badge border-primary h-100 ' + (suggestedPass ? 'grade-success' : 'grade-danger');
        lblSuggestedBack.className = 'd-block fw-semibold mb-1 ' + (suggestedPass ? 'lbl-suggested-success' : 'lbl-suggested-danger');

        // Decimal Grade Styling
        elements.resDecimal.className = 'fs-4 fw-bold ' + (decimalPass ? 'grade-text-success' : 'grade-text-danger');
        elements.resDecimal.parentElement.className = 'result-badge border-primary ' + (decimalPass ? 'grade-success' : 'grade-danger');
        lblDecimal.className = 'd-block fw-semibold mb-1 ' + (decimalPass ? 'lbl-suggested-success' : 'lbl-suggested-danger');
    } else {
        const lblSuggested = document.getElementById('lblSuggested');
        const lblSuggestedBack = document.getElementById('lblSuggestedBack');
        const lblDecimal = document.getElementById('lblDecimal');

        elements.resDecimal.textContent = '-';
        elements.resFloor.textContent = '-';
        elements.resCeil.textContent = '-';
        elements.resSuggested.textContent = '-';
        elements.resSuggestedBackVal.textContent = '-';

        // Reset styles
        elements.resSuggested.className = 'fs-4 fw-bold text-primary';
        elements.resSuggested.parentElement.className = 'result-badge border-primary h-100';
        lblSuggested.className = 'text-muted d-block fw-semibold';

        elements.resSuggestedBackVal.className = 'fs-4 fw-bold text-primary';
        elements.resSuggestedBackVal.parentElement.className = 'result-badge border-primary h-100';
        lblSuggestedBack.className = 'text-muted d-block fw-semibold';

        elements.resDecimal.className = 'fs-4 fw-bold text-primary';
        elements.resDecimal.parentElement.className = 'result-badge border-primary';
        lblDecimal.className = 'text-muted d-block fw-semibold';
    }
}

function getSuggestedGrade(val, forceDecimal = false) {
    // Round to nearest 0.25
    const rounded = Math.round(val * 4) / 4;
    const grade = schoolGrades.find(g => Math.abs(g.value - rounded) < 0.001);

    if (grade) {
        if (forceDecimal && grade.label.includes('½')) {
            return grade.label.replace('½', '.5').trim();
        }
        if (forceDecimal && grade.label === '½') {
            return '0.5';
        }
        return grade.label;
    }
    return rounded.toFixed(1);
}

// UI Rendering
function renderScores() {
    elements.scoresContainer.innerHTML = '';
    state.scores.forEach((score, index) => {
        const row = document.createElement('div');
        row.className = 'row g-2 mb-2 score-row align-items-center';
        row.innerHTML = `
            <div class="col">
                <input type="number" class="form-control score-input" value="${score}" data-index="${index}" placeholder="${translations[state.lang].placeholderScore}">
            </div>
            <div class="col-auto">
                <button class="btn btn-danger btn-sm rounded-3 remove-score btn-delete-score" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        elements.scoresContainer.appendChild(row);
    });

    // Add listeners to new elements
    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            state.scores[e.target.dataset.index] = e.target.value;
            calculate();
            saveState();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                elements.addScore.click();
                // Focus the newly added input
                setTimeout(() => {
                    const nextInputs = document.querySelectorAll('.score-input');
                    nextInputs[nextInputs.length - 1].focus();
                }, 0);
            }
        });
    });

    document.querySelectorAll('.remove-score').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            state.scores.splice(idx, 1);
            renderScores();
            calculate();
            saveState();
        });
    });
}

function updateTranslations() {
    const t = translations[state.lang];
    document.getElementById('lblMaxScore').textContent = t.lblMaxScore;
    document.getElementById('clearMax').title = t.clearMax;
    document.getElementById('resetAll').querySelector('span').textContent = t.btnReset;
    document.getElementById('lblScoresList').textContent = t.lblScoresList;
    elements.addScore.title = t.addTitle;
    document.getElementById('lblResults').textContent = t.lblResults;
    document.getElementById('lblDecimal').textContent = t.lblDecimal;
    document.getElementById('lblFloor').textContent = t.lblFloor;
    document.getElementById('lblCeil').textContent = t.lblCeil;
    document.getElementById('lblSuggested').textContent = t.lblSuggested;
    document.getElementById('lblSuggestedBack').textContent = t.lblSuggested;
    document.getElementById('lblSummary').textContent = t.lblSummary;

    // Settings Modal translations
    if (document.getElementById('settingsModalLabel')) {
        document.getElementById('settingsModalLabel').textContent = t.lblSettingsTitle;
        document.getElementById('lblMicrophone').textContent = t.lblMicrophone;
        document.getElementById('lblTheme').textContent = t.lblTheme;
        document.getElementById('lblLanguage').textContent = t.lblLanguage;
        document.getElementById('lblDefaultMic').textContent = t.lblDefaultMic;
    }

    // Modal translations
    document.getElementById('helpModalLabel').textContent = t.helpTitle;
    document.getElementById('helpIntro').textContent = t.helpIntro;
    document.getElementById('helpFeatureEnter').innerHTML = t.helpFeatureEnter;
    document.getElementById('helpFeatureVoice').innerHTML = t.helpFeatureVoice;
    document.getElementById('helpFeatureVoiceStop').innerHTML = t.helpFeatureVoiceStop;
    document.getElementById('helpFeatureFormat').innerHTML = t.helpFeatureFormat;
    document.getElementById('helpFeatureSurprise').innerHTML = t.helpFeatureSurprise;
    document.getElementById('btnCloseModal').textContent = t.btnClose;
    document.getElementById('lblRecordingTitle').textContent = t.lblRecordingTitle;
    document.getElementById('lblVoiceStopInstruction').innerHTML = t.lblVoiceStopInstruction;
    document.getElementById('lblRawVoiceTitle').textContent = t.lblRawVoiceTitle;
    document.getElementById('lblStopRecordingBtn').textContent = t.lblStopRecordingBtn;
    if (document.getElementById('lblRestartRecordingBtn')) {
        document.getElementById('lblRestartRecordingBtn').textContent = t.lblRestartRecordingBtn;
    }

    elements.maxScore.placeholder = t.placeholderMax;
    elements.langSelect.value = state.lang;

    // Refresh scores list for input placeholders
    renderScores();
}

function applyTheme() {
    elements.html.setAttribute('data-theme', state.theme);
}

// Event Listeners
elements.maxScore.addEventListener('input', (e) => {
    state.maxScore = e.target.value;
    calculate();
    saveState();
});

elements.clearMax.addEventListener('click', () => {
    state.maxScore = '';
    elements.maxScore.value = '';
    calculate();
    saveState();
});

elements.addScore.addEventListener('click', () => {
    state.scores.push('');
    renderScores();
    calculate();
    saveState();
});

elements.resetAll.addEventListener('click', () => {
    state.scores = [''];
    renderScores();
    calculate();
    saveState();
});

elements.langSelect.addEventListener('change', (e) => {
    state.lang = e.target.value;
    updateTranslations();
    saveState();
});

elements.themeToggleOptions.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveState();
});

elements.micSelect.addEventListener('change', (e) => {
    state.micId = e.target.value;
    saveState();
});

if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', populateMicSelect);
}

function applyFormatMode() {
    const isDecimal = state.formatMode === 'decimal';
    elements.gradeFlipCard.classList.toggle('flipped', isDecimal);
    elements.formatSwitch.classList.toggle('mode-decimal', isDecimal);

    // Update active class on switch options
    const options = elements.formatSwitch.querySelectorAll('.format-switch-option');
    options.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.mode === state.formatMode);
    });
}

elements.formatSwitch.addEventListener('click', (e) => {
    const option = e.target.closest('.format-switch-option');
    if (option) {
        state.formatMode = option.dataset.mode;
    } else {
        // Toggle if clicking background
        state.formatMode = state.formatMode === 'half' ? 'decimal' : 'half';
    }
    applyFormatMode();
    saveState();
});

// Surprise Feature
if (elements.heartSurprise) {
    elements.heartSurprise.addEventListener('click', () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#34d399', '#f87171', '#fbbf24']
        });
    });
}

// Voice Recognition & Audio Visualization Setup
let recognition = null;
let isRecording = false;
let audioCtx, analyser, dataArray, animationId, mediaStream;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Enabled for debug text

    recognition.onstart = () => {
        isRecording = true;
        elements.voiceToggle.classList.remove('btn-recording'); // remove spinner
        elements.voiceToggle.classList.add('btn-danger'); // Add active color
        elements.recordingModal.show();
        elements.rawVoiceDebug.textContent = "...";

        // Hide restart button, show stop button
        elements.btnStopRecordingModal.style.display = 'inline-block';
        if (elements.btnRestartRecordingModal) elements.btnRestartRecordingModal.style.display = 'none';

        initAudioWave();
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
                processVoiceInput(event.results[i][0].transcript);
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        elements.rawVoiceDebug.innerHTML = `<strong>${finalTranscript}</strong> <span class="text-muted">${interimTranscript}</span>`;
    };

    recognition.onend = () => {
        if (isRecording) {
            // Mobile (iOS especially) closes the connection after a silence. 
            // Instead of auto-restarting (which can be blocked), we show a manual restart button.
            stopAudioWave();
            elements.btnStopRecordingModal.style.display = 'none';
            if (elements.btnRestartRecordingModal) {
                elements.btnRestartRecordingModal.style.display = 'inline-block';
                elements.rawVoiceDebug.innerHTML += `<br><span class="text-danger small">${translations[state.lang].lblVoicePaused}</span>`;
            }
        } else {
            stopAudioWave();
            elements.recordingModal.hide();
            elements.voiceToggle.classList.remove('btn-danger');
            elements.voiceToggle.innerHTML = '<i class="bi bi-mic-fill"></i>';
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopVoiceRecording();

        const t = translations[state.lang];
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            alert(t.msgMicError || "Microphone access denied.");
        } else if (event.error !== 'no-speech') {
            alert(t.msgSpeechError || "Speech recognition error.");
        }
    };
} else {
    if (elements.voiceToggle) elements.voiceToggle.style.display = 'none';
}

const wordToNumberMap = {
    // Italian (0-100)
    'zero': '0', 'uno': '1', 'un': '1', 'due': '2', 'tre': '3', 'quattro': '4',
    'cinque': '5', 'sei': '6', 'sette': '7', 'otto': '8', 'nove': '9', 'dieci': '10',
    'undici': '11', 'dodici': '12', 'tredici': '13', 'quattordici': '14', 'quindici': '15',
    'sedici': '16', 'diciassette': '17', 'diciotto': '18', 'diciannove': '19', 'venti': '20',
    'ventuno': '21', 'ventidue': '22', 'ventitre': '23', 'ventiquattro': '24', 'venticinque': '25',
    'ventisei': '26', 'ventisette': '27', 'ventotto': '28', 'ventinove': '29', 'trenta': '30',
    'trentuno': '31', 'trentadue': '32', 'trentatre': '33', 'trentaquattro': '34', 'trentacinque': '35',
    'trentasei': '36', 'trentasette': '37', 'trentotto': '38', 'trentanove': '39', 'quaranta': '40',
    'quarantuno': '41', 'quarantadue': '42', 'quarantatre': '43', 'quarantaquattro': '44', 'quarantacinque': '45',
    'quarantasei': '46', 'quarantasette': '47', 'quarantotto': '48', 'quarantanove': '49', 'cinquanta': '50',
    'cinquantuno': '51', 'cinquantadue': '52', 'cinquantatre': '53', 'cinquantaquattro': '54', 'cinquantacinque': '55',
    'cinquantasei': '56', 'cinquantasette': '57', 'cinquantotto': '58', 'cinquantanove': '59', 'sessanta': '60',
    'sessantuno': '61', 'sessantadue': '62', 'sessantatre': '63', 'sessantaquattro': '64', 'sessantacinque': '65',
    'sessantasei': '66', 'sessantasette': '67', 'sessantotto': '68', 'sessantanove': '69', 'settanta': '70',
    'settantuno': '71', 'settantadue': '72', 'settantatre': '73', 'settantaquattro': '74', 'settantacinque': '75',
    'settantasei': '76', 'settantasette': '77', 'settantotto': '78', 'settantanove': '79', 'ottanta': '80',
    'ottantuno': '81', 'ottantadue': '82', 'ottantatre': '83', 'ottantaquattro': '84', 'ottantacinque': '85',
    'ottantasei': '86', 'ottantasette': '87', 'ottantotto': '88', 'ottantanove': '89', 'novanta': '90',
    'novantuno': '91', 'novantadue': '92', 'novantatre': '93', 'novantaquattro': '94', 'novantacinque': '95',
    'novantasei': '96', 'novantasette': '97', 'novantotto': '98', 'novantanove': '99', 'cento': '100',
    'mezzo': '.5', 'virgola': '.', 'punto': '.', 'e mezzo': '.5',

    // English (0-100)
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
    'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
    'twenty-one': '21', 'twenty-two': '22', 'twenty-three': '23', 'twenty-four': '24', 'twenty-five': '25',
    'twenty-six': '26', 'twenty-seven': '27', 'twenty-eight': '28', 'twenty-nine': '29', 'thirty': '30',
    'thirty-one': '31', 'thirty-two': '32', 'thirty-three': '33', 'thirty-four': '34', 'thirty-five': '35',
    'thirty-six': '36', 'thirty-seven': '37', 'thirty-eight': '38', 'thirty-nine': '39', 'forty': '40',
    'forty-one': '41', 'forty-two': '42', 'forty-three': '43', 'forty-four': '44', 'forty-five': '45',
    'forty-six': '46', 'forty-seven': '47', 'forty-eight': '48', 'forty-nine': '49', 'fifty': '50',
    'fifty-one': '51', 'fifty-two': '52', 'fifty-three': '53', 'fifty-four': '54', 'fifty-five': '55',
    'fifty-six': '56', 'fifty-seven': '57', 'fifty-eight': '58', 'fifty-nine': '59', 'sixty': '60',
    'sixty-one': '61', 'sixty-two': '62', 'sixty-three': '63', 'sixty-four': '64', 'sixty-five': '65',
    'sixty-six': '66', 'sixty-seven': '67', 'sixty-eight': '68', 'sixty-nine': '69', 'seventy': '70',
    'seventy-one': '71', 'seventy-two': '72', 'seventy-three': '73', 'seventy-four': '74', 'seventy-five': '75',
    'seventy-six': '76', 'seventy-seven': '77', 'seventy-eight': '78', 'seventy-nine': '79', 'eighty': '80',
    'eighty-one': '81', 'eighty-two': '82', 'eighty-three': '83', 'eighty-four': '84', 'eighty-five': '85',
    'eighty-six': '86', 'eighty-seven': '87', 'eighty-eight': '88', 'eighty-nine': '89', 'ninety': '90',
    'ninety-one': '91', 'ninety-two': '92', 'ninety-three': '93', 'ninety-four': '94', 'ninety-five': '95',
    'ninety-six': '96', 'ninety-seven': '97', 'ninety-eight': '98', 'ninety-nine': '99', 'one hundred': '100',
    'half': '.5', 'point': '.', 'dot': '.', 'and a half': '.5',

    // French (0-100)
    'zéro': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'dix': '10',
    'onze': '11', 'douze': '12', 'treize': '13', 'quatorze': '14', 'quinze': '15', 'seize': '16', 'dix-sept': '17', 'dix-huit': '18', 'dix-neuf': '19', 'vingt': '20',
    'vingt et un': '21', 'vingt-deux': '22', 'vingt-trois': '23', 'vingt-quatre': '24', 'vingt-cinq': '25', 'vingt-six': '26', 'vingt-sept': '27', 'vingt-huit': '28', 'vingt-neuf': '29', 'trente': '30',
    'trente et un': '31', 'trente-deux': '32', 'trente-trois': '33', 'trente-quatre': '34', 'trente-cinq': '35', 'trente-six': '36', 'trente-sept': '37', 'trente-huit': '38', 'trente-neuf': '39', 'quarante': '40',
    'quarante et un': '41', 'quarante-deux': '42', 'quarante-trois': '43', 'quarante-quatre': '44', 'quarante-cinq': '45', 'quarante-six': '46', 'quarante-sept': '47', 'quarante-huit': '48', 'quarante-neuf': '49', 'cinquante': '50',
    'cinquante et un': '51', 'cinquante-deux': '52', 'cinquante-trois': '53', 'cinquante-quatre': '54', 'cinquante-cinq': '55', 'cinquante-six': '56', 'cinquante-sept': '57', 'cinquante-huit': '58', 'cinquante-neuf': '59', 'soixante': '60',
    'soixante et un': '61', 'soixante-deux': '62', 'soixante-trois': '63', 'soixante-quatre': '64', 'soixante-cinq': '65', 'soixante-six': '66', 'soixante-sept': '67', 'soixante-huit': '68', 'soixante-neuf': '69', 'soixante-dix': '70',
    'soixante et onze': '71', 'soixante-douze': '72', 'soixante-treize': '73', 'soixante-quatorze': '74', 'soixante-quinze': '75', 'soixante-seize': '76', 'soixante-dix-sept': '77', 'soixante-dix-huit': '78', 'soixante-dix-neuf': '79', 'quatre-vingts': '80',
    'quatre-vingt-un': '81', 'quatre-vingt-deux': '82', 'quatre-vingt-trois': '83', 'quatre-vingt-quatre': '84', 'quatre-vingt-cinq': '85', 'quatre-vingt-six': '86', 'quatre-vingt-sept': '87', 'quatre-vingt-huit': '88', 'quatre-vingt-neuf': '89', 'quatre-vingt-dix': '90',
    'quatre-vingt-onze': '91', 'quatre-vingt-douze': '92', 'quatre-vingt-treize': '93', 'quatre-vingt-quatorze': '94', 'quatre-vingt-quinze': '95', 'quatre-vingt-seize': '96', 'quatre-vingt-dix-sept': '97', 'quatre-vingt-dix-huit': '98', 'quatre-vingt-dix-neuf': '99', 'cent': '100',
    'virgule': '.', 'et demi': '.5', 'demi': '.5',

    // Spanish (0-100)
    'cero': '0', 'uno': '1', 'una': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
    'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15', 'dieciséis': '16', 'diecisiete': '17', 'dieciocho': '18', 'diecinueve': '19', 'veinte': '20',
    'veintiuno': '21', 'veintidós': '22', 'veintitres': '23', 'veinticuatro': '24', 'veinticinco': '25', 'veintiseis': '26', 'veintisiete': '27', 'veintiocho': '28', 'veintinueve': '29', 'treinta': '30',
    'treinta y uno': '31', 'treinta y dos': '32', 'treinta y tres': '33', 'treinta y cuatro': '34', 'treinta y cinco': '35', 'treinta y seis': '36', 'treinta y siete': '37', 'treinta y ocho': '38', 'treinta y nueve': '39', 'cuarenta': '40',
    'cuarenta y uno': '41', 'cuarenta y dos': '42', 'cuarenta y tres': '43', 'cuarenta y cuatro': '44', 'cuarenta y cinco': '45', 'cuarenta y seis': '46', 'cuarenta y siete': '47', 'cuarenta y ocho': '48', 'cuarenta y nueve': '49', 'cincuenta': '50',
    'cincuenta y uno': '51', 'cincuenta y dos': '52', 'cincuenta y tres': '53', 'cincuenta y cuatro': '54', 'cincuenta y cinco': '55', 'cincuenta y seis': '56', 'cincuenta y siete': '57', 'cincuenta y ocho': '58', 'cincuenta y nueve': '59', 'sesenta': '60',
    'sesenta y uno': '61', 'sesenta y dos': '62', 'sesenta y tres': '63', 'sesenta y cuatro': '64', 'sesenta y cinco': '65', 'sesenta y seis': '66', 'sesenta y siete': '67', 'sesenta y ocho': '68', 'sesenta y nueve': '69', 'setenta': '70',
    'setenta y uno': '71', 'setenta y dos': '72', 'setenta y tres': '73', 'setenta y cuatro': '74', 'setenta y cinco': '75', 'setenta y seis': '76', 'setenta y siete': '77', 'setenta y ocho': '78', 'setenta y nueve': '79', 'ochenta': '80',
    'ochenta y uno': '81', 'ochenta y dos': '82', 'ochenta y tres': '83', 'ochenta y cuatro': '84', 'ochenta y cinco': '85', 'ochenta y seis': '86', 'ochenta y siete': '87', 'ochenta y ocho': '88', 'ochenta y nueve': '89', 'noventa': '90',
    'noventa y uno': '91', 'noventa y dos': '92', 'noventa y tres': '93', 'noventa y cuatro': '94', 'noventa y cinco': '95', 'noventa y seis': '96', 'noventa y siete': '97', 'noventa y ocho': '98', 'noventa y nueve': '99', 'cien': '100',
    'coma': '.', 'y medio': '.5', 'medio': '.5',

    // German (0-100)
    'null': '0', 'eins': '1', 'zwei': '2', 'drei': '3', 'vier': '4', 'fünf': '5', 'sechs': '6', 'sieben': '7', 'acht': '8', 'neun': '9', 'zehn': '10',
    'elf': '11', 'zwölf': '12', 'dreizehn': '13', 'vierzehn': '14', 'fünfzehn': '15', 'sechzehn': '16', 'siebzehn': '17', 'achtzehn': '18', 'neunzehn': '19', 'zwanzig': '20',
    'einundzwanzig': '21', 'zweiundzwanzig': '22', 'dreiundzwanzig': '23', 'vierundzwanzig': '24', 'fünfundzwanzig': '25', 'sechsundzwanzig': '26', 'siebenundzwanzig': '27', 'achtundzwanzig': '28', 'neunundzwanzig': '29', 'dreißig': '30',
    'einunddreißig': '31', 'zweiunddreißig': '32', 'dreiunddreißig': '33', 'vierunddreißig': '34', 'fünfunddreißig': '35', 'sechsunddreißig': '36', 'siebenunddreißig': '37', 'achtunddreißig': '38', 'neununddreißig': '39', 'vierzig': '40',
    'einundvierzig': '41', 'zweiundvierzig': '42', 'dreiundvierzig': '43', 'vierundvierzig': '44', 'fünfundvierzig': '45', 'sechsundvierzig': '46', 'siebenundvierzig': '47', 'achtundvierzig': '48', 'neunundvierzig': '49', 'fünfzig': '50',
    'einundfünfzig': '51', 'zweiundfünfzig': '52', 'dreiundfünfzig': '53', 'vierundfünfzig': '54', 'fünfundfünfzig': '55', 'sechsundfünfzig': '56', 'siebenundfünfzig': '57', 'achtundfünfzig': '58', 'neunundfünfzig': '59', 'sechzig': '60',
    'einundsechzig': '61', 'zweiundsechzig': '62', 'dreiundsechzig': '63', 'vierundsechzig': '64', 'fünfundsechzig': '65', 'sechsundsechzig': '66', 'siebenundsechzig': '67', 'achtundsechzig': '68', 'neunundsechzig': '69', 'siebzig': '70',
    'einundsiebzig': '71', 'zweiundsiebzig': '72', 'dreiundsiebzig': '73', 'vierundsiebzig': '74', 'fünfundsiebzig': '75', 'sechsundsiebzig': '76', 'siebenundsiebzig': '77', 'achtundsiebzig': '78', 'neunundsiebzig': '79', 'achtzig': '80',
    'einundachtzig': '81', 'zweiundachtzig': '82', 'dreiundachtzig': '83', 'vierundachtzig': '84', 'fünfundachtzig': '85', 'sechsundachtzig': '86', 'siebenundachtzig': '87', 'achtundachtzig': '88', 'neunundachtzig': '89', 'neunzig': '90',
    'einundneunzig': '91', 'zweiundneunzig': '92', 'dreiundneunzig': '93', 'vierundneunzig': '94', 'fünfundneunzig': '95', 'sechsundneunzig': '96', 'siebenundneunzig': '97', 'achtundneunzig': '98', 'neunundneunzig': '99', 'hundert': '100',
    'komma': '.', 'und ein halb': '.5', 'halb': '.5',

    // Russian (0-100)
    'ноль': '0', 'один': '1', 'два': '2', 'три': '3', 'четыре': '4', 'пять': '5', 'шесть': '6', 'семь': '7', 'восемь': '8', 'девять': '9', 'десять': '10',
    'одинадцать': '11', 'двенадцать': '12', 'тринадцать': '13', 'четырнадцать': '14', 'пятнадцать': '15', 'шестнадцать': '16', 'семнадцать': '17', 'восемнадцать': '18', 'девятнадцать': '19', 'двадцать': '20',
    'двадцать один': '21', 'двадцать два': '22', 'двадцать три': '23', 'двадцать четыре': '24', 'двадцать пять': '25', 'двадцать шесть': '26', 'двадцать семь': '27', 'двадцать восемь': '28', 'двадцать девять': '29', 'тридцать': '30',
    'тридцать один': '31', 'тридцать два': '32', 'тридцать три': '33', 'тридцать четыре': '34', 'тридцать пять': '35', 'тридцать шесть': '36', 'тридцать семь': '37', 'тридцать восемь': '38', 'тридцать девять': '39', 'сорок': '40',
    'сорок один': '41', 'сорок два': '42', 'сорок три': '43', 'сорок четыре': '44', 'сорок пять': '45', 'сорок шесть': '46', 'сорок семь': '47', 'сорок восемь': '48', 'сорок девять': '49', 'пятьдесят': '50',
    'пятьдесят один': '51', 'пятьдесят два': '52', 'пятьдесят три': '53', 'пятьдесят четыре': '54', 'пятьдесят пять': '55', 'пятьдесят шесть': '56', 'пятьдесят семь': '57', 'пятьдесят восемь': '58', 'пятьдесят девять': '59', 'шестьдесят': '60',
    'шестьдесят один': '61', 'шестьдесят два': '62', 'шестьдесят три': '63', 'шестьдесят четыре': '64', 'шестьдесят пять': '65', 'шестьдесят шесть': '66', 'шестьдесят семь': '67', 'шестьдесят восемь': '68', 'шестьдесят девять': '69', 'семьдесят': '70',
    'семьдесят один': '71', 'семьдесят два': '72', 'семьдесят три': '73', 'семьдесят четыре': '74', 'семьдесят пять': '75', 'семьдесят шесть': '76', 'семьдесят семь': '77', 'семьдесят восемь': '78', 'семьдесят девять': '79', 'восемьдесят': '80',
    'восемьдесят один': '81', 'восемьдесят два': '82', 'восемьдесят три': '83', 'восемьдесят четыре': '84', 'восемьдесят пять': '85', 'восемьдесят шесть': '86', 'восемьдесят семь': '87', 'восемьдесят восемь': '88', 'восемьдесят девять': '89', 'девяносто': '90',
    'девяносто один': '91', 'девяносто два': '92', 'девяносто три': '93', 'девяносто четыре': '94', 'девяносто пять': '95', 'девяносто шесть': '96', 'девяносто семь': '97', 'девяносто восемь': '98', 'девяносто девять': '99', 'сто': '100',
    'запятая': '.', 'и половина': '.5', 'с половиной': '.5', 'половина': '.5'
};

const stopWordsByLang = {
    'it': ['ferma', 'fermati'],
    'en': ['halt'],
    'fr': ['arrêter', 'arreter', 'arrête', 'arrete'],
    'es': ['parar', 'para'],
    'de': ['halt', 'stoppen', 'stopp'],
    'ru': ['стоп', 'хватит']
};

function processVoiceInput(text) {
    let lowerText = text.toLowerCase().trim();

    // Check for stop commands (Universal "stop" + localized words)
    const isStopUniversal = lowerText.includes('stop');
    const localizedStops = stopWordsByLang[state.lang] || [];
    const isStopLocalized = localizedStops.some(word => lowerText.includes(word));

    if (isStopUniversal || isStopLocalized) {
        stopVoiceRecording();
        return;
    }

    // Replace multi-word phrases first
    lowerText = lowerText.replace(/\b(e mezzo|and a half)\b/g, '.5');

    // Replace individual number words with digits
    const words = Object.keys(wordToNumberMap).sort((a, b) => b.length - a.length);
    words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        lowerText = lowerText.replace(regex, wordToNumberMap[word]);
    });

    // Cleanup spaces around dots or commas (e.g. "6 . 5" -> "6.5")
    lowerText = lowerText.replace(/\s*([.,])\s*/g, '$1');

    // Match numbers (including decimals with , or .)
    const numbers = lowerText.match(/\d+([.,]\d+)?/g);
    if (numbers) {
        numbers.forEach(numStr => {
            const num = parseFloat(numStr.replace(',', '.'));
            if (!isNaN(num)) {
                // Find first empty score or add new
                const emptyIdx = state.scores.findIndex(s => s === '' || s === null);
                if (emptyIdx !== -1) {
                    state.scores[emptyIdx] = num.toString();
                } else {
                    state.scores.push(num.toString());
                }
            }
        });
        renderScores();
        calculate();
        saveState();
    }
}

function startVoiceRecording() {
    if (!recognition) {
        alert(translations[state.lang].msgSpeechError || "Feature not supported");
        return;
    }

    // Set loading state
    elements.voiceToggle.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

    recognition.lang = state.lang === 'it' ? 'it-IT' : 'en-US';
    try {
        recognition.start();
    } catch (e) {
        console.error("Recognition start failed", e);
        elements.voiceToggle.innerHTML = '<i class="bi bi-mic-fill"></i>';
    }
}

function stopVoiceRecording() {
    isRecording = false; // Flag to stop auto-restart in onend
    if (recognition) {
        try { recognition.stop(); } catch (e) { }
    }
    stopAudioWave();
    elements.recordingModal.hide();
    if (elements.voiceToggle) {
        elements.voiceToggle.classList.remove('btn-danger', 'btn-recording');
        elements.voiceToggle.innerHTML = '<i class="bi bi-mic-fill"></i>';
    }
}

function initAudioWave() {
    const canvas = elements.audioWaveCanvas;
    const canvasCtx = canvas.getContext("2d");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = { audio: true };
        if (state.micId && state.micId !== 'default') {
            constraints.audio = { deviceId: { exact: state.micId } };
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                mediaStream = stream;
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                function draw() {
                    animationId = requestAnimationFrame(draw);
                    analyser.getByteTimeDomainData(dataArray);

                    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Match style.css background slightly
                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                    canvasCtx.lineWidth = 2;
                    canvasCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                    canvasCtx.beginPath();

                    let sliceWidth = canvas.width * 1.0 / bufferLength;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        let v = dataArray[i] / 128.0;
                        let y = v * canvas.height / 2;

                        if (i === 0) {
                            canvasCtx.moveTo(x, y);
                        } else {
                            canvasCtx.lineTo(x, y);
                        }

                        x += sliceWidth;
                    }

                    canvasCtx.lineTo(canvas.width, canvas.height / 2);
                    canvasCtx.stroke();
                }

                draw();
            })
            .catch(function (err) {
                console.error("Audio wave initialization failed: " + err);
                canvasCtx.fillStyle = "#ff6b6b";
                canvasCtx.fillText("Visualizer error", canvas.width / 2 - 40, canvas.height / 2);
            });
    }
}

function stopAudioWave() {
    if (animationId) cancelAnimationFrame(animationId);
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
    }
}

if (elements.voiceToggle) {
    elements.voiceToggle.addEventListener('click', () => {
        if (!isRecording) {
            startVoiceRecording();
        }
    });
}

if (elements.btnStopRecordingModal) {
    elements.btnStopRecordingModal.addEventListener('click', () => {
        stopVoiceRecording();
    });
}

if (elements.btnRestartRecordingModal) {
    elements.btnRestartRecordingModal.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    });
}

// Start
init();
