import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "audio", "bbbbb.wav");
const sampleRate = 44_100;
const pulseDuration = 0.18;
const gapDuration = 0.08;
const frequencies = [523.25, 659.25, 783.99, 659.25, 523.25];
const samplesPerPulse = Math.floor(sampleRate * pulseDuration);
const samplesPerGap = Math.floor(sampleRate * gapDuration);
const totalSamples = frequencies.length * samplesPerPulse + (frequencies.length - 1) * samplesPerGap;
const pcm = Buffer.alloc(totalSamples * 2);

let sampleIndex = 0;

for (const frequency of frequencies) {
  for (let i = 0; i < samplesPerPulse; i += 1) {
    const attack = Math.min(1, i / (sampleRate * 0.012));
    const release = Math.min(1, (samplesPerPulse - i) / (sampleRate * 0.025));
    const envelope = Math.min(attack, release);
    const value = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.34 * envelope;
    pcm.writeInt16LE(Math.round(value * 32_767), sampleIndex * 2);
    sampleIndex += 1;
  }

  if (frequency !== frequencies.at(-1)) {
    sampleIndex += samplesPerGap;
  }
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, Buffer.concat([header, pcm]));
console.log(`Generated ${outputPath} (${(pcm.length + header.length).toLocaleString()} bytes)`);

