export {};

const chooser = document.getElementById("chooser");
const panels = [...document.querySelectorAll<HTMLElement>(".route-panel")];
const routeButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-route]")];
const copyStatus = document.getElementById("copy-status");

function chooseRoute(key: string) {
  if (copyStatus) copyStatus.textContent = "";
  const selected = document.getElementById("route-" + key);
  if (!selected) return;
  panels.forEach((panel) => {
    panel.hidden = panel !== selected;
  });
  if (chooser) chooser.hidden = true;
  routeButtons.forEach((button) =>
    button.setAttribute("aria-expanded", String(button.dataset.route === key))
  );
  selected.querySelector("h2")?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "auto" });
}

routeButtons.forEach((button) =>
  button.addEventListener("click", () => chooseRoute(button.dataset.route ?? ""))
);

document.querySelectorAll<HTMLButtonElement>(".change-route").forEach((button) =>
  button.addEventListener("click", () => {
    panels.forEach((panel) => {
      panel.hidden = true;
    });
    routeButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    if (chooser) chooser.hidden = false;
    if (copyStatus) copyStatus.textContent = "";
    document.getElementById("choose-title")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  })
);

document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const id = button.dataset.copy ?? "";
    const target = document.getElementById(id);
    if (!target) return;
    let copied = false;
    try {
      await navigator.clipboard.writeText(target.textContent ?? "");
      copied = true;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection?.removeAllRanges();
      selection?.addRange(range);
      try {
        copied = document.execCommand("copy");
      } catch {
        // Selectable prompt text remains available when the clipboard is blocked.
      }
    }
    button.textContent = copied ? "已复制" : "文字已选中";
    if (copyStatus) {
      copyStatus.textContent = copied
        ? "已复制。请切到本步标明电脑的 Codex，粘贴并发送。"
        : "未能自动复制。文字已选中，请按 Command+C 复制，再粘贴到 Codex。";
    }
  });
});
