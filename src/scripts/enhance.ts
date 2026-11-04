"use strict";

export {};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const fineDesktop = window.matchMedia("(min-width: 761px) and (pointer: fine)");
const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

const move = (
  element: Element | null,
  frames: Keyframe[],
  options: KeyframeAnimationOptions = {}
) => {
  if (reducedMotion.matches || !element || typeof element.animate !== "function") return null;
  return element.animate(frames, { duration: 400, easing: ease, ...options });
};

const reveal = (element: Element) => {
  element.classList.remove("is-pending");
  element.classList.add("is-revealed");
};

const revealContaining = (target: Element | null) => {
  for (let element = target; element; element = element.parentElement) {
    if (element.matches("[data-reveal]")) reveal(element);
  }
};

const reveals = [...document.querySelectorAll("[data-reveal]")];
let revealObserver: IntersectionObserver | undefined;
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      let stagger = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).style.transitionDelay = Math.min(stagger++ * 70, 210) + "ms";
        reveal(entry.target);
        revealObserver?.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight * 0.9) {
      element.classList.add("is-pending");
      revealObserver?.observe(element);
    }
  });
}

document.addEventListener("focusin", (event) => revealContaining(event.target as Element | null));
const revealHash = () => {
  if (!window.location.hash) return;
  revealContaining(document.getElementById(window.location.hash.slice(1)));
};
window.addEventListener("hashchange", revealHash);
revealHash();

const entranceAnimations = [...document.querySelectorAll("[data-entrance]")].map((element, index) =>
  move(
    element,
    [
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 850, delay: index * 100, fill: "backwards" }
  )
);

const copyButton = document.getElementById("copy-contact");
const copyStatus = document.getElementById("copy-status");
if (copyButton && copyStatus) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        "企业智脑 SMEDC\n电话：18514577162\n邮箱：consyinxy@gmail.com"
      );
      copyStatus.textContent = "已复制联系方式，可粘贴到您的通讯工具。";
    } catch {
      copyStatus.textContent = "暂时无法自动复制，请选中上方电话或邮箱手动复制。";
    }
  });
}

const header = document.querySelector(".site-header");
const progress = document.querySelector<HTMLElement>(".reading-progress");
const hero = document.querySelector(".hero");
const heroPhoto = document.querySelector(".hero-photo");
const navigation = [...document.querySelectorAll(".site-header nav a")];
const navigationSections = navigation
  .map((link) => link.getAttribute("href") ?? "")
  .map((href) => (href.startsWith("#") ? document.querySelector(href) : null));
let scrollFrame = 0;
const renderScroll = () => {
  scrollFrame = 0;
  const y = window.scrollY;
  header?.classList.toggle("is-scrolled", y > 16);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) {
    progress.style.transform = "scaleX(" + (scrollable > 0 ? Math.min(y / scrollable, 1) : 0) + ")";
  }
  if (heroPhoto && hero) {
    (heroPhoto as HTMLElement).style.transform =
      !reducedMotion.matches && fineDesktop.matches
        ? "translate3d(0," +
          Math.min(y * 0.08, (hero as HTMLElement).offsetHeight * 0.045) +
          "px,0)"
        : "none";
  }
  let current = -1;
  navigationSections.forEach((section, index) => {
    if (y > 100 && section && section.getBoundingClientRect().top <= window.innerHeight * 0.45) {
      current = index;
    }
  });
  navigation.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
};
const requestScroll = () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(renderScroll);
};
window.addEventListener("scroll", requestScroll, { passive: true });
window.addEventListener("resize", requestScroll, { passive: true });
window.addEventListener("load", requestScroll, { once: true });
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    revealObserver?.disconnect();
    reveals.forEach(reveal);
    entranceAnimations.forEach((animation) => animation?.cancel());
  }
  requestScroll();
});
renderScroll();

document.querySelectorAll("details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    const content = detail.querySelector(".choice-content") || detail.querySelector("div");
    move(
      content,
      [
        { opacity: 0, transform: "translateY(-8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 380 }
    );
    requestScroll();
  });
});

const dialog = document.getElementById("report-dialog") as HTMLDialogElement | null;
const frame = document.getElementById("report-frame") as HTMLIFrameElement | null;
const reportStatus = document.getElementById("report-status");
const closeButton = document.getElementById("close-report");
if (dialog && frame && closeButton && typeof dialog.showModal === "function") {
  let returnFocus: HTMLElement | null = null;
  let closing = false;
  const closeReport = () => {
    if (!dialog.open || closing) return;
    closing = true;
    const animation = move(
      dialog,
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(12px) scale(0.99)" }
      ],
      { duration: 180, easing: "ease-in", fill: "forwards" }
    );
    const finish = () => {
      animation?.cancel();
      dialog.close();
    };
    if (animation) animation.finished.then(finish, finish);
    else finish();
  };
  const openReport = (link: HTMLElement) => {
    if (dialog.open) return;
    returnFocus = link;
    if (!frame.hasAttribute("src")) frame.src = frame.dataset.src ?? "";
    document.body.classList.add("reader-open");
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
    move(
      dialog,
      [
        { opacity: 0, transform: "translateY(24px) scale(0.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      { duration: 420 }
    );
  };
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const link = target?.closest?.("[data-open-report]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    openReport(link);
  });
  document.querySelectorAll("[data-open-report]").forEach((link) => {
    link.setAttribute("aria-haspopup", "dialog");
  });
  frame.addEventListener("load", () => {
    if (!frame.hasAttribute("src")) return;
    frame.hidden = false;
    if (reportStatus) reportStatus.hidden = true;
  });
  closeButton.addEventListener("click", closeReport);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeReport();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      closeReport();
    }
  });
  dialog.addEventListener("close", () => {
    closing = false;
    document.body.classList.remove("reader-open");
    returnFocus?.focus({ preventScroll: true });
  });
  window.addEventListener("message", (event) => {
    if (event.source === frame.contentWindow && event.data?.type === "smedc-report:close") {
      closeReport();
    }
  });
}
