'use strict';

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;

const loadEnvFile = () => {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const fileContent = fs.readFileSync(envPath, 'utf8');
  fileContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, '\n');

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
};

loadEnvFile();

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const MAX_REQUEST_SIZE = 60 * 1024 * 1024; // 60 MB
const DEFAULT_TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';
const TRANSLATION_MODEL = 'gpt-4o-mini';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const knownLanguages = {
  pl: 'polish',
  en: 'english',
  de: 'german',
  fr: 'french',
  es: 'spanish',
  it: 'italian'
};

const serveFile = (filePath, res) => {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Nie znaleziono');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Błąd serwera');
      }
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const sendJson = (res, statusCode, payload) => {
  if (!res.headersSent) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (!res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
  res.end(JSON.stringify(payload));
};

const collectBody = (req, limitBytes) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;

    req.on('data', chunk => {
      received += chunk.length;
      if (received > limitBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', error => {
      reject(error);
    });
  });

const callOpenAIResponses = payload =>
  new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('Brak klucza OPENAI_API_KEY w zmiennych środowiskowych.'));
      return;
    }

    const data = JSON.stringify(payload);

    const request = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/responses',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(data),
          'OpenAI-Beta': 'responses=v1'
        }
      },
      response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`OpenAI error (${response.statusCode}): ${body}`));
            return;
          }

          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (error) {
            reject(new Error(`Nie udało się zdekodować odpowiedzi OpenAI: ${error.message}`));
          }
        });
      }
    );

    request.on('error', error => reject(error));
    request.write(data);
    request.end();
  });

const transcribeAudio = ({ buffer, fileName, mimeType }) =>
  new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('Brak klucza OPENAI_API_KEY w zmiennych środowiskowych.'));
      return;
    }

    const boundary = `----TraislateBoundary${Date.now()}`;

    const parts = [
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="model"\r\n\r\n'),
      Buffer.from(`${DEFAULT_TRANSCRIBE_MODEL}\r\n`),
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="response_format"\r\n\r\n'),
      Buffer.from('json\r\n'),
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="temperature"\r\n\r\n'),
      Buffer.from('0\r\n'),
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(
        `Content-Disposition: form-data; name="file"; filename="${fileName || 'audio-file'}"\r\n`
      ),
      Buffer.from(`Content-Type: ${mimeType || 'audio/mpeg'}\r\n\r\n`),
      buffer,
      Buffer.from('\r\n'),
      Buffer.from(`--${boundary}--\r\n`)
    ];

    const payload = Buffer.concat(parts);

    const request = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length
        }
      },
      response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`OpenAI transcription error (${response.statusCode}): ${body}`));
            return;
          }

          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (error) {
            reject(new Error(`Nie udało się zdekodować odpowiedzi transkrypcji: ${error.message}`));
          }
        });
      }
    );

    request.on('error', error => reject(error));
    request.write(payload);
    request.end();
  });

