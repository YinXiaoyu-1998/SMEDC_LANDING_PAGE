import { gsap } from "gsap";

const reduced = matchMedia("(prefers-reduced-motion: reduce)");

function mountConversation(stage: HTMLElement) {
  const controls = stage.querySelector<HTMLElement>(".scene-controls")!;
  const choices = [...stage.querySelectorAll<HTMLButtonElement>("[data-question]")];
  const cards = [...stage.querySelectorAll<HTMLElement>(".result-frame")];
  const prompt = stage.querySelector<HTMLElement>(".prompt-text")!;
  const arrow = stage.querySelector<HTMLElement>(".send-mark")!;
  const playback = stage.querySelector<HTMLButtonElement>(".playback")!;
  let current = 0;
  let visible = false;
  let paused = false;
  let timeline: gsap.core.Timeline | undefined;

  function syncPlayback() {
    timeline?.paused(paused || !visible || document.hidden);
    playback.hidden = reduced.matches;
    playback.textContent = paused ? "播放" : "暂停";
    playback.setAttribute("aria-label", paused ? "播放场景轮播" : "暂停场景轮播");
  }

  function showScene(index: number) {
    current = index;
    timeline?.kill();
    timeline = undefined;
    const card = cards[index]!;
    const phrase = choices[index]!.dataset.question!;
    choices.forEach((choice, i) => choice.setAttribute("aria-pressed", String(i === index)));
    cards.forEach((frame, i) => {
      frame.hidden = i !== index;
    });
    gsap.set([arrow, card], { clearProps: "transform,opacity" });
    prompt.textContent = reduced.matches ? phrase : "";
    // A complete sentence stays available to assistive technology throughout typing.
    prompt.parentElement!.setAttribute("aria-label", phrase);
    prompt.setAttribute("aria-hidden", "true");
    if (!reduced.matches) {
      const typing = { length: 0 };
      timeline = gsap.timeline({
        paused: true,
        onComplete: () => showScene((index + 1) % choices.length)
      });
      timeline
        .fromTo(
          card,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.58, ease: "power3.out" },
          1.05
        )
        .to(
          typing,
          {
            length: phrase.length,
            duration: 0.92,
            ease: "none",
            onUpdate: () => {
              prompt.textContent = phrase.slice(0, Math.ceil(typing.length));
            }
          },
          0
        )
        .to(arrow, { scale: 0.84, yoyo: true, repeat: 1, duration: 0.12 }, 0.94)
        .to(card, { opacity: 0, y: -8, duration: 0.25 }, 6.8);
    }
    if (paused) timeline?.seek(2, false);
    syncPlayback();
  }

  choices.forEach((button, i) =>
    button.addEventListener("click", () => {
      paused = true;
      showScene(i);
    })
  );
  playback.addEventListener("click", () => {
    paused = !paused;
    syncPlayback();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry!.isIntersecting;
    syncPlayback();
  }).observe(stage);
  document.addEventListener("visibilitychange", syncPlayback);
  reduced.addEventListener("change", () => showScene(current));
  controls.hidden = false;
  showScene(0);
}

function mountFlow(section: HTMLElement) {
  const button = section.querySelector<HTMLButtonElement>(".flow-toggle")!;
  const label = button.querySelector<HTMLElement>(".toggle-label")!;
  const records = section.querySelector<HTMLElement>(".flow-records")!;
  const desktop = matchMedia("(min-width: 841px)");
  let timer: number | undefined;
  let interacted = false;
  function setOpen(open: boolean) {
    section.classList.toggle("folded", !open);
    records.inert = !open;
    records.setAttribute("aria-hidden", String(!open));
    button.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "收起营业记录" : "展开营业记录";
  }
  setOpen(reduced.matches);
  button.hidden = false;
  button.addEventListener("click", () => {
    interacted = true;
    clearTimeout(timer);
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });
  const observer = new IntersectionObserver(
    ([entry]) => {
      clearTimeout(timer);
      if (entry!.intersectionRatio >= 0.72 && desktop.matches && !reduced.matches && !interacted) {
        timer = window.setTimeout(() => {
          setOpen(true);
          observer.disconnect();
        }, 1450);
      }
    },
    { threshold: [0, 0.72] }
  );
  observer.observe(section.querySelector(".flow-map")!);
  reduced.addEventListener("change", () => {
    clearTimeout(timer);
    if (reduced.matches) setOpen(true);
  });
}

const stage = document.querySelector<HTMLElement>(".agent-stage");
const flow = document.querySelector<HTMLElement>(".flow-story");
if (stage && flow && "IntersectionObserver" in window) {
  mountConversation(stage);
  mountFlow(flow);
}

// A catalogue deep link also opens the addressed disclosure on repeat clicks.
function openFeature(hash: string) {
  const feature = document.getElementById(hash.slice(1));
  if (feature instanceof HTMLDetailsElement && feature.classList.contains("feature-entry")) {
    feature.open = true;
  }
}
openFeature(location.hash);
window.addEventListener("hashchange", () => openFeature(location.hash));
document.addEventListener("click", (event) => {
  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
      : null;
  if (link) openFeature(link.hash);
});
