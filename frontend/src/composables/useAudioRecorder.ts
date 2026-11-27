// src/composables/useAudioRecorder.ts
import { ref, readonly, onMounted, onUnmounted } from 'vue';

export type AudioRecorderErrorCode =
  | 'unsupported'
  | 'insecure-context'
  | 'permission-denied'
  | 'device-not-found'
  | 'device-busy'
  | 'recording-error'
  | 'too-short';

export class AudioRecorderError extends Error {
  readonly code: AudioRecorderErrorCode;
  readonly originalError?: unknown;

  constructor(code: AudioRecorderErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'AudioRecorderError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface AudioRecorderOptions {
  /** Durata maximă a unei înregistrări în secunde (implicit 5 minute; 0 = nelimitat). */
  maxDurationSeconds?: number;
  /** Pragul minim în milisecunde pentru a trimite mesajul (implicit 300ms). */
  minDurationMs?: number;
  /** Numărul de bare pentru vizualizarea live din ChatInput (implicit 24). */
  barCount?: number;
  /** Numărul de bare pentru waveform-ul exportat în MessageBubble (implicit 32). */
  waveformBars?: number;
  /** Bitrate țintă în bps pentru voce (implicit 64 kbps). */
  audioBitsPerSecond?: number;
  /** Callback opțional pentru erori asincrone (ex. recorder.onerror, prea scurt). */
  onError?: (error: AudioRecorderError) => void;
}

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

// Compatibil cu TS < 5.7 (Uint8Array) și TS 5.7+ (Uint8Array<ArrayBuffer>)
type AnalyserDataArray = Parameters<AnalyserNode['getByteTimeDomainData']>[0];

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
] as const;

const SAMPLE_INTERVAL_MS = 50;
const TIMER_INTERVAL_MS = 200;
const MIN_BAR_PX = 4;
const MAX_BAR_PX = 36;
const FALLBACK_WAVEFORM_LEVEL = 12;

const checkRecorderSupport = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return Boolean(
    window.isSecureContext &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
  );
};

const getSupportedMimeType = (): string | undefined => {
  if (
    typeof MediaRecorder === 'undefined' ||
    typeof MediaRecorder.isTypeSupported !== 'function'
  ) {
    return undefined;
  }
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
};

const classifyStartError = (err: unknown): AudioRecorderError => {
  if (err instanceof AudioRecorderError) return err;

  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
      case 'SecurityError':
        return new AudioRecorderError(
          'permission-denied',
          'Microphone permission was denied.',
          err
        );
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return new AudioRecorderError('device-not-found', 'No microphone was found.', err);
      case 'NotReadableError':
      case 'TrackStartError':
      case 'AbortError':
        return new AudioRecorderError(
          'device-busy',
          'Microphone is currently in use by another application.',
          err
        );
      case 'NotSupportedError':
        return new AudioRecorderError(
          'unsupported',
          'Audio recording format is not supported by this browser.',
          err
        );
    }
  }

  return new AudioRecorderError('recording-error', 'Failed to start audio recording.', err);
};

const acquireAudioStream = async (): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
  } catch (err) {
    // Fallback pentru dispozitive/drivere care resping constrângeri explicite (ex. channelCount: 1)
    if (err instanceof DOMException && err.name === 'OverconstrainedError') {
      return navigator.mediaDevices.getUserMedia({ audio: true });
    }
    throw err;
  }
};

const createMediaRecorder = (
  stream: MediaStream,
  mimeType: string | undefined,
  audioBitsPerSecond: number
): MediaRecorder => {
  const attempts: MediaRecorderOptions[] = [];

  if (mimeType && audioBitsPerSecond > 0) {
    attempts.push({ mimeType, audioBitsPerSecond });
  }
  if (mimeType) {
    attempts.push({ mimeType });
  }
  if (audioBitsPerSecond > 0) {
    attempts.push({ audioBitsPerSecond });
  }

  for (const opts of attempts) {
    try {
      return new MediaRecorder(stream, opts);
    } catch {
      // Încercăm următoarea configurație mai permisivă
    }
  }

  return new MediaRecorder(stream);
};

/**
 * Transformă seria de niveluri RMS (0–100) capturate în timpul înregistrării într-un array
 * compact (ex. 32 bare) cu valori normalizate în intervalul 8–100 pentru UI.
 */
