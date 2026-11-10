const video = document.querySelector("#launch-video");
const soundControl = document.querySelector("#sound-control");
const soundLabel = document.querySelector("#sound-label");
let userHasScrolled = window.scrollY > 0;

window.addEventListener(
  "scroll",
  () => {
    userHasScrolled = true;
  },
  { once: true, passive: true },
);

function updateSoundControl(soundIsOn) {
  soundControl.setAttribute("aria-pressed", String(soundIsOn));
  soundControl.setAttribute(
    "aria-label",
    soundIsOn ? "Turn video sound off" : "Turn video sound on",
  );
  soundLabel.textContent = soundIsOn ? "Sound off" : "Sound on";
}

soundControl.addEventListener("click", async () => {
  const soundIsOn = video.muted;

  video.muted = !soundIsOn;
  video.volume = 1;
  updateSoundControl(soundIsOn);

  if (video.paused) {
    try {
      await video.play();
    } catch (error) {
      console.warn("The video could not be started automatically.", error);
    }
  }
});

// Re-sync the control if the browser changes the media state.
video.addEventListener("volumechange", () => {
  updateSoundControl(!video.muted && video.volume > 0);
});

const visibilityObserver = new IntersectionObserver(
  ([entry]) => {
    if (
      userHasScrolled &&
      entry.isIntersecting &&
      entry.intersectionRatio >= 0.15
    ) {
      video.play().catch((error) => {
        console.warn("The launch film could not be started automatically.", error);
      });
      return;
    }

    video.pause();
  },
  { threshold: [0, 0.15, 1] },
);

visibilityObserver.observe(video);

updateSoundControl(false);

const landingShell = document.querySelector(".landing-shell");
const previewOpen = document.querySelector("#preview-open");
const previewClose = document.querySelector("#preview-close");
const previewExperience = document.querySelector("#preview-experience");
const previewForm = document.querySelector("#preview-form");

function setPreviewMode(isOpen) {
  landingShell.classList.toggle("is-previewing", isOpen);
  previewExperience.setAttribute("aria-hidden", String(!isOpen));

  if (isOpen) {
    if (window.location.hash !== "#private-preview") {
      window.history.replaceState(null, "", "#private-preview");
    }
    window.setTimeout(
      () => previewForm.querySelector('[name="name"]').focus(),
      420,
    );
    return;
  }

  if (window.location.hash === "#private-preview") {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  previewOpen.focus();
}

previewOpen.addEventListener("click", () => setPreviewMode(true));
previewClose.addEventListener("click", () => setPreviewMode(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && landingShell.classList.contains("is-previewing")) {
    setPreviewMode(false);
  }
});

if (window.location.hash === "#private-preview") {
  setPreviewMode(true);
}

previewForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(previewForm);
  const formats = formData.getAll("format").join(", ") || "Not specified";
  const message = [
    `Name: ${formData.get("name")}`,
    `Work email: ${formData.get("email")}`,
    `Company: ${formData.get("company")}`,
    `Role: ${formData.get("role") || "Not specified"}`,
    `Store format: ${formats}`,
    `Number of stores: ${formData.get("store-count")}`,
    `Country: ${formData.get("country")}`,
    "",
    "Anything else:",
    formData.get("details") || "Not specified",
  ].join("\n");

  window.location.href =
    "mailto:hello@theseus.bot?subject=Private%20preview%20request&body=" +
    encodeURIComponent(message);
});

const glitchGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}\/|_-+=*#?";
const glitchTargets = document.querySelectorAll(
  ".landing-heading, .landing-actions__watch, .landing-capabilities h2, " +
    ".landing-capabilities li, .landing-capabilities p, .film-locations, " +
    ".preview-intro h2, .preview-intro p",
);
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

function getTextNodes(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node = walker.nextNode();

  while (node) {
    if (node.nodeValue.trim()) {
      textNodes.push(node);
    }
    node = walker.nextNode();
  }

  return textNodes;
}

function startLetterGlitch(letter) {
  if (prefersReducedMotion.matches || letter.dataset.glitching === "true") {
    return;
  }

  const original = letter.textContent;
  letter.dataset.glitching = "true";
  letter.classList.add("is-glitching");
  letter._glitchTimer = window.setInterval(() => {
    letter.textContent =
      glitchGlyphs[Math.floor(Math.random() * glitchGlyphs.length)];
  }, 72);
  letter._glitchOriginal = original;
}

function stopLetterGlitch(letter) {
  if (letter.dataset.glitching !== "true") {
    return;
  }

  window.clearInterval(letter._glitchTimer);
  letter.textContent = letter._glitchOriginal;
  letter.classList.remove("is-glitching");
  delete letter.dataset.glitching;
  delete letter._glitchTimer;
  delete letter._glitchOriginal;
}

glitchTargets.forEach((element) => {
  getTextNodes(element).forEach((textNode) => {
    const fragment = document.createDocumentFragment();

    Array.from(textNode.nodeValue).forEach((character) => {
      if (/\s/.test(character)) {
        fragment.append(character);
        return;
      }

      const letter = document.createElement("span");
      letter.className = "glitch-letter";
      letter.textContent = character;
      letter.addEventListener("pointerenter", () => startLetterGlitch(letter));
      letter.addEventListener("pointerleave", () => stopLetterGlitch(letter));
      fragment.append(letter);
    });

    textNode.replaceWith(fragment);
  });
});
