// audio.js - SNR Sovereign Audio Experience System
class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = localStorage.getItem('snr_audio') !== 'false';
        this.initialized = false;
    }

    init() {
        if (!this.initialized) {
            this.ctx.resume();
            this.initialized = true;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('snr_audio', this.enabled);
        if(this.enabled) this.playTick();
        return this.enabled;
    }

    _playOscillator(type, freq, duration, vol=0.1, slideFreq=null) {
        if (!this.enabled || !this.ctx) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }
        
        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playTick() { this._playOscillator('sine', 800, 0.1, 0.05); }
    playClick() { this._playOscillator('triangle', 600, 0.15, 0.05); }
    playSuccess() { 
        this._playOscillator('sine', 440, 0.2, 0.1, 880);
        setTimeout(() => this._playOscillator('sine', 880, 0.4, 0.1), 100);
    }
    playError() {
        this._playOscillator('sawtooth', 200, 0.3, 0.05, 100);
    }
    playWalletConnect() {
        this._playOscillator('sine', 400, 0.2, 0.05);
        setTimeout(() => this._playOscillator('sine', 600, 0.3, 0.05), 150);
        setTimeout(() => this._playOscillator('sine', 1000, 0.4, 0.05), 300);
    }
    playOpenModal() { this._playOscillator('sine', 300, 0.2, 0.03, 600); }
    playCloseModal() { this._playOscillator('sine', 600, 0.2, 0.03, 300); }
}

const sysAudio = new AudioSystem();

// Hook Document Events
document.addEventListener('click', (e) => {
    sysAudio.init(); // Auto-init on first user interaction
    
    const target = e.target.closest('button, a, .glow-btn, .duration-btn, .tab-btn');
    if (!target) return;

    if (target.id === 'audio-toggle') {
        const isOn = sysAudio.toggle();
        target.innerHTML = isOn ? '?? Sound ON' : '?? Sound OFF';
        return;
    }

    if (target.classList.contains('tab-btn')) sysAudio.playTick();
    else if (target.hasAttribute('data-modal-open')) sysAudio.playOpenModal();
    else if (target.hasAttribute('data-modal-close')) sysAudio.playCloseModal();
    else sysAudio.playClick();
});

