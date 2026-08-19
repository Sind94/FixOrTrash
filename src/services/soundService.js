import { dataManager } from './dataManager';

class SoundService {
    constructor() {
        this.ctx = null;
    }

    _initContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _getVolume() {
        try {
            const settings = dataManager.getSync('settings') || {};
            // volume from 0 to 100, default 30
            const vol = settings.soundVolume !== undefined ? parseFloat(settings.soundVolume) : 30;
            return vol / 100;
        } catch (e) {
            return 0.3;
        }
    }

    _playTone(frequency, type, duration, volumeMultiplier = 1) {
        try {
            this._initContext();
            const volume = this._getVolume() * volumeMultiplier;
            if (volume <= 0) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            // Exponential decay
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio Context blocked or not supported:", e);
        }
    }

    playClick() {
        // High pitch, very short duration (tick)
        this._playTone(1200, 'sine', 0.05, 0.4);
    }

    playBeep() {
        // Medium pitch, short duration
        this._playTone(600, 'sine', 0.15, 0.8);
    }

    playSuccess() {
        // A gentle rising chime (C major arpeggio)
        try {
            this._initContext();
            const volume = this._getVolume();
            if (volume <= 0) return;

            const now = this.ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(volume * 0.3, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.3);
            });
        } catch (e) {
            console.warn("Audio Context success chime blocked:", e);
        }
    }
}

export const soundService = new SoundService();
