import { gsap } from "gsap";

const reduced = matchMedia("(prefers-reduced-motion: reduce)");

function showReview(items: HTMLElement[], index: number) {
  items.forEach((item, i) => {
    item.classList.toggle("is-current", i === index);
    item.inert = i !== index;
  });
}

function queueReviews(timeline: gsap.core.Timeline, items: HTMLElement[]) {
  const replies = items.map((item) => item.querySelector(".auto-answer")!);
  gsap.set(replies, { autoAlpha: 0 });
  items.forEach((item, index) => {
    const arrival = 1.75 + index * 4.4;
    timeline
      .call(() => showReview(items, index), [], arrival)
      .fromTo(
        item,
        { opacity: 0, y: 9 },
        { opacity: 1, y: 0, duration: 0.3, immediateRender: false },
        arrival
      )
      .to(replies[index]!, { autoAlpha: 1, duration: 0.35 }, arrival + 0.8);
  });
  return 1.75 + items.length * 4.4;
}

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
    const reviews = [...card.querySelectorAll<HTMLElement>(".review-item")];
    const animate = !reduced.matches && !paused;
    showReview(reviews, animate ? -1 : 0);
    gsap.set(card.querySelectorAll(".auto-answer, .review-item"), {
      clearProps: "transform,opacity,visibility"
    });
    prompt.textContent = animate ? "" : phrase;
    // A complete sentence stays available to assistive technology throughout typing.
    prompt.parentElement!.setAttribute("aria-label", phrase);
    prompt.setAttribute("aria-hidden", "true");
    if (animate) {
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
        .to(arrow, { scale: 0.84, yoyo: true, repeat: 1, duration: 0.12 }, 0.94);
      const exit = reviews.length ? queueReviews(timeline, reviews) : 6.8;
      timeline.to(card, { opacity: 0, y: -8, duration: 0.25 }, exit);
    }
    syncPlayback();
  }

  choices.forEach((button, i) =>
    button.addEventListener("click", () => {
      paused = false;
      showScene(i);
    })
  );
  playback.addEventListener("click", () => {
    paused = !paused;
    if (!paused && !timeline) showScene(current);
    else syncPlayback();
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
    label.textContent = open ? "收起依据" : "展开依据";
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
const picker = document.querySelector<HTMLElement>(".case-picker");
if (stage && picker && "IntersectionObserver" in window) {
  mountConversation(stage);
  const buttons = [...picker.querySelectorAll<HTMLButtonElement>("button")];
  const panels = [...document.querySelectorAll<HTMLElement>(".business-case")];
  function selectCase(index: number) {
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  }
  selectCase(0);
  panels.forEach(mountFlow);
  buttons.forEach((button, i) => button.addEventListener("click", () => selectCase(i)));
  document.querySelector(".story-cta")?.addEventListener("click", () => {
    const active = [...stage.querySelectorAll("[data-question]")].findIndex(
      (button) => button.getAttribute("aria-pressed") === "true"
    );
    selectCase(active === 1 ? 1 : 0);
  });
  picker.hidden = false;
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
