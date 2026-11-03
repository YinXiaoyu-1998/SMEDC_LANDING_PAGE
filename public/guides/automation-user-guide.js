/* global document, window */
const chooser = document.getElementById("chooser");
const panels = [...document.querySelectorAll(".route-panel")];
const routeButtons = [...document.querySelectorAll("[data-route]")];
function chooseRoute(key) {
  document.getElementById("copy-status").textContent = "";
  const selected = document.getElementById("route-" + key);
  panels.forEach((panel) => {
    panel.hidden = panel !== selected;
  });
  chooser.hidden = true;
  routeButtons.forEach((button) =>
    button.setAttribute("aria-expanded", String(button.dataset.route === key))
  );
  document.querySelector(".skip").href = "#route-" + key + "-title";
  selected.querySelector("h2").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "auto" });
}
routeButtons.forEach((button) =>
  button.addEventListener("click", () => chooseRoute(button.dataset.route))
);
document.querySelectorAll(".change-route").forEach((button) =>
  button.addEventListener("click", () => {
    panels.forEach((panel) => {
      panel.hidden = true;
    });
    routeButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    chooser.hidden = false;
    document.getElementById("copy-status").textContent = "";
    document.querySelector(".skip").href = "#chooser";
    document.getElementById("choose-title").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  })
);

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy);
    const status = document.getElementById("copy-status");
    let copied = false;
    try {
      await navigator.clipboard.writeText(target.textContent);
      copied = true;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        copied = document.execCommand("copy");
      } catch {
        // Selectable prompt text remains available when the clipboard is blocked.
      }
    }
    button.textContent = copied ? "已复制" : "文字已选中";
    status.textContent = copied
      ? "已复制。请切到本步标明电脑的 Codex，粘贴并发送。"
      : "未能自动复制。文字已选中，请按 Command+C 复制，再粘贴到 Codex。";
  });
});