const buildExportWaveform = (samples: number[], targetBars: number): number[] => {
  if (targetBars <= 0) return [];
  if (samples.length === 0) return Array(targetBars).fill(FALLBACK_WAVEFORM_LEVEL);

  const buckets: number[] = [];

  if (samples.length >= targetBars) {
    const bucketSize = samples.length / targetBars;
    for (let i = 0; i < targetBars; i++) {
      const start = Math.floor(i * bucketSize);
      const end = Math.max(start + 1, Math.floor((i + 1) * bucketSize));

      let sum = 0;
      let peak = 0;
      let count = 0;

      for (let j = start; j < end && j < samples.length; j++) {
        const val = samples[j] ?? 0;
        sum += val;
        if (val > peak) peak = val;
        count++;
      }

      const avg = count > 0 ? sum / count : 0;
      // Combinație avg + peak pentru un profil dinamic al vocii (stil WhatsApp/Telegram)
      buckets.push(avg * 0.55 + peak * 0.45);
    }
  } else {
    // Interpolare liniară pentru mesaje foarte scurte (< 1.6s)
    const maxIdx = samples.length - 1;
    for (let i = 0; i < targetBars; i++) {
      const pos = targetBars === 1 ? 0 : (i / (targetBars - 1)) * maxIdx;
      const low = Math.floor(pos);
      const high = Math.min(maxIdx, Math.ceil(pos));
      const weight = pos - low;
      const left = samples[low] ?? 0;
      const right = samples[high] ?? left;
      buckets.push(left + (right - left) * weight);
    }
  }

  // Prag minim de referință (25) ca liniștea să nu fie amplificată artificial la 100%
  let referencePeak = 25;
  for (let i = 0; i < buckets.length; i++) {
    const val = buckets[i] ?? 0;
    if (val > referencePeak) referencePeak = val;
  }

  return buckets.map((val) =>
    Math.min(100, Math.max(8, Math.round((val / referencePeak) * 100)))
  );
};

