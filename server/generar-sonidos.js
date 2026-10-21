/**
 * Generador de Sonidos de Notificación de Alto Impacto para DEVFORGE CRM
 * Crea archivos WAV PCM 16-bit 44.1kHz nítidos y de alto volumen
 * para que se escuchen fuerte y claro en cualquier altavoz o laptop.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function crearBufferWav(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(intSample), offset);
    offset += 2;
  }
  return buffer;
}

const sampleRate = 44100;

// 1. Sonido de WhatsApp (Doble campana resonante de alta potencia: 659Hz -> 880Hz)
function generarSonidoWhatsApp() {
  const duracionTotal = 0.52;
  const totalSamples = Math.floor(sampleRate * duracionTotal);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    if (t < 0.11) {
      // Primer pulso (E5 - 659.25Hz)
      const attack = Math.min(1, t * 400);
      const decay = Math.exp(-t * 18);
      const f1 = 659.25;
      s = attack * decay * (
        Math.sin(2 * Math.PI * f1 * t) * 0.65 +
        Math.sin(2 * Math.PI * f1 * 2 * t) * 0.25 +
        Math.sin(2 * Math.PI * f1 * 3 * t) * 0.10
      );
    } else {
      // Segundo pulso (A5 - 880Hz con mayor presencia y brillo)
      const t2 = t - 0.10;
      const attack = Math.min(1, t2 * 400);
      const decay = Math.exp(-t2 * 8.5);
      const f2 = 880.0;
      s = attack * decay * (
        Math.sin(2 * Math.PI * f2 * t2) * 0.65 +
        Math.sin(2 * Math.PI * f2 * 2 * t2) * 0.25 +
        Math.sin(2 * Math.PI * f2 * 3 * t2) * 0.10
      );
    }
    samples[i] = s * 0.96; // Volumen alto y nítido
  }
  return crearBufferWav(samples, sampleRate);
}

// 2. Sonido de Correo (Acorde brillante ascendente de alta audibilidad: F5 -> A5 -> C6)
function generarSonidoCorreo() {
  const duracionTotal = 0.58;
  const totalSamples = Math.floor(sampleRate * duracionTotal);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    if (t < 0.08) {
      const attack = Math.min(1, t * 500);
      const decay = Math.exp(-t * 22);
      const f = 698.46; // F5
      s = attack * decay * (Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t) * 0.3);
    } else if (t < 0.18) {
      const t2 = t - 0.07;
      const attack = Math.min(1, t2 * 500);
      const decay = Math.exp(-t2 * 18);
      const f = 880.0; // A5
      s = attack * decay * (Math.sin(2 * Math.PI * f * t2) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t2) * 0.3);
    } else {
      const t3 = t - 0.16;
      const attack = Math.min(1, t3 * 400);
      const decay = Math.exp(-t3 * 7.5);
      const f = 1046.5; // C6 campana cristalina
      s = attack * decay * (
        Math.sin(2 * Math.PI * f * t3) * 0.65 +
        Math.sin(2 * Math.PI * f * 2 * t3) * 0.25 +
        Math.sin(2 * Math.PI * f * 3 * t3) * 0.10
      );
    }
    samples[i] = s * 0.96;
  }
  return crearBufferWav(samples, sampleRate);
}

// Directorios destino: server/data/sounds y public/sounds
const dirs = [
  path.join(__dirname, 'data', 'sounds'),
  path.join(__dirname, '..', 'public', 'sounds'),
];

for (const d of dirs) {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
}

const wavWhatsApp = generarSonidoWhatsApp();
const wavCorreo = generarSonidoCorreo();

for (const d of dirs) {
  fs.writeFileSync(path.join(d, 'whatsapp-notificacion.wav'), wavWhatsApp);
  fs.writeFileSync(path.join(d, 'correo-notificacion.wav'), wavCorreo);
}

console.log('✅ Archivos de audio generados en:');
dirs.forEach((d) => console.log('   • ' + d));
