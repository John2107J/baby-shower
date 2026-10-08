const MINI_BOWS = 14;
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Celebration: little bows jump out of `origin` into `layer` (a fixed,
 * full-screen element). Needs <WatercolorDefs /> on the page for #mini-bow.
 */
export function hopBows(origin: HTMLElement, layer: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect = origin.getBoundingClientRect();
  for (let i = 0; i < MINI_BOWS; i++) {
    const bow = document.createElementNS(SVG_NS, "svg");
    bow.setAttribute("viewBox", "0 0 26 18");
    bow.classList.add("mini-bow");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#mini-bow");
    bow.appendChild(use);
    bow.style.left = `${rect.left + rect.width / 2 - 13}px`;
    bow.style.top = `${rect.top}px`;
    bow.style.setProperty("--dx", `${Math.round(Math.random() * 220 - 110)}px`);
    bow.style.setProperty("--up", `${-Math.round(90 + Math.random() * 120)}px`);
    bow.style.setProperty(
      "--spin",
      `${Math.round(Math.random() * 120 - 60)}deg`,
    );
    bow.style.animationDelay = `${(Math.random() * 0.15).toFixed(2)}s`;
    layer.appendChild(bow);
    bow.addEventListener("animationend", () => bow.remove());
  }
}
