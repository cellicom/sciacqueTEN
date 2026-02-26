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
    formatMode: 'half' // 'half' or 'decimal'
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
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    voiceToggle: document.getElementById('voiceToggle'),
    formatSwitch: document.getElementById('formatSwitch'),
    gradeFlipCard: document.getElementById('gradeFlipCard'),
    resSuggestedBackVal: document.getElementById('resSuggestedBackVal'),
    heartSurprise: document.getElementById('heartEasterEgg'),
    recordingModal: new bootstrap.Modal(document.getElementById('recordingModal')),
    audioWaveCanvas: document.getElementById('audioWaveCanvas'),
    rawVoiceDebug: document.getElementById('rawVoiceDebug'),
    btnStopRecordingModal: document.getElementById('btnStopRecordingModal'),
    html: document.documentElement
};

// Init
function init() {
    loadState();
    populateLangSelect();
    elements.maxScore.value = state.maxScore;
    renderScores();
    updateTranslations();
    applyTheme();
    applyFormatMode();
    calculate();
}

function populateLangSelect() {
    elements.langSelect.innerHTML = '';
    availableLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.label;
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

    elements.maxScore.placeholder = t.placeholderMax;
    elements.langSelect.value = state.lang;

    // Refresh scores list for input placeholders
    renderScores();
}

function applyTheme() {
    elements.html.setAttribute('data-theme', state.theme);
    elements.themeIcon.className = state.theme === 'light' ? 'bi bi-moon-fill fs-4' : 'bi bi-sun-fill fs-4';
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

elements.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveState();
});

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
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition already started or error restarting", e);
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
    'half': '.5', 'point': '.', 'dot': '.', 'and a half': '.5'
};

function processVoiceInput(text) {
    // Check for stop commands
    if (lowerText.includes('stop') || lowerText.includes('ferma') || lowerText.includes('fermati')) {
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
        navigator.mediaDevices.getUserMedia({ audio: true })
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

// Start
init();
