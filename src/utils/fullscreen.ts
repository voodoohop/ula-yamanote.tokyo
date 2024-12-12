export const fullscreenManager = {
  async requestFullscreen() {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen request was denied or failed');
    }
  },

  async exitFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.log('Error exiting fullscreen:', error);
    }
  },

  isFullscreen() {
    return !!document.fullscreenElement;
  }
};