const buildOpenAIPayload = ({ transcript, originalLanguage, targetLanguage }) => {
  const normalizedTarget =
    knownLanguages[targetLanguage] ?? targetLanguage ?? 'english';

  return {
    model: TRANSLATION_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              'You are a precise assistant that transcribes audio, detects the spoken language, ' +
              'and translates the transcript into a requested target language. Return concise, well formatted output.'
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              `The original language is "${originalLanguage}". Translate the following transcript into ${normalizedTarget}. ` +
              'Return a fluent, well-structured translation and include the detected language with a confidence between 0 and 1.'
          },
          {
            type: 'input_text',
            text:
              'Respond strictly in JSON with keys: detectedLanguage (string), translation (string), paragraphs (array of strings), confidence (number).'
          },
          {
            type: 'input_text',
            text: `Transcript:\n${transcript}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'translation_result',
        schema: {
          type: 'object',
          required: ['detectedLanguage', 'translation', 'paragraphs', 'confidence'],
          additionalProperties: false,
          properties: {
            detectedLanguage: { type: 'string' },
            translation: { type: 'string' },
            paragraphs: {
              type: 'array',
              items: { type: 'string' }
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1
            }
          }
        }
      }
    }
  };
};

const handleTranslate = async (req, res) => {
  try {
    const bodyText = await collectBody(req, MAX_REQUEST_SIZE);
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (error) {
      sendJson(res, 400, { error: 'Nieprawidłowy JSON w zapytaniu.' });
      return;
    }

    const { base64Audio, targetLanguage, audioFormat, fileName, mimeType } = payload;
    if (!base64Audio || typeof base64Audio !== 'string') {
      sendJson(res, 400, { error: 'Brak danych audio w formacie Base64.' });
      return;
    }

    if (!targetLanguage) {
      sendJson(res, 400, { error: 'Określ docelowy język tłumaczenia.' });
      return;
    }

    let audioBuffer;
    try {
      audioBuffer = Buffer.from(base64Audio, 'base64');
    } catch (error) {
      sendJson(res, 400, { error: 'Nie udało się zdekodować danych audio.' });
      return;
    }

    if (!audioBuffer || !audioBuffer.length) {
      sendJson(res, 400, { error: 'Pusty plik audio.' });
      return;
    }

    if (audioBuffer.length > MAX_REQUEST_SIZE) {
      sendJson(res, 413, { error: 'Plik audio jest zbyt duży.' });
      return;
    }

    let transcription;
    try {
      const safeFileName = fileName || `upload.${audioFormat || 'mp3'}`;
      const sanitizedFileName = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const effectiveMimeType =
        mimeType || (audioFormat ? `audio/${audioFormat.replace(/^x-/, '')}` : 'audio/mpeg');

      transcription = await transcribeAudio({
        buffer: audioBuffer,
        fileName: sanitizedFileName,
        mimeType: effectiveMimeType
      });
    } catch (error) {
      console.error('[transcription] Error:', error);
      sendJson(res, 502, { error: 'Błąd transkrypcji audio.', details: error.message });
      return;
    }

    const transcriptText = transcription?.text?.trim?.();
    if (!transcriptText) {
      sendJson(res, 502, { error: 'Transkrypcja nie zwróciła tekstu.' });
      return;
    }

    const detectedLanguage = transcription.language ?? 'unknown';

    const openaiPayload = buildOpenAIPayload({
      transcript: transcriptText,
      originalLanguage: detectedLanguage,
      targetLanguage
    });
    const openaiResponse = await callOpenAIResponses(openaiPayload);

    const textOutput =
      openaiResponse?.output?.[0]?.content?.[0]?.text ??
      openaiResponse?.output_text ??
      null;

    if (!textOutput) {
      sendJson(res, 502, { error: 'Brak danych wyjściowych z OpenAI.' });
      return;
    }

    let result;
    try {
      result = JSON.parse(textOutput);
    } catch (error) {
      sendJson(res, 502, { error: 'Nie udało się sparsować odpowiedzi OpenAI.' });
      return;
    }

    if (!Array.isArray(result.paragraphs) || !result.paragraphs.length) {
      if (typeof result.translation === 'string') {
        result.paragraphs = result.translation
          .split(/\n{2,}/)
          .map(part => part.trim())
          .filter(Boolean);
      } else {
        result.paragraphs = [];
      }
    }

    sendJson(res, 200, result);
  } catch (error) {
    console.error('[translate] Error:', error);
    sendJson(res, 500, { error: 'Wystąpił błąd serwera.', details: error.message });
  }
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/translate') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    handleTranslate(req, res);
    return;
  }

  const requestedPath = decodeURIComponent(
    new URL(req.url, `http://${req.headers.host}`).pathname
  );
  let safePath = path.normalize(requestedPath);
  if (safePath === path.sep) {
    safePath = '/index.html';
  }
  if (safePath.includes('..')) {
    sendJson(res, 400, { error: 'Niedozwolona ścieżka.' });
    return;
  }

  const relativePath = safePath.startsWith(path.sep) ? safePath.slice(1) : safePath;
  const filePath = path.join(ROOT_DIR, relativePath);

  fs.stat(filePath, (error, stats) => {
    if (error) {
      serveFile(path.join(ROOT_DIR, 'index.html'), res);
      return;
    }

    if (stats.isDirectory()) {
      serveFile(path.join(filePath, 'index.html'), res);
    } else {
      serveFile(filePath, res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Traislate serwer lokalny działa na http://localhost:${PORT}`);
});
