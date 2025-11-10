const form = document.getElementById('translation-form');
const fileInput = document.getElementById('audio-file');
const targetSelect = document.getElementById('target-language');
const fileFeedback = document.getElementById('file-feedback');
const statusText = document.getElementById('form-status');
const submitButton = form.querySelector('.primary');
const resetButton = document.getElementById('reset-button');
const resultSection = document.getElementById('result-section');
const translationOutput = document.getElementById('translation-output');
const detectedLanguage = document.getElementById('detected-language');
const brandTagline = document.getElementById('brand-tagline');
const heroTitleEl = document.getElementById('hero-title');
const heroCopyEl = document.getElementById('hero-copy');
const targetLabelEl = document.getElementById('target-label');
const audioLabelEl = document.getElementById('audio-label');
const dropzoneTitleEl = document.getElementById('dropzone-title');
const dropzoneSubtitleEl = document.getElementById('dropzone-subtitle');
const translateButtonLabelEl = document.getElementById('translate-button-label');
const resultPillEl = document.getElementById('result-pill');
const footerHeadingEl = document.getElementById('footer-heading');
const footerCopyEl = document.getElementById('footer-copy');
const devSummaryEl = document.getElementById('dev-summary');
const devTipsList = document.getElementById('dev-tips');
const languageToggle = document.getElementById('language-toggle');
const languageMenu = document.getElementById('language-menu');
const languageControls = document.querySelector('.language-controls');
const languageButtons = Array.from(languageMenu?.querySelectorAll('.language-option') ?? []);
const burgerLines = Array.from(document.querySelectorAll('.language-toggle .burger-line'));
const languageLabel = document.querySelector('.language-label');

const API_ENDPOINT = '/api/translate';

const LANGUAGE_NATIVE_NAMES = {
  en: 'English',
  de: 'Deutsch',
  pl: 'Polski'
};

