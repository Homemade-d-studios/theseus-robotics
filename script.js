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

const glitchGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}\/|_-+=*#?";
const glitchTargets = document.querySelectorAll(
  ".landing-heading, .landing-actions__watch, .landing-capabilities h2, " +
    ".landing-capabilities li, .landing-capabilities p, .film-locations",
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
