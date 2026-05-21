/**
 * Holo Golf VR — Loading Screen
 */
export function createLoadingScreen() {
  const overlay = document.createElement("div");
  overlay.id = "loading-screen";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, #001020 0%, #000000 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 9999; font-family: 'Courier New', monospace; transition: opacity 0.5s ease;
  `;

  overlay.innerHTML = `
    <div style="text-align: center;">
      <h1 style="
        font-size: 48px; color: #00ffff; margin: 0; letter-spacing: 6px;
        text-shadow: 0 0 15px #00ffff, 0 0 30px #0088aa;
      ">HOLO GOLF</h1>
      <div style="
        width: 200px; height: 4px; background: #001a2a; margin: 30px auto 10px;
        border: 1px solid #003344; overflow: hidden;
      ">
        <div id="loading-bar" style="
          width: 0%; height: 100%; background: linear-gradient(90deg, #00ffff, #44ff88);
          transition: width 0.3s ease;
        "></div>
      </div>
      <div id="loading-text" style="
        color: #4488aa; font-size: 12px; letter-spacing: 2px; margin-top: 8px;
      ">INITIALIZING...</div>
    </div>
  `;

  document.body.appendChild(overlay);

  return {
    show: () => {
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
    },
    hide: () => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
      }, 500);
    },
    setProgress: (pct: number, text?: string) => {
      const bar = document.getElementById("loading-bar");
      const label = document.getElementById("loading-text");
      if (bar) bar.style.width = `${pct}%`;
      if (label && text) label.textContent = text;
    },
  };
}