const UI_TEXT = {
  en: {
    pageTitle: 'Traislate — AI audio translation',
    brandTagline: 'AI audio translator',
    heroTitle: 'Upload audio from your phone or SmartWatch and get instant translations',
    heroCopy:
      'Thanks to OpenAI integration your recordings are automatically detected and translated into the language you choose. Crafted for mobile, polished for desktop.',
    targetLabel: 'Target language',
    audioLabel: 'Audio file',
    dropTitle: 'Drop a file or tap to browse',
    dropSubtitle: 'Works with phone and watch recordings (Apple Watch, WearOS). Max 60 MB.',
    translateButton: 'Translate recording',
    resetButton: 'Clear',
    resultTitle: 'Translation result',
    detectedLanguageLabel: 'Detected language',
    translationPlaceholder: 'Your translation will appear here.',
    footerHeading: 'How it works?',
    footerCopy:
      'Your audio file is sent to your ChatGPT integration. The model detects the source language, transcribes the speech, and translates it into the selected language. Traislate keeps up with you on the go—from phone to wearable.',
    devSummary: 'Developer tips',
    devTips: [
      'Expose an endpoint (e.g. <code>/api/translate</code>) that proxies requests to the OpenAI / ChatGPT API.',
      'Keep language detection on the server—only sanitized results should reach the client.',
      'Secure your API key with proper authorization; never ship it in the frontend.',
      'Consider caching translations and push notifications for wearables.'
    ],
    languageIndicator: 'LANG',
    status: {
      noFile: 'Choose an audio file first (MP3, M4A, WAV, CAF).',
      loading: 'Uploading and analyzing your recording…',
      success: 'Translation finished successfully.',
      demo: 'Could not reach the API. Displaying a demo translation.',
      readError: 'Unable to read the audio file.'
    },
    errors: {
      translationFailed: 'Unable to retrieve the translation.'
    },
    demo: {
      detectedLanguageName: 'Polish',
      translationIntro: (fileName, target) =>
        `Sample translation of the audio “${fileName}” into ${target}. This placeholder shows how the interface will look with real data.`,
      paragraph: target =>
        `This placeholder paragraph is translated into ${target} to illustrate how the transcript will be formatted once the live API responds.`,
      logHint: 'Demo translation rendered (offline mode).'
    },
    languageToggleLabel: 'Change language',
    languageNames: {
      en: 'English',
      de: 'German',
      pl: 'Polish'
    },
    emptyParagraphFallback: 'No textual data to display. Please try again.',
    confidenceText: value => `Language detection confidence: ${value}%`
  },
  de: {
    pageTitle: 'Traislate — KI-Audioübersetzung',
    brandTagline: 'KI-Audioübersetzer',
    heroTitle: 'Lade Audio von deinem Telefon oder deiner Uhr hoch und erhalte sofortige Übersetzungen',
    heroCopy:
      'Dank der ChatGPT-Integration werden deine Aufnahmen automatisch erkannt und in die gewünschte Sprache übersetzt. Für Mobilgeräte entworfen, auch am Desktop perfekt.',
    targetLabel: 'Zielsprache',
    audioLabel: 'Audiodatei',
    dropTitle: 'Datei ablegen oder tippen, um zu wählen',
    dropSubtitle: 'Unterstützt Aufnahmen von Telefon und Uhr (Apple Watch, WearOS). Max. 60 MB.',
    translateButton: 'Aufnahme übersetzen',
    resetButton: 'Leeren',
    resultTitle: 'Übersetzungsergebnis',
    detectedLanguageLabel: 'Erkannte Sprache',
    translationPlaceholder: 'Deine Übersetzung erscheint hier.',
    footerHeading: 'Wie funktioniert das?',
    footerCopy:
      'Die Audiodatei wird an deine ChatGPT-Integration gesendet. Das Modell erkennt die Ursprungssprache, transkribiert die Sprache und übersetzt sie in die gewählte Sprache. Traislate begleitet dich unterwegs – vom Handy bis zum Wearable.',
    devSummary: 'Tipps für Entwickler',
    devTips: [
      'Richte einen Endpoint (z.&nbsp;B. <code>/api/translate</code>) ein, der Anfragen an die OpenAI-/ChatGPT-API weiterleitet.',
      'Führe die Spracherkennung serverseitig aus; der Client erhält nur bereinigte Ergebnisse.',
      'Schütze deinen API-Schlüssel mit passender Authentifizierung – niemals im Frontend ausliefern.',
      'Denke über Caching der Übersetzungen und Push-Benachrichtigungen für Wearables nach.'
    ],
    languageIndicator: 'SPR',
    status: {
      noFile: 'Wähle zuerst eine Audiodatei aus (MP3, M4A, WAV, CAF).',
      loading: 'Aufnahme wird hochgeladen und analysiert…',
      success: 'Übersetzung erfolgreich abgeschlossen.',
      demo: 'API nicht erreichbar. Demo-Übersetzung wird angezeigt.',
      readError: 'Audiodatei konnte nicht gelesen werden.'
    },
    errors: {
      translationFailed: 'Übersetzung konnte nicht abgerufen werden.'
    },
    demo: {
      detectedLanguageName: 'Polnisch',
      translationIntro: (fileName, target) =>
        `Beispielübersetzung der Audiodatei „${fileName}“ ins ${target}. So sieht die Oberfläche mit echten Daten aus.`,
      paragraph: target =>
        `Dieser Platzhalterabsatz ist ins ${target} übersetzt und zeigt, wie das Transkript formatiert wird, sobald echte Daten eintreffen.`,
      logHint: 'Demo-Übersetzung angezeigt (Offline-Modus).'
    },
    languageToggleLabel: 'Sprache ändern',
    languageNames: {
      en: 'Englisch',
      de: 'Deutsch',
      pl: 'Polnisch'
    },
    emptyParagraphFallback: 'Keine Daten vorhanden. Versuche es erneut.',
    confidenceText: value => `Zuordnungssicherheit: ${value}%`
  },
  pl: {
    pageTitle: 'Traislate — Tłumaczenie audio z AI',
    brandTagline: 'AI tłumacz audio',
    heroTitle: 'Prześlij nagranie z telefonu lub zegarka i otrzymaj natychmiastowe tłumaczenie',
    heroCopy:
      'Dzięki integracji z OpenAI nagrania są automatycznie rozpoznawane i tłumaczone na wybrany język. Stworzone z myślą o mobile, dopracowane na desktopie.',
    targetLabel: 'Język docelowy',
    audioLabel: 'Plik audio',
    dropTitle: 'Upuść plik lub stuknij, aby wybrać',
    dropSubtitle: 'Obsługuje nagrania z telefonu i zegarka (Apple Watch, WearOS). Maks. 60 MB.',
    translateButton: 'Przetłumacz nagranie',
    resetButton: 'Wyczyść',
    resultTitle: 'Wynik tłumaczenia',
    detectedLanguageLabel: 'Wykryty język',
    translationPlaceholder: 'Twoje tłumaczenie pojawi się tutaj.',
    footerHeading: 'Jak to działa?',
    footerCopy:
      'Plik audio trafia do Twojej integracji z ChatGPT. Model rozpoznaje język źródłowy, transkrybuje mowę i tłumaczy ją na wskazany język. Traislate towarzyszy Ci w biegu — od telefonu po zegarek.',
    devSummary: 'Wskazówki dla deweloperów',
    devTips: [
      'Udostępnij endpoint, np. <code>/api/translate</code>, który pośredniczy w wywołaniach do OpenAI / ChatGPT.',
      'Detekcję języka pozostaw po stronie serwera — do klienta wysyłaj tylko oczyszczony wynik.',
      'Zabezpiecz klucz API odpowiednią autoryzacją; nigdy nie umieszczaj go we froncie.',
      'Rozważ buforowanie tłumaczeń i powiadomienia push dla urządzeń wearable.'
    ],
    languageIndicator: 'JEZ',
    status: {
      noFile: 'Najpierw wybierz plik audio (MP3, M4A, WAV, CAF).',
      loading: 'Ładowanie i analiza nagrania…',
      success: 'Tłumaczenie zakończone sukcesem.',
      demo: 'Nie udało się połączyć z API. Wyświetlono tłumaczenie demonstracyjne.',
      readError: 'Nie udało się odczytać pliku audio.'
    },
    errors: {
      translationFailed: 'Nie udało się pobrać tłumaczenia.'
    },
    demo: {
      detectedLanguageName: 'Polski',
      translationIntro: (fileName, target) =>
        `Przykładowe tłumaczenie nagrania „${fileName}” na język ${target}. Ten tekst pokazuje docelowy układ.`,
      paragraph: target =>
        `To demonstracyjny akapit przetłumaczony na język ${target}. Pokazuje finalne formatowanie transkrypcji, które zobaczysz po uzyskaniu odpowiedzi API.`,
      logHint: 'Wyświetlono tłumaczenie demonstracyjne (tryb offline).'
    },
    languageToggleLabel: 'Zmień język',
    languageNames: {
      en: 'Angielski',
      de: 'Niemiecki',
      pl: 'Polski'
    },
    emptyParagraphFallback: 'Brak treści do wyświetlenia. Spróbuj ponownie.',
    confidenceText: value => `Pewność detekcji języka: ${value}%`
  }
};

