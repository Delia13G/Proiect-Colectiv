import { ref, onUnmounted } from 'vue';

export function useAudioRecorder(onStopCallback: (blob: Blob, duration: number) => void) {
  const isRecording = ref(false);
  const isLocked = ref(false);
  const isCancelling = ref(false);
  const recordTime = ref(0);
  const audioFrequencies = ref<number[]>(Array(24).fill(4)); // Barele pentru waveform

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: BlobPart[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  
  // Web Audio API
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let animationFrame: number | null = null;
  let streamRef: MediaStream | null = null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef = stream;
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      // Setăm Audio Context pentru Waveform Real-time
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Frecvențe mai puține, perfecte pentru UI
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateWaveform = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const freqs = [];
        // Extragem 24 de puncte pentru UI
        for (let i = 0; i < 24; i++) {
          const value = Math.max(4, dataArray[i] / 4); // Scalăm pentru CSS (minim 4px)
          freqs.push(value);
        }
        audioFrequencies.value = freqs;
        animationFrame = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (!isCancelling.value && recordTime.value > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          onStopCallback(audioBlob, recordTime.value);
        }
        cleanup();
      };

      mediaRecorder.start();
      isRecording.value = true;
      isLocked.value = false;
      isCancelling.value = false;
      recordTime.value = 0;
      timer = setInterval(() => recordTime.value++, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Te rog să acorzi permisiunea pentru microfon.");
    }
  };

  const stop = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const cancel = () => {
    isCancelling.value = true;
    stop();
  };

  const lock = () => {
    isLocked.value = true;
  };

  const cleanup = () => {
    isRecording.value = false;
    isLocked.value = false;
    isCancelling.value = false;
    if (timer) clearInterval(timer);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (audioCtx) audioCtx.close();
    if (streamRef) streamRef.getTracks().forEach(t => t.stop());
    audioCtx = null;
    analyser = null;
  };

  onUnmounted(cleanup);

  return { start, stop, cancel, lock, isRecording, isLocked, isCancelling, recordTime, audioFrequencies };
}