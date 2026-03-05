import { Audio } from 'expo-av';

const OVH_WHISPER_URL =
  'https://whisper-large-v3-turbo.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1/audio/transcriptions';
const OVH_TOKEN = process.env.EXPO_PUBLIC_OVH_WHISPER_TOKEN || '';

let recording: Audio.Recording | null = null;
let recordingStartTime: number = 0;

const MIN_RECORDING_MS = 600; // minimum 600ms to avoid empty/garbled audio

export async function startRecording(): Promise<void> {
  // If there's a stale recording, clean it up first
  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    recording = null;
  }

  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission not granted');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  recordingStartTime = Date.now();
}

export async function stopRecordingAndTranscribe(): Promise<string> {
  if (!recording) throw new Error('No active recording');

  // Ensure minimum recording duration for reliable transcription
  const elapsed = Date.now() - recordingStartTime;
  if (elapsed < MIN_RECORDING_MS) {
    const waitMs = MIN_RECORDING_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  // Small delay to flush audio buffer before stopping
  await new Promise((resolve) => setTimeout(resolve, 150));

  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  recording = null;

  if (!uri) throw new Error('No recording URI');

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  } as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'en');

  const response = await fetch(OVH_WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OVH_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`STT failed (${response.status}): ${err}`);
  }

  const result = await response.json();
  return (result.text ?? '').trim();
}

export function cancelRecording(): void {
  if (recording) {
    recording.stopAndUnloadAsync().catch(() => {});
    recording = null;
  }
}
