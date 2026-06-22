const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const siteHeader = document.querySelector(".site-header");

if (navToggle && navLinks) {
  navToggle.setAttribute("aria-label", "Open navigation menu");

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    navToggle.textContent = isOpen ? "Close" : "Menu";
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
      navToggle.textContent = "Menu";
    });
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupShrinkingHeader() {
  if (!siteHeader) return;

  const updateHeader = () => {
    const isScrolled = window.scrollY > 18;
    siteHeader.classList.toggle("is-scrolled", isScrolled);
    document.body.classList.toggle("header-scrolled", isScrolled);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

setupShrinkingHeader();

function setupCursor() {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

  const dot = document.createElement("span");
  const ring = document.createElement("span");
  dot.className = "cursor-dot";
  ring.className = "cursor-ring";
  document.body.append(dot, ring);
  document.body.classList.add("motion-ready");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.opacity = "1";
    ring.style.opacity = "1";
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  const interactive = "a, button, summary, input, textarea, select, label";
  document.querySelectorAll(interactive).forEach((element) => {
    element.addEventListener("mouseenter", () => ring.classList.add("is-active"));
    element.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateRing);
  }

  animateRing();
}

function setupScrollProgress() {
  const bar = document.createElement("span");
  bar.className = "scroll-progress";
  document.body.append(bar);

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function setupMotion() {
  if (prefersReducedMotion) return;

  const revealTargets = document.querySelectorAll(
    ".section > *, .quote-band, .card, .feature, .role, .contact-panel, .image-panel"
  );

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.from(".hero-copy > *", {
      y: 26,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.1,
      delay: 0.08,
      clearProps: "transform",
    });

    window.gsap.utils.toArray(".hero").forEach((hero) => {
      window.gsap.to(hero, {
        "--hero-position": "50% 62%",
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    window.gsap.utils.toArray(revealTargets).forEach((element) => {
      window.gsap.from(element, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 86%",
        },
      });
    });

    window.gsap.utils.toArray(".image-panel img").forEach((image) => {
      window.gsap.fromTo(
        image,
        { scale: 1.08, yPercent: -4 },
        {
          scale: 1.02,
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: image.closest(".image-panel"),
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
    return;
  }

  revealTargets.forEach((element) => element.classList.add("reveal-ready"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.animate(
            [
              { opacity: 0, transform: "translateY(34px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 720, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" }
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );
  revealTargets.forEach((element) => observer.observe(element));
}

function setupForms() {
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      const accessKey = form.querySelector('input[name="access_key"]')?.value;

      if (!accessKey || accessKey.includes("YOUR_WEB3FORMS_ACCESS_KEY")) {
        if (status) {
          status.textContent = "Web3Forms is wired in. Add your Web3Forms access key to activate live email delivery.";
        }
        return;
      }

      if (status) status.textContent = "Sending your enquiry...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
        });
        const result = await response.json();

        if (result.success) {
          form.reset();
          if (status) status.textContent = "Thank you. Your enquiry has been sent to the Animate Care team.";
        } else {
          throw new Error(result.message || "Submission failed");
        }
      } catch (error) {
        if (status) {
          status.textContent = "The form could not send. Please call 0118 440 0118 or email info@animatecare.co.uk.";
        }
      }
    });
  });
}

function setupPacePanels() {
  document.querySelectorAll("[data-pace-panel]").forEach((panel) => {
    const tabs = Array.from(panel.querySelectorAll("[data-pace-tab]"));
    const letter = panel.querySelector("[data-pace-letter]");
    const title = panel.querySelector("[data-pace-title]");
    const copy = panel.querySelector("[data-pace-copy]");
    const example = panel.querySelector("[data-pace-example]");

    const activate = (tab) => {
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      if (letter) letter.textContent = tab.dataset.letter || "";
      if (title) title.textContent = tab.dataset.title || "";
      if (copy) copy.textContent = tab.dataset.copy || "";
      if (example) example.textContent = tab.dataset.example || "";
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
        const next = tabs[(index + direction + tabs.length) % tabs.length];
        next.focus();
        activate(next);
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupCursor();
  setupScrollProgress();
  setupMotion();
  setupForms();
  setupPacePanels();
});