let currentLocale = 'en';
let lastDetectedLanguageValue = '—';
let lastStatusKey = null;
let lastStatusTone = 'neutral';
let userModifiedTarget = false;

const getLocaleText = (locale, path) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), UI_TEXT[locale]);

const t = path => getLocaleText(currentLocale, path);

const formatBytes = bytes => {
  const thresh = 1024;
  if (!bytes) return '0 B';
  if (Math.abs(bytes) < thresh) {
    return `${bytes.toFixed(0)} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let u = -1;
  let value = bytes;
  do {
    value /= thresh;
    ++u;
  } while (Math.abs(value) >= thresh && u < units.length - 1);
  return `${value.toFixed(1)} ${units[u]}`;
};

const setStatus = (message, tone = 'neutral', key = null) => {
  if (!message) {
    statusText.textContent = '';
    delete statusText.dataset.tone;
    lastStatusKey = null;
    return;
  }
  statusText.dataset.tone = tone;
  statusText.textContent = message;
  lastStatusKey = key;
  lastStatusTone = tone;
};

const setStatusFromKey = (key, tone = 'neutral') => {
  const message = getLocaleText(currentLocale, `status.${key}`) ?? '';
  setStatus(message, tone, key);
};

const toggleSubmitting = isSubmitting => {
  submitButton.disabled = isSubmitting;
  submitButton.dataset.state = isSubmitting ? 'loading' : 'idle';
};

const readFileAsBase64 = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] ?? '';
        resolve(base64);
      } else if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result);
        let binary = '';
        bytes.forEach(byte => {
          binary += String.fromCharCode(byte);
        });
        resolve(btoa(binary));
      } else {
        reject(new Error('READ_ERROR'));
      }
    };
    reader.onerror = () => reject(new Error('READ_ERROR'));
    reader.readAsDataURL(file);
  });

const inferAudioFormat = ({ name, type }) => {
  if (type?.startsWith('audio/')) {
    const subtype = type.split('/')[1];
    if (subtype) return subtype.replace('x-', '');
  }
  const extension = name?.split('.').pop();
  return extension?.toLowerCase() ?? 'mpeg';
};

const getLanguageDisplayName = (locale, code) =>
  getLocaleText(locale, `languageNames.${code}`) ?? LANGUAGE_NATIVE_NAMES[code] ?? code.toUpperCase();

const applyDemoTranslation = async (file, targetLang) => {
  await new Promise(resolve => setTimeout(resolve, 650));
  const languageName = getLanguageDisplayName(currentLocale, targetLang);
  const demo = t('demo');
  return {
    translation: demo.translationIntro(file.name, languageName),
    paragraphs: [demo.paragraph(languageName)],
    detectedLanguage: demo.detectedLanguageName,
    confidence: 0.87,
    demo: true
  };
};

const updateDetectedLanguageLabel = () => {
  detectedLanguage.textContent = `${t('detectedLanguageLabel')}: ${lastDetectedLanguageValue}`;
};

const presentResult = result => {
  lastDetectedLanguageValue = result.detectedLanguage ?? '—';
  updateDetectedLanguageLabel();
  translationOutput.innerHTML = '';

  let paragraphs = [];

  if (Array.isArray(result.paragraphs) && result.paragraphs.length) {
    paragraphs = result.paragraphs;
  } else if (typeof result.translation === 'string') {
    paragraphs = result.translation
      .split(/\n{2,}/)
      .map(text => text.trim())
      .filter(Boolean);
  }

  if (!paragraphs.length) {
    paragraphs = [t('emptyParagraphFallback')];
  }

  paragraphs
    .filter(Boolean)
    .forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      translationOutput.appendChild(paragraph);
    });

  if (result.confidence) {
    const meta = document.createElement('p');
    meta.className = 'result-meta';
    const confidenceValue = Math.round(result.confidence * 100);
    const confidenceText = t('confidenceText')?.(confidenceValue) ?? `Confidence: ${confidenceValue}%`;
    meta.textContent = confidenceText;
    translationOutput.appendChild(meta);
  }

  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const setDevTips = tips => {
  devTipsList.innerHTML = '';
  tips.forEach(text => {
    const li = document.createElement('li');
    li.innerHTML = text;
    devTipsList.appendChild(li);
  });
};

const updateTargetOptions = () => {
  Array.from(targetSelect.options).forEach(option => {
    option.textContent = getLanguageDisplayName(currentLocale, option.value);
  });
};

const applyLocale = locale => {
  if (!UI_TEXT[locale]) return;
  const previousLocale = currentLocale;
  currentLocale = locale;
  document.documentElement.lang = locale;
  document.title = t('pageTitle');

  brandTagline.textContent = t('brandTagline');
  heroTitleEl.textContent = t('heroTitle');
  heroCopyEl.textContent = t('heroCopy');
  targetLabelEl.textContent = t('targetLabel');
  audioLabelEl.textContent = t('audioLabel');
  dropzoneTitleEl.textContent = t('dropTitle');
  dropzoneSubtitleEl.textContent = t('dropSubtitle');
  translateButtonLabelEl.textContent = t('translateButton');
  resetButton.textContent = t('resetButton');
  resultPillEl.textContent = t('resultTitle');
  footerHeadingEl.textContent = t('footerHeading');
  footerCopyEl.textContent = t('footerCopy');
  devSummaryEl.textContent = t('devSummary');
  if (languageToggle) {
    const toggleLabel = t('languageToggleLabel');
    languageToggle.setAttribute('aria-label', toggleLabel);
    languageToggle.setAttribute('title', toggleLabel);
  }

  languageButtons.forEach(button => {
    const localeCode = button.dataset.locale;
    const buttonLabel = LANGUAGE_NATIVE_NAMES[localeCode] ?? localeCode.toUpperCase();
    button.textContent = buttonLabel;
  });

  const indicatorLabel = t('languageIndicator') ?? 'LANG';
  burgerLines.forEach(line => {
    line.dataset.label = indicatorLabel;
  });
  if (languageLabel) {
    languageLabel.dataset.label = indicatorLabel;
    languageLabel.textContent = indicatorLabel;
  }

  updateTargetOptions();

  if (targetSelect) {
    const hasLocaleOption = Array.from(targetSelect.options).some(option => option.value === locale);
    if (
      hasLocaleOption &&
      (!userModifiedTarget ||
        targetSelect.value === previousLocale ||
        !targetSelect.value ||
        !Array.from(targetSelect.options).some(option => option.value === targetSelect.value))
    ) {
      targetSelect.value = locale;
      userModifiedTarget = false;
    }
  }

  setDevTips(t('devTips'));
  updateDetectedLanguageLabel();

  if (resultSection.hidden) {
    translationOutput.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.id = 'translation-placeholder';
    placeholder.textContent = t('translationPlaceholder');
    translationOutput.appendChild(placeholder);
  } else {
    const placeholder = document.getElementById('translation-placeholder');
    if (placeholder) {
      placeholder.textContent = t('translationPlaceholder');
    }
  }

  if (lastStatusKey) {
    const message = getLocaleText(currentLocale, `status.${lastStatusKey}`) ?? '';
    setStatus(message, lastStatusTone, lastStatusKey);
  }

  setActiveLanguageButton(locale);
};

const setActiveLanguageButton = locale => {
  languageButtons.forEach(button => {
    const isActive = button.dataset.locale === locale;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

const closeLanguageMenu = () => {
  if (!languageMenu) return;
  languageMenu.hidden = true;
  languageToggle.setAttribute('aria-expanded', 'false');
  if (languageControls) {
    languageControls.dataset.open = 'false';
  }
};

const openLanguageMenu = () => {
  if (!languageMenu) return;
  languageMenu.hidden = false;
  languageToggle.setAttribute('aria-expanded', 'true');
  if (languageControls) {
    languageControls.dataset.open = 'true';
  }
};

const toggleLanguageMenu = () => {
  if (!languageMenu) return;
  if (languageMenu.hidden) {
    openLanguageMenu();
  } else {
    closeLanguageMenu();
  }
};

const handleLanguageSelection = locale => {
  applyLocale(locale);
  closeLanguageMenu();
};

const handleTranslation = async event => {
  event.preventDefault();
  const file = fileInput.files?.[0];
  if (!file) {
    setStatusFromKey('noFile', 'error');
    return;
  }

  setStatusFromKey('loading', 'pending');
  toggleSubmitting(true);

  let base64Audio;
  try {
    base64Audio = await readFileAsBase64(file);
  } catch (error) {
    if (error.message === 'READ_ERROR') {
      setStatusFromKey('readError', 'error');
    } else {
      setStatus(error.message || getLocaleText(currentLocale, 'status.readError'), 'error');
    }
    toggleSubmitting(false);
    return;
  }

  const payload = {
    fileName: file.name,
    mimeType: file.type,
    base64Audio,
    targetLanguage: targetSelect.value,
    audioFormat: inferAudioFormat(file)
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || getLocaleText(currentLocale, 'errors.translationFailed'));
    }

    const result = await response.json();
    presentResult(result);
    setStatusFromKey('success', 'success');
  } catch (error) {
    console.warn('Falling back to demo translation:', error);
    const demoResult = await applyDemoTranslation(file, targetSelect.value);
    presentResult(demoResult);
    setStatusFromKey('demo', 'warning');
    console.info(t('demo.logHint'));
  } finally {
    toggleSubmitting(false);
  }
};

const handleFileChange = () => {
  const file = fileInput.files?.[0];
  if (!file) {
    fileFeedback.textContent = '';
    return;
  }

  const safeName = file.name.length > 42 ? `${file.name.slice(0, 39)}…` : file.name;
  fileFeedback.textContent = `${safeName} (${formatBytes(file.size)})`;
};

const handleReset = () => {
  form.reset();
  if (targetSelect) {
    const hasLocaleOption = Array.from(targetSelect.options).some(option => option.value === currentLocale);
    if (hasLocaleOption) {
      targetSelect.value = currentLocale;
    }
    userModifiedTarget = false;
  }
  fileFeedback.textContent = '';
  translationOutput.innerHTML = '';
  const placeholder = document.createElement('p');
  placeholder.id = 'translation-placeholder';
  placeholder.textContent = t('translationPlaceholder');
  translationOutput.appendChild(placeholder);
  lastDetectedLanguageValue = '—';
  updateDetectedLanguageLabel();
  resultSection.hidden = true;
  setStatus('');
};

const initDragAndDrop = () => {
  const dropzone = document.querySelector('.dropzone');
  if (!dropzone) return;

  const preventDefaults = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  dropzone.addEventListener('dragover', () => dropzone.classList.add('is-drag-over'));
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-drag-over'));
  dropzone.addEventListener('drop', event => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      fileInput.files = event.dataTransfer.files;
      handleFileChange();
    }
    dropzone.classList.remove('is-drag-over');
  });
};

if (fileInput) {
  fileInput.addEventListener('change', handleFileChange);
}

if (targetSelect) {
  targetSelect.addEventListener('change', () => {
    userModifiedTarget = true;
  });
}

form.addEventListener('submit', handleTranslation);
resetButton.addEventListener('click', handleReset);

if (languageToggle) {
  languageToggle.addEventListener('click', toggleLanguageMenu);
}

languageButtons.forEach(button => {
  button.addEventListener('click', () => handleLanguageSelection(button.dataset.locale));
});

if (languageControls) {
  languageControls.dataset.open = 'false';
}

document.addEventListener('click', event => {
  if (!languageControls) {
    return;
  }
  if (!languageControls.contains(event.target)) {
    closeLanguageMenu();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeLanguageMenu();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    submitButton.blur();
  }
});

initDragAndDrop();
applyLocale(currentLocale);
