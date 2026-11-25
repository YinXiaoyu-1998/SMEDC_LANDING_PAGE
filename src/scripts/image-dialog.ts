const dialog = document.querySelector<HTMLDialogElement>("#image-dialog");
const title = document.getElementById("image-dialog-title");
const picture = document.querySelector<HTMLImageElement>("#image-dialog-picture");
const content = dialog?.querySelector<HTMLElement>(".image-dialog-content");
const closeButton = document.getElementById("close-image");
const zoom = document.querySelector<HTMLSelectElement>("#image-zoom");

if (dialog && title && picture && content && closeButton && zoom && "showModal" in dialog) {
  let trigger: HTMLAnchorElement | null = null;

  const setZoom = () => {
    content.dataset.zoom = zoom.value;
    if (zoom.value === "fit") content.scrollTo(0, 0);
  };

  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-open-image]")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const thumbnail = link.querySelector("img");
      if (!thumbnail || dialog.open) return;
      event.preventDefault();
      trigger = link;
      title.textContent = link.dataset.openImage ?? "";
      picture.alt = thumbnail.alt;
      picture.src = link.href;
      picture.hidden = false;
      dialog.showModal();
      zoom.value = "fit";
      setZoom();
      closeButton.focus({ preventScroll: true });
    });
  }

  zoom.addEventListener("change", setZoom);
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    trigger?.focus({ preventScroll: true });
    trigger = null;
  });
}

export {};
