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

// Voice Recognition Setup
let recognition = null;
let isRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        processVoiceInput(transcript);
    };

    recognition.onend = () => {
        if (isRecording) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition already started or error restarting", e);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
            stopVoiceRecording();
        }
    };
} else {
    if (elements.voiceToggle) elements.voiceToggle.style.display = 'none';
}

function processVoiceInput(text) {
    const lowerText = text.toLowerCase().trim();

    // Check for stop commands
    if (lowerText.includes('stop') || lowerText.includes('ferma') || lowerText.includes('fermati')) {
        stopVoiceRecording();
        return;
    }

    // Match numbers (including decimals with , or .)
    const numbers = text.match(/\d+([.,]\d+)?/g);
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
    if (!recognition) return;
    isRecording = true;
    recognition.lang = state.lang === 'it' ? 'it-IT' : 'en-US';
    try {
        recognition.start();
    } catch (e) {
        console.error("Recognition already started", e);
    }
    if (elements.voiceToggle) {
        elements.voiceToggle.classList.add('btn-recording');
        elements.voiceToggle.title = translations[state.lang].voiceStop;
        elements.voiceToggle.innerHTML = '<i class="bi bi-mic-mute-fill"></i>';
    }
}

function stopVoiceRecording() {
    if (!recognition) return;
    isRecording = false;
    try {
        recognition.stop();
    } catch (e) {
        console.error("Recognition already stopped", e);
    }
    if (elements.voiceToggle) {
        elements.voiceToggle.classList.remove('btn-recording');
        elements.voiceToggle.title = translations[state.lang].voiceStart;
        elements.voiceToggle.innerHTML = '<i class="bi bi-mic-fill"></i>';
    }
}

if (elements.voiceToggle) {
    elements.voiceToggle.addEventListener('click', () => {
        if (isRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    });
}

// Start
init();
