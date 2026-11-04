export {};

const selector = document.querySelector<HTMLElement>(".work-selector");
const tabs = [...document.querySelectorAll<HTMLAnchorElement>("[data-work-tab]")];
const panels = [...document.querySelectorAll<HTMLElement>("[data-work-panel]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (selector && tabs.length && panels.length) {
  selector.classList.add("is-enhanced");
  const tabList = selector.querySelector(".work-tabs");
  const orientTabs = () => {
    tabList?.setAttribute("aria-orientation", window.innerWidth > 760 ? "vertical" : "horizontal");
  };
  orientTabs();
  window.addEventListener("resize", orientTabs, { passive: true });

  const move = (element: HTMLElement) => {
    if (reducedMotion.matches || typeof element.animate !== "function") return;
    element.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  };

  const selectWork = (key: string, animate = true) => {
    tabs.forEach((tab) => {
      const selected = tab.dataset.workTab === key;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.id === key;
      panel.hidden = !selected;
      if (selected && animate) move(panel);
    });
    window.dispatchEvent(new Event("scroll"));
  };

  tabs.forEach((tab, index) => {
    const key = tab.dataset.workTab ?? "";
    tab.id = "tab-" + key;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", key);
    const panel = document.getElementById(key);
    panel?.setAttribute("role", "tabpanel");
    panel?.setAttribute("aria-labelledby", tab.id);
    if (panel) panel.tabIndex = 0;
    tab.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      selectWork(key);
    });
    tab.addEventListener("keydown", (event) => {
      let next: number | undefined;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = (index - 1 + tabs.length) % tabs.length;
      }
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (event.key === " ") next = index;
      if (next === undefined) return;
      event.preventDefault();
      const target = tabs[next];
      if (!target) return;
      target.focus();
      selectWork(target.dataset.workTab ?? "");
    });
  });

  const workFromHash = () => {
    const key = window.location.hash.slice(1);
    if (panels.some((panel) => panel.id === key)) {
      selectWork(key, false);
      document.getElementById(key)?.scrollIntoView({ block: "start" });
    }
  };
  selectWork("analysis", false);
  window.addEventListener("hashchange", workFromHash);
  workFromHash();
}
