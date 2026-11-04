import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

type Timeline = ReturnType<typeof gsap.timeline>;

declare global {
  interface Window {
    __timelines?: Record<string, Timeline>;
  }
}

const root = document.getElementById("smedc-setup");
if (root) {
  gsap.registerPlugin(TextPlugin);
  const request = root.querySelector<HTMLElement>(".setup-request-text");
  if (request) {
    const prompt = (request.textContent ?? "").replace(/\s+/g, " ").trim();
    request.textContent = prompt;
    root.dataset.installPrompt = prompt;

    const timeline = gsap.timeline({ paused: true });
    timeline.from(
      root.querySelector(".setup-request"),
      { x: 16, opacity: 0, duration: 0.5, ease: "power3.out" },
      0.3
    );
    timeline.fromTo(
      request,
      { text: "" },
      { text: { value: prompt }, duration: 3.8, ease: "none" } as gsap.TweenVars,
      0.65
    );
    timeline.from(
      root.querySelector(".setup-agent-intro"),
      { y: 10, opacity: 0, duration: 0.45, ease: "power2.out" },
      4.9
    );
    const eases = ["power3.out", "sine.out", "power2.out", "expo.out"];
    root.querySelectorAll(".setup-step").forEach((step, index) => {
      timeline.from(
        step,
        { x: -10, opacity: 0, duration: 0.42 + index * 0.04, ease: eases[index] },
        6.1 + index * 1.65
      );
    });
    timeline.from(
      root.querySelector(".setup-finish"),
      { y: 12, opacity: 0, scale: 0.99, duration: 0.65, ease: "expo.out" },
      12.9
    );
    timeline.from(
      root.querySelector(".setup-finish-tail"),
      { y: 5, opacity: 0, duration: 0.5, ease: "sine.out" },
      14.1
    );
    window.__timelines = window.__timelines || {};
    window.__timelines["smedc-setup"] = timeline;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const copyPrompt = document.getElementById("copy-setup-prompt");
    const demoStatus = document.getElementById("setup-demo-status");
    if (copyPrompt) {
      copyPrompt.hidden = false;
      copyPrompt.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(prompt);
          if (demoStatus) {
            demoStatus.textContent =
              "安装请求已复制，发给您熟悉的主流 Agent 智能体，即可开始 AI 原生接入。";
          }
        } catch {
          timeline.progress(1).pause();
          if (demoStatus) {
            demoStatus.textContent = "暂时无法自动复制，请选中对话中的完整安装请求手动复制。";
          }
        }
      });
    }

    const playback = document.querySelector<HTMLElement>("[data-demo-playback]");
    const playButton = document.getElementById("setup-play");
    const progressInput = document.getElementById("setup-progress") as HTMLInputElement | null;
    let visible = false;
    let wantsPlayback = true;
    let complete = false;
    const syncPlayback = () => {
      if (playback) playback.hidden = reducedMotion.matches;
      if (reducedMotion.matches) {
        timeline.progress(1).pause();
        root.dataset.demoState = "static";
        return;
      }
      const playing = visible && wantsPlayback && !document.hidden && !complete;
      if (playing) timeline.play();
      else timeline.pause();
      root.dataset.demoState = complete ? "complete" : playing ? "playing" : "paused";
      if (playButton) {
        playButton.textContent = complete ? "重播演示" : playing ? "暂停演示" : "播放演示";
      }
    };

    if (progressInput) {
      progressInput.max = String(timeline.duration());
      progressInput.value = String(timeline.time());
      timeline.eventCallback("onUpdate", () => {
        progressInput.value = String(timeline.time());
      });
      progressInput.addEventListener("input", () => {
        wantsPlayback = false;
        complete = false;
        timeline.pause().time(Number(progressInput.value));
        complete = timeline.progress() >= 1;
        syncPlayback();
      });
    }
    timeline.eventCallback("onComplete", () => {
      complete = true;
      wantsPlayback = false;
      syncPlayback();
    });
    playButton?.addEventListener("click", () => {
      if (complete) {
        timeline.pause(0);
        complete = false;
        wantsPlayback = true;
      } else {
        wantsPlayback = !wantsPlayback;
      }
      syncPlayback();
    });
    if ("IntersectionObserver" in window) {
      const demoObserver = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? false;
          syncPlayback();
        },
        { threshold: 0.35 }
      );
      demoObserver.observe(root);
    } else {
      timeline.progress(1).pause();
      complete = true;
      wantsPlayback = false;
      visible = true;
    }
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", () => {
      if (!reducedMotion.matches) {
        complete = true;
        wantsPlayback = false;
      }
      syncPlayback();
    });
    syncPlayback();
  }
}
