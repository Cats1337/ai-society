// Smooth scroll for nav and hero buttons
function smoothScrollTo(target) {
  var el = document.querySelector(target);
  if (!el) return;
  var y = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
}

document.querySelectorAll("[data-scroll]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var target = btn.getAttribute("data-scroll");
    smoothScrollTo(target);
  });
});

document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function (e) {
    var target = link.getAttribute("href");
    if (target.length > 1) {
      e.preventDefault();
      smoothScrollTo(target);
    }
  });
});

// Active nav highlight on scroll
var sections = Array.from(document.querySelectorAll("main section"));
var navLinks = Array.from(document.querySelectorAll(".nav-link"));

function updateActiveNav() {
  var scrollPos = window.scrollY;
  var currentId = "intro";

  sections.forEach(function (sec) {
    var offset = sec.offsetTop - 120;
    if (scrollPos >= offset) {
      currentId = sec.id;
    }
  });

  navLinks.forEach(function (link) {
    var target = link.getAttribute("data-scroll");
    if (target === "#" + currentId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNav);
window.addEventListener("load", updateActiveNav);

// Back to top button
var backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", function () {
  if (window.scrollY > 260) {
    backToTop.style.display = "flex";
  } else {
    backToTop.style.display = "none";
  }
});

backToTop.addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Tooltip image functionality
// Use a single absolutely-positioned popup appended to <body> so images don't shift layout.
(function () {
  var popup = document.createElement("div");
  popup.className = "tooltip-popup";
  document.body.appendChild(popup);
  var pinnedTarget = null;

  function showImageTooltip(target, url, opts) {
    opts = opts || {};
    // Clear previous
    popup.innerHTML = "";
    target.classList.add("suppress-hover");

    // Insert the image element immediately so the popup always reflects
    // the requested URL (avoids showing a stale image while a new one loads).
    var imgEl = document.createElement("img");
    imgEl.src = url;
    imgEl.alt = "";
    imgEl.dataset.src = url;
    imgEl.style.opacity = '0';
    imgEl.addEventListener("click", function (ev) {
      // Open image in new tab when clicked
      window.open(url, "_blank");
      ev.stopPropagation();
    });

    // Ensure any previously visible image is replaced immediately
    popup.appendChild(imgEl);
    // Position and mark visible (image will paint when data arrives)
    positionPopup(target);
    popup.classList.add("visible");

    // When the image finishes loading, make it fully opaque and re-position
    imgEl.addEventListener("load", function () {
      imgEl.style.transition = 'opacity 160ms ease';
      imgEl.style.opacity = '1';
      positionPopup(target);
    });

    imgEl.addEventListener("error", function () {
      // Fallback: show CSS tooltip text if image fails
      target.classList.remove("suppress-hover");
      // remove broken img
      if (imgEl.parentNode === popup) popup.removeChild(imgEl);
      popup.classList.remove("visible");
    });
  }

  function hideImageTooltip(target) {
    if (target) target.classList.remove("suppress-hover");
    popup.classList.remove("visible");
    popup.innerHTML = "";
  }

  function positionPopup(target) {
    if (!popup.firstChild) return;
    var rect = target.getBoundingClientRect();
    // Allow the image to settle in the DOM before measuring
    requestAnimationFrame(function () {
      var pRect = popup.getBoundingClientRect();
      var left = rect.left + rect.width / 2 - pRect.width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - pRect.width - 8));
      var top = rect.top - pRect.height - 10;
      if (top < 8) top = rect.bottom + 10;
      popup.style.left = left + window.scrollX + "px";
      popup.style.top = top + window.scrollY + "px";
    });
  }

  // Close pinned popup when clicking/tapping outside
  document.addEventListener("click", function (ev) {
    if (!pinnedTarget) return;
    var target = ev.target;
    if (pinnedTarget.contains(target)) return; // click on pinned trigger
    if (popup.contains(target)) return; // click inside popup
    // otherwise close
    hideImageTooltip(pinnedTarget);
    pinnedTarget = null;
  });

  // Reposition on scroll/resize while visible
  window.addEventListener(
    "scroll",
    function () {
      if (popup.classList.contains("visible") && pinnedTarget)
        positionPopup(pinnedTarget);
    },
    { passive: true }
  );
  window.addEventListener("resize", function () {
    if (popup.classList.contains("visible") && pinnedTarget)
      positionPopup(pinnedTarget);
  });

  // Attach handlers
  document.querySelectorAll(".tooltip-wrap").forEach(function (el) {
    var touchTimeout = null;

    function showIfImg() {
      var tooltipContent = el.getAttribute("data-tooltip") || "";
      if (tooltipContent.startsWith("img:")) {
        var imgUrl = tooltipContent.slice(4);
        showImageTooltip(el, imgUrl);
        return true;
      }
      return false;
    }

    function onEnter(e) {
      // If pinned by click, don't change
      if (pinnedTarget && pinnedTarget !== el) return;
      showIfImg();
    }

    function onMove(e) {
      if (popup.classList.contains("visible")) positionPopup(el);
    }

    function onLeave(e) {
      // don't hide if this trigger is pinned
      if (pinnedTarget === el) return;
      hideImageTooltip(el);
    }

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    // Click toggles pinned state: click to pin, click again to unpin
    el.addEventListener("click", function (ev) {
      var tooltipContent = el.getAttribute("data-tooltip") || "";
      if (!tooltipContent.startsWith("img:")) return;
      ev.stopPropagation();
      // If already pinned, unpin
      if (pinnedTarget === el) {
        hideImageTooltip(el);
        pinnedTarget = null;
        return;
      }
      // Pin this one
      pinnedTarget = el;
      showImageTooltip(el, tooltipContent.slice(4));
    });

    // Touch: show on long press, hide on touchend (unless pinned)
    el.addEventListener(
      "touchstart",
      function (ev) {
        if (touchTimeout) clearTimeout(touchTimeout);
        touchTimeout = setTimeout(function () {
          var tooltipContent = el.getAttribute("data-tooltip") || "";
          if (tooltipContent.startsWith("img:")) {
            showImageTooltip(el, tooltipContent.slice(4));
          }
        }, 300);
      },
      { passive: true }
    );

    el.addEventListener("touchend", function () {
      if (touchTimeout) clearTimeout(touchTimeout);
      if (pinnedTarget !== el) hideImageTooltip(el);
    });
  });

  // Make clicking the image open in a new tab (and don't close popup)
  popup.addEventListener("click", function (ev) {
    var img = ev.target;
    if (img && img.tagName === "IMG") {
      // open in new tab
      window.open(img.src, "_blank");
      ev.stopPropagation();
    }
  });
})();

