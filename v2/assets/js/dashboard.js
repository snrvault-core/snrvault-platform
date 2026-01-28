// v2/assets/js/dashboard.js
// Core dashboard helper (read-only, aman)

(function () {

  if (!window.SNR_ENV) {
    console.warn("SNR_ENV not loaded!");
    return;
  }

  window.SNR_DASHBOARD = {
    status() {
      return {
        mode: SNR_ENV.MODE,
        chain: SNR_ENV.CHAIN,
        token: SNR_ENV.TOKEN_SYMBOL,
        time: new Date().toISOString()
      };
    },

    log() {
      console.log("SNR Dashboard OK:", this.status());
    }
  };

  window.SNR_DASHBOARD.log();

})();