export function useAudioRecorder(
  onStopCallback: (blob: Blob, duration: number, waveform: number[]) => void,
  options: AudioRecorderOptions = {}
) {
  const maxDurationSeconds = Math.max(0, options.maxDurationSeconds ?? 300);
  const minDurationMs = Math.max(0, options.minDurationMs ?? 300);
  const barCount = Math.max(1, Math.floor(options.barCount ?? 24));
  const waveformBars = Math.max(1, Math.floor(options.waveformBars ?? 32));
  const audioBitsPerSecond = Math.max(0, options.audioBitsPerSecond ?? 64000);

  const isSupported = ref(checkRecorderSupport());
  const isRecording = ref(false);
  const isPaused = ref(false);
  const isLocked = ref(false);
  const isCancelling = ref(false);
  const recordTime = ref(0);
  const audioFrequencies = ref<number[]>(Array(barCount).fill(MIN_BAR_PX));
  const error = ref<AudioRecorderError | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: BlobPart[] = [];
  let recordedLevels: number[] = [];

  // Ceas monotonic (imun la ajustări NTP / DST) cu suport Pause/Resume
  let accumulatedMs = 0;
  let segmentStartedAt = 0;

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let sampleInterval: ReturnType<typeof setInterval> | null = null;

  let isStarting = false;
  let isStopping = false;
  let isUnmounted = false;

  // Web Audio API
  let audioCtx: AudioContext | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let timeDomainData: AnalyserDataArray | null = null;
  let streamRef: MediaStream | null = null;

  const getElapsedMs = (): number => {
    if (segmentStartedAt === 0 || isPaused.value) return accumulatedMs;
    return accumulatedMs + Math.max(0, performance.now() - segmentStartedAt);
  };

  const freezeElapsedClock = () => {
    if (!isPaused.value && segmentStartedAt > 0) {
      accumulatedMs += Math.max(0, performance.now() - segmentStartedAt);
      segmentStartedAt = 0;
    }
  };

  const stopIntervals = () => {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (sampleInterval !== null) {
      clearInterval(sampleInterval);
      sampleInterval = null;
    }
  };

  const startIntervals = () => {
    stopIntervals();

    timerInterval = setInterval(() => {
      const elapsedMs = getElapsedMs();
      const elapsedSec = Math.floor(elapsedMs / 1000);
      recordTime.value =
        maxDurationSeconds > 0 ? Math.min(maxDurationSeconds, elapsedSec) : elapsedSec;

      if (maxDurationSeconds > 0 && elapsedMs >= maxDurationSeconds * 1000) {
        stop();
      }
    }, TIMER_INTERVAL_MS);

    if (analyser && timeDomainData) {
      sampleInterval = setInterval(() => {
        if (!analyser || !timeDomainData || isPaused.value) return;

        analyser.getByteTimeDomainData(timeDomainData);

        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const centered = ((timeDomainData[i] ?? 128) - 128) / 128;
          sumSquares += centered * centered;
        }

        const rms = Math.sqrt(sumSquares / timeDomainData.length);
        // Compresie perceptivă: vorbirea normală (RMS ~0.04–0.25) devine clară și dinamică
        const normalized = Math.min(1, Math.pow(rms * 3.2, 0.7));
        recordedLevels.push(Math.round(normalized * 100));

        // Fereastră glisantă (scrolling waveform) în intervalul 4px–36px
        const barHeight = Math.round(MIN_BAR_PX + normalized * (MAX_BAR_PX - MIN_BAR_PX));
        const nextBars = audioFrequencies.value.slice(1);
        nextBars.push(barHeight);
        audioFrequencies.value = nextBars;
      }, SAMPLE_INTERVAL_MS);
    }
  };

  const cleanup = () => {
    stopIntervals();

    isRecording.value = false;
    isPaused.value = false;
    isLocked.value = false;
    isCancelling.value = false;
    isStarting = false;
    isStopping = false;

    accumulatedMs = 0;
    segmentStartedAt = 0;
    recordTime.value = 0;
    audioFrequencies.value = Array(barCount).fill(MIN_BAR_PX);

    if (sourceNode) {
      try {
        sourceNode.disconnect();
      } catch {
        // Ignoră
      }
      sourceNode = null;
    }

    if (analyser) {
      try {
        analyser.disconnect();
      } catch {
        // Ignoră
      }
      analyser = null;
    }

    if (audioCtx) {
      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      audioCtx = null;
    }

    timeDomainData = null;

    if (streamRef) {
      streamRef.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      streamRef = null;
    }

    if (mediaRecorder) {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.onerror = null;
      mediaRecorder = null;
    }

    audioChunks = [];
    recordedLevels = [];
  };

  const reportError = (err: AudioRecorderError) => {
    error.value = err;
    options.onError?.(err);
  };

  const clearError = () => {
    error.value = null;
  };

  const stop = () => {
    // Dacă utilizatorul oprește cât timp getUserMedia() încă așteaptă permisiunea
    if (isStarting) {
      isCancelling.value = true;
      return;
    }

    // Protecție critică la dublu-click: nu distrugem chunk-urile cât timp onstop e în curs
    if (isStopping) return;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      isStopping = true;
      stopIntervals();
      freezeElapsedClock();
      try {
        mediaRecorder.stop();
      } catch {
        cleanup();
      }
    } else {
      cleanup();
    }
  };

  const cancel = () => {
    isCancelling.value = true;
    if (isStarting) return;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      isStopping = true;
      stopIntervals();
      try {
        mediaRecorder.stop();
      } catch {
        cleanup();
      }
    } else {
      cleanup();
    }
  };

  const pause = () => {
    if (
      !isRecording.value ||
      isPaused.value ||
      isStopping ||
      !mediaRecorder ||
      mediaRecorder.state !== 'recording' ||
      typeof mediaRecorder.pause !== 'function'
    ) {
      return;
    }

    try {
      mediaRecorder.pause();
    } catch {
      return;
    }

    freezeElapsedClock();
    isPaused.value = true;
    stopIntervals();
  };

  const resume = () => {
    if (
      !isRecording.value ||
      !isPaused.value ||
      isStopping ||
      !mediaRecorder ||
      mediaRecorder.state !== 'paused' ||
      typeof mediaRecorder.resume !== 'function'
    ) {
      return;
    }

    try {
      mediaRecorder.resume();
    } catch {
      return;
    }

    segmentStartedAt = performance.now();
    isPaused.value = false;
    startIntervals();
  };

  const lock = () => {
    if (isRecording.value) {
      isLocked.value = true;
    }
  };

  const start = async () => {
    if (isRecording.value || isStarting || isStopping || isUnmounted) return;

    error.value = null;

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const err = new AudioRecorderError(
        'insecure-context',
        'Audio recording requires a secure (HTTPS) context.'
      );
      reportError(err);
      throw err;
    }

    if (!checkRecorderSupport()) {
      const err = new AudioRecorderError(
        'unsupported',
        'Audio recording is not supported in this browser.'
      );
      reportError(err);
      throw err;
    }

    isStarting = true;
    isCancelling.value = false;

    // Creăm AudioContext sincron în handler-ul de click (înainte de await) pt. Safari/iOS
    const AudioContextCtor =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext
        : undefined;

    if (AudioContextCtor) {
      try {
        audioCtx = new AudioContextCtor();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      } catch {
        audioCtx = null;
      }
    }

    try {
      const stream = await acquireAudioStream();

      // Protecție la race condition: cancel/stop/unmount apelat în timp ce așteptam permisiunea
      if (isUnmounted || isCancelling.value) {
        stream.getTracks().forEach((track) => track.stop());
        cleanup();
        return;
      }

      streamRef = stream;

      // Oprire sigură dacă microfonul (USB/Bluetooth) este deconectat în timpul înregistrării
      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          if (!isRecording.value || isStopping) return;
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            stop();
          } else {
            // Browserul a oprit deja MediaRecorder; lăsăm onstop din coadă să emită blob-ul
            isStopping = true;
            stopIntervals();
            freezeElapsedClock();
          }
        };
      });

      const mimeType = getSupportedMimeType();
      const recorder = createMediaRecorder(stream, mimeType, audioBitsPerSecond);

      mediaRecorder = recorder;
      audioChunks = [];
      recordedLevels = [];

      // Conectare Web Audio API izolată — o eroare de vizualizator nu blochează înregistrarea
      if (audioCtx) {
        try {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
          sourceNode = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;
          sourceNode.connect(analyser);
          timeDomainData = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        } catch {
          if (sourceNode) {
            try {
              sourceNode.disconnect();
            } catch {
              // Ignoră
            }
            sourceNode = null;
          }
          if (audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
          }
          audioCtx = null;
          analyser = null;
          timeDomainData = null;
        }
      }

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      recorder.onerror = (event: Event) => {
        cleanup();
        reportError(
          new AudioRecorderError(
            'recording-error',
            'An error occurred during audio recording.',
            event
          )
        );
      };

      recorder.onstop = () => {
        const elapsedMs = getElapsedMs();
        const cancelled = isUnmounted || isCancelling.value;
        const chunksSnapshot = audioChunks.slice();
        const levelsSnapshot = recordedLevels.slice();
        const finalType = recorder.mimeType || mimeType || 'audio/webm';

        // Eliberăm microfonul și starea imediat înainte de callback-urile externe
        cleanup();

        if (cancelled) return;

        if (elapsedMs < minDurationMs) {
          reportError(
            new AudioRecorderError('too-short', 'Voice recording was too short.')
          );
          return;
        }

        const audioBlob = new Blob(chunksSnapshot, { type: finalType });
        if (audioBlob.size === 0) {
          reportError(
            new AudioRecorderError('recording-error', 'No audio data was captured.')
          );
          return;
        }

        const rawSeconds = Math.round(elapsedMs / 1000);
        const clampedSeconds =
          maxDurationSeconds > 0 ? Math.min(maxDurationSeconds, rawSeconds) : rawSeconds;
        const durationSeconds = Math.max(1, clampedSeconds);
        const waveform = buildExportWaveform(levelsSnapshot, waveformBars);
        onStopCallback(audioBlob, durationSeconds, waveform);
      };

      recorder.start();
      accumulatedMs = 0;
      segmentStartedAt = performance.now();
      isStarting = false;
      isStopping = false;
      isPaused.value = false;
      isRecording.value = true;
      isLocked.value = false;
      recordTime.value = 0;

      startIntervals();
    } catch (rawErr) {
      cleanup();
      const err = classifyStartError(rawErr);
      reportError(err);
      throw err;
    }
  };

  onMounted(() => {
    isSupported.value = checkRecorderSupport();
  });

  onUnmounted(() => {
    isUnmounted = true;
    isCancelling.value = true;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = null;
      mediaRecorder.onerror = null;
      mediaRecorder.ondataavailable = null;
      try {
        mediaRecorder.stop();
      } catch {
        // Ignoră dacă recorder-ul a fost deja invalidat
      }
    }
    cleanup();
  });

  return {
    start,
    stop,
    cancel,
    pause,
    resume,
    lock,
    clearError,
    isSupported: readonly(isSupported),
    isRecording: readonly(isRecording),
    isPaused: readonly(isPaused),
    isLocked: readonly(isLocked),
    isCancelling: readonly(isCancelling),
    recordTime: readonly(recordTime),
    audioFrequencies: readonly(audioFrequencies),
    error: readonly(error),
  };
}