// Interactive example modal for iframes: open an overlay with an X close button
(function () {
  function createOverlay(src, title) {
    // Remove existing overlay if present
    var existing = document.querySelector('.iframe-overlay');
    if (existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement('div');
    overlay.className = 'iframe-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var modal = document.createElement('div');
    modal.className = 'iframe-modal';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'iframe-close';
    closeBtn.setAttribute('aria-label', 'Close interactive example');
    closeBtn.textContent = '✕';

    // Create iframe inside modal
    var frame = document.createElement('iframe');
    frame.src = src;
    frame.setAttribute('title', title || 'Interactive example');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'no-referrer');

    modal.appendChild(closeBtn);
    modal.appendChild(frame);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Prevent body scroll
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus management
    var prevFocus = document.activeElement;
    closeBtn.focus();

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = prevOverflow || '';
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    closeBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      close();
    });

    // Click outside modal closes
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });

    document.addEventListener('keydown', onKey);
    return { overlay: overlay, close: close };
  }

  document.querySelectorAll('.iframe-fullscreen-btn').forEach(function (btn) {
    var targetId = btn.getAttribute('data-target');
    var iframe = document.getElementById(targetId);
    if (!iframe) return;

    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      // Use data-src (lazy) if available, otherwise fall back to src
      var src = iframe.getAttribute('data-src') || iframe.src || '';
      createOverlay(src, iframe.title || 'Interactive example');
    });
  });
})();
