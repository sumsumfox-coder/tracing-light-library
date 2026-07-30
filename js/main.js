document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedLayout();
  setCurrentNavigation();
  setupMobileMenu();
  setupNewsTabs();
  setupLocationMap();
  setupActivityGallery();
  setupReservationForm();
  updateFooterYear();
});

async function loadSharedLayout() {
  await Promise.all([
    loadHtmlFragment("header-placeholder", "header.html"),
    loadHtmlFragment("footer-placeholder", "footer.html")
  ]);
}

async function loadHtmlFragment(placeholderId, filePath) {
  const placeholder = document.getElementById(placeholderId);

  if (!placeholder) {
    return;
  }

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`無法載入 ${filePath}`);
    }

    placeholder.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
    placeholder.innerHTML = `
      <div class="layout-load-error" role="alert">
        網站元件暫時未能載入，請稍後再試。
      </div>
    `;
  }
}

function setCurrentNavigation() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navigationLinks = document.querySelectorAll(".main-navigation a");

  navigationLinks.forEach((link) => {
    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function setupMobileMenu() {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-navigation");

  if (!menuButton || !navigation) {
    return;
  }

  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "開啟網站選單");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "關閉網站選單" : "開啟網站選單"
    );
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      closeMenu();
    }
  });
}

function setupNewsTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  if (!tabButtons.length || !tabPanels.length) {
    return;
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      activateTab(button);
    });

    button.addEventListener("keydown", (event) => {
      const currentIndex = Array.from(tabButtons).indexOf(button);
      let nextIndex = null;

      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabButtons.length;
      }

      if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      }

      if (event.key === "Home") {
        nextIndex = 0;
      }

      if (event.key === "End") {
        nextIndex = tabButtons.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        tabButtons[nextIndex].focus();
        activateTab(tabButtons[nextIndex]);
      }
    });

    if (index === 0) {
      button.setAttribute("tabindex", "0");
    }
  });
}

function activateTab(selectedButton) {
  const targetPanelId = selectedButton.getAttribute("aria-controls");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((button) => {
    const isSelected = button === selectedButton;

    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
    button.setAttribute("tabindex", isSelected ? "0" : "-1");
  });

  tabPanels.forEach((panel) => {
    const isTargetPanel = panel.id === targetPanelId;

    panel.classList.toggle("is-active", isTargetPanel);
    panel.hidden = !isTargetPanel;
  });
}

const activityGalleries = {
  "reading-universe": [
    {
      src: "images/閱讀小宇宙-2.jpg",
      alt: "閱讀小宇宙新學年閱讀啟動禮照片 1",
      caption: "分享故事、主題書展與小遊戲的活動花絮。"
    },
    {
      src: "images/閱讀小宇宙-3.jpg",
      alt: "閱讀小宇宙新學年閱讀啟動禮照片 2",
      caption: "同學在活動中互動並訂下閱讀小目標。"
    },
    {
      src: "images/閱讀小宇宙-4.jpg",
      alt: "閱讀小宇宙新學年閱讀啟動禮照片 3",
      caption: "活力四射的閱讀啟動現場與圖書館展示。"
    }
  ],
  "family-reading-workshop": [
    {
      src: "images/親子共讀工作坊-2.png",
      alt: "親子共讀工作坊相片 1",
      caption: "親子一起閱讀繪本，享受互動共讀時光。"
    },
    {
      src: "images/親子共讀工作坊-3.png",
      alt: "親子共讀工作坊相片 2",
      caption: "孩子與家長透過角色扮演深入故事情節。"
    }
  ],
  "summer-reading-challenge": [
    {
      src: "images/暑期閱讀挑戰-1.png",
      alt: "暑期閱讀挑戰相片 1",
      caption: "同學完成閱讀任務並收集閱讀之光貼紙。"
    },
    {
      src: "images/暑期閱讀挑戰-2.png",
      alt: "暑期閱讀挑戰相片 2",
      caption: "歡樂的暑期閱讀活動現場。"
    }
  ]
};

let currentGallery = null;
let currentSlideIndex = 0;
let lastFocusedTrigger = null;

function setupActivityGallery() {
  const modal = document.getElementById("gallery-modal");
  const backdrop = modal.querySelector(".gallery-backdrop");
  const closeButton = modal.querySelector(".gallery-close");
  const prevButton = modal.querySelector(".gallery-prev");
  const nextButton = modal.querySelector(".gallery-next");
  const imageElement = modal.querySelector(".gallery-image");
  const counterElement = modal.querySelector(".gallery-counter");
  const captionElement = modal.querySelector(".gallery-caption");

  const galleryTriggers = document.querySelectorAll(".gallery-trigger");

  if (!modal || !galleryTriggers.length) {
    return;
  }

  galleryTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();

      const galleryId = trigger.dataset.gallery;
      if (!galleryId || !activityGalleries[galleryId]) {
        return;
      }

      lastFocusedTrigger = trigger;
      currentGallery = activityGalleries[galleryId];
      currentSlideIndex = 0;
      renderGallerySlide();
      openGalleryModal();
    });
  });

  closeButton.addEventListener("click", closeGalleryModal);
  backdrop.addEventListener("click", closeGalleryModal);
  prevButton.addEventListener("click", showPreviousSlide);
  nextButton.addEventListener("click", showNextSlide);

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeGalleryModal();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextSlide();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousSlide();
    }
  });

  function openGalleryModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    closeButton.focus();
  }

  function closeGalleryModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    currentGallery = null;
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
    }
  }

  function renderGallerySlide() {
    const slide = currentGallery[currentSlideIndex];
    imageElement.src = slide.src;
    imageElement.alt = slide.alt;
    counterElement.textContent = `第 ${currentSlideIndex + 1} / ${currentGallery.length} 張`;
    captionElement.textContent = slide.caption;
  }

  function showPreviousSlide() {
    if (!currentGallery) {
      return;
    }
    currentSlideIndex = (currentSlideIndex - 1 + currentGallery.length) % currentGallery.length;
    renderGallerySlide();
  }

  function showNextSlide() {
    if (!currentGallery) {
      return;
    }
    currentSlideIndex = (currentSlideIndex + 1) % currentGallery.length;
    renderGallerySlide();
  }
}

function setupLocationMap() {
  const mapContainer = document.getElementById("location-map");

  if (!mapContainer) {
    return;
  }

  const latitude = parseFloat(mapContainer.dataset.lat);
  const longitude = parseFloat(mapContainer.dataset.lng);
  const zoom = parseInt(mapContainer.dataset.zoom, 10) || 16;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    mapContainer.innerHTML = `
      <div>
        <span>地圖設定錯誤，請檢查 latitude / longitude。</span>
      </div>
    `;
    return;
  }

  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=zh-TW&z=${zoom}&output=embed`;

  mapContainer.innerHTML = `
    <iframe
      width="600"
      height="450"
      loading="lazy"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
      src="${mapUrl}"
      title="溯光圖書館位置地圖"
    ></iframe>
  `;
}

function setupReservationForm() {
  const form = document.getElementById("reservation-form");
  const successMessage = document.getElementById("form-success-message");

  if (!form || !successMessage) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    form.hidden = true;
    successMessage.hidden = false;
    successMessage.setAttribute("tabindex", "-1");
    successMessage.focus();
  });
}

function updateFooterYear() {
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}