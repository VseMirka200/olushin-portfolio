/**
 * Основной клиентский скрипт сайта.
 * Здесь собрана логика темы, навигации, анимаций, галереи и модальных окон.
 */

/**
 * Программно скачивает файл, даже если браузер предпочитает открыть его во вкладке.
 * Сначала пробуем загрузить файл через fetch и сохранить как blob,
 * а если это не удалось — откатываемся к обычной ссылке с download.
 *
 * @param {string} src
 * @param {string} fileName
 */
const EMBEDDED_GALLERY_MANIFESTS = {
  'students-manifest.json': [
    'content/achievements/students/2026-02-27_1.webp',
    'content/achievements/students/2026-02-27_2.webp',
    'content/achievements/students/2026-02-27_3.webp',
    'content/achievements/students/2026-02-27_4.webp',
    'content/achievements/students/2026-02-27_5.webp',
    'content/achievements/students/2026-02-27_6.webp',
    'content/achievements/students/2026-02-27_7.webp',
    'content/achievements/students/2026-02-27_8.webp',
    'content/achievements/students/2026-02-27_9.webp',
    'content/achievements/students/2026-02-27_10.webp',
    'content/achievements/students/2026-02-27_11.webp',
    'content/achievements/students/2026-03-03_12.webp',
    'content/achievements/students/2026-03-05_13.webp',
    'content/achievements/students/2026-03-05_14.webp',
    'content/achievements/students/2026-03-25_15.webp',
    'content/achievements/students/2026-03-26_16.webp',
    'content/achievements/students/2026-03-26_17.webp',
    'content/achievements/students/2026-04-22_18.webp',
    'content/achievements/students/2026-04-22_19.webp',
    'content/achievements/students/2026-04-22_20.webp',
  ],
  'teacher-manifest.json': [
    'content/achievements/teacher/2026-02-27_1.webp',
    'content/achievements/teacher/2026-02-27_2.webp',
    'content/achievements/teacher/2026-02-27_3.webp',
    'content/achievements/teacher/2026-02-27_4.webp',
    'content/achievements/teacher/2026-02-27_5.webp',
    'content/achievements/teacher/2026-02-27_6.webp',
    'content/achievements/teacher/2026-02-27_7.webp',
    'content/achievements/teacher/2026-02-27_8.webp',
    'content/achievements/teacher/2026-02-27_9.webp',
    'content/achievements/teacher/2026-02-27_10.webp',
    'content/achievements/teacher/2026-02-27_11.webp',
    'content/achievements/teacher/2026-02-27_12.webp',
    'content/achievements/teacher/2026-02-27_13.webp',
    'content/achievements/teacher/2026-02-27_14.webp',
    'content/achievements/teacher/2026-02-27_15.webp',
    'content/achievements/teacher/2026-02-27_16.webp',
    'content/achievements/teacher/2026-02-27_17.webp',
    'content/achievements/teacher/2026-02-27_18.webp',
    'content/achievements/teacher/2026-03-04_19.webp',
    'content/achievements/teacher/2026-03-25_20.webp',
    'content/achievements/teacher/2026-03-25_21.webp',
    'content/achievements/teacher/2026-05-04_22.webp',
  ],
};

async function forceDownloadFile(src, fileName) {
  if (!src) return;

  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const fallbackLink = document.createElement('a');
    fallbackLink.href = src;
    fallbackLink.download = fileName || 'file';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
  }
}

/**
 * Возвращает русскую форму слова по числу.
 * @param {number} value
 * @param {string[]} forms
 */
function pluralizeRu(value, forms) {
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/**
 * Считает стаж от даты начала до сегодняшнего дня.
 * @param {string} startDate
 * @param {Date} [endDate]
 */
function formatTeachingExperience(startDate, endDate = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return '';

  let years = endDate.getFullYear() - start.getFullYear();
  let months = endDate.getMonth() - start.getMonth();

  if (endDate.getDate() < start.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return '';
  if (years === 0 && months === 0) return 'менее месяца';

  const parts = [];
  if (years > 0) {
    parts.push(`${years} ${pluralizeRu(years, ['год', 'года', 'лет'])}`);
  }
  if (months > 0) {
    parts.push(`${months} ${pluralizeRu(months, ['месяц', 'месяца', 'месяцев'])}`);
  }

  return parts.join(' ');
}

/**
 * Автоматически подставляет педагогический стаж на главной странице.
 */
function initTeachingExperience() {
  const item = Array.from(document.querySelectorAll('.factlist li')).find((li) =>
    li.textContent.includes('Педагогический стаж:')
  );

  if (!item) return;

  const experience = formatTeachingExperience('2024-08-26');
  if (!experience) return;

  item.innerHTML = `<b>Педагогический стаж:</b> ${experience}`;
}

/**
 * Управляет мобильным меню в шапке сайта.
 */
class MobileMenu {
  /**
   * @param {{burgerSelector:string, navSelector:string}} opts
   */
  constructor(opts) {
    this.burger = document.querySelector(opts.burgerSelector);
    this.nav = document.querySelector(opts.navSelector);

    this.onBurgerClick = this.onBurgerClick.bind(this);
    this.onNavClick = this.onNavClick.bind(this);
    this.onDocClick = this.onDocClick.bind(this);
  }

  /**
   * @param {HTMLElement} gallery
   * @returns {string}
   */
  /**
   * Подключает обработчики, если нужные элементы есть на странице.
   */
  init() {
    if (!this.burger || !this.nav) return;

    this.burger.addEventListener('click', this.onBurgerClick);
    this.nav.addEventListener('click', this.onNavClick);
    document.addEventListener('click', this.onDocClick);
  }

  /**
   * @returns {boolean}
   */
  isOpen() {
    return this.nav.classList.contains('open');
  }

  /**
   * Открывает меню и обновляет aria-состояние.
   */
  open() {
    this.nav.classList.add('open');
    this.burger.setAttribute('aria-expanded', 'true');
  }

  /**
   * Закрывает меню и обновляет aria-состояние.
   */
  close() {
    this.nav.classList.remove('open');
    this.burger.setAttribute('aria-expanded', 'false');
  }

  /**
   * Переключает состояние меню.
   */
  toggle() {
    this.isOpen() ? this.close() : this.open();
  }

  /**
   * Обрабатывает клик по бургер-кнопке.
   * @param {MouseEvent} e
   */
  onBurgerClick(e) {
    e.preventDefault();
    this.toggle();
  }

  /**
   * Закрывает мобильное меню после перехода по ссылке.
   * @param {MouseEvent} e
   */
  onNavClick(e) {
    const link = e.target && e.target.closest && e.target.closest('a');
    if (link && this.isOpen()) this.close();
  }

  /**
   * Закрывает меню по клику вне шапки.
   * @param {MouseEvent} e
   */
  onDocClick(e) {
    if (!this.isOpen()) return;

    const inside = this.nav.contains(e.target) || this.burger.contains(e.target);
    if (!inside) this.close();
  }
}

/**
 * Управляет одним выпадающим меню.
 */
class Dropdown {
  /**
   * @param {{root:Element}} opts
   */
  constructor(opts) {
    this.root = opts.root;
    this.button = this.root.querySelector('[data-dropdown-btn]');
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  /**
   * Подключает обработчик к кнопке.
   */
  init() {
    if (!this.root || !this.button) return;
    this.button.addEventListener('click', this.onButtonClick);
  }

  /**
   * @returns {boolean}
   */
  isOpen() {
    return this.root.classList.contains('open');
  }

  /**
   * Открывает выпадающее меню.
   */
  open() {
    this.root.classList.add('open');
    this.button.setAttribute('aria-expanded', 'true');
  }

  /**
   * Закрывает выпадающее меню.
   */
  close() {
    this.root.classList.remove('open');
    this.button.setAttribute('aria-expanded', 'false');
  }

  /**
   * Переключает состояние меню.
   */
  toggle() {
    this.isOpen() ? this.close() : this.open();
  }

  /**
   * @param {MouseEvent} e
   */
  onButtonClick(e) {
    e.preventDefault();
    this.toggle();
  }
}

/**
 * Управляет всеми выпадающими меню на странице.
 */
class DropdownManager {
  constructor() {
    this.dropdowns = [];

    this.onDocClick = this.onDocClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  /**
   * Инициализирует все найденные dropdown-компоненты.
   */
  init() {
    const roots = Array.from(document.querySelectorAll('[data-dropdown]'));
    this.dropdowns = roots.map((root) => new Dropdown({ root }));
    this.dropdowns.forEach((dropdown) => dropdown.init());

    if (this.dropdowns.length) {
      document.addEventListener('click', this.onDocClick);
      document.addEventListener('keydown', this.onKeyDown);
    }
  }

  /**
   * Закрывает все выпадающие меню.
   */
  closeAll() {
    this.dropdowns.forEach((dropdown) => dropdown.close());
  }

  /**
   * Закрывает меню при клике вне dropdown-области.
   * @param {MouseEvent} e
   */
  onDocClick(e) {
    const clickedInside = this.dropdowns.some((dropdown) => dropdown.root.contains(e.target));
    if (!clickedInside) this.closeAll();
  }

  /**
   * Закрывает меню по Escape.
   * @param {KeyboardEvent} e
   */
  onKeyDown(e) {
    if (e.key === 'Escape') this.closeAll();
  }
}

/**
 * Плавно показывает элементы при появлении в зоне видимости.
 */
class RevealOnScroll {
  /**
   * @param {{
   *   selectors:string,
   *   maxDelayMs?:number,
   *   stepDelayMs?:number
   * }} opts
   */
  constructor(opts) {
    this.selectors = opts.selectors;
    this.maxDelayMs = opts.maxDelayMs ?? 300;
    this.stepDelayMs = opts.stepDelayMs ?? 60;
    this.observer = null;
  }

  /**
   * Инициализирует анимацию появления.
   */
  init() {
    const targets = Array.from(document.querySelectorAll(this.selectors));
    if (!targets.length) return;

    targets.forEach((el, idx) => {
      el.classList.add('reveal');
      const delay = Math.min(idx * this.stepDelayMs, this.maxDelayMs);
      el.style.transitionDelay = `${delay}ms`;
    });

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1,
      }
    );

    targets.forEach((el) => this.observer.observe(el));
  }
}

/**
 * Базовая логика для модального окна с изображением или PDF.
 * Используется и для портретного фото, и для документов.
 */
class MediaModal {
  /**
   * @param {{
   *   modalSelector:string,
   *   modalImgSelector:string,
   *   modalFrameSelector?:string,
   *   closeBtnSelector:string,
   *   downloadLinkSelector?:string
   * }} opts
   */
  constructor(opts) {
    this.modal = document.querySelector(opts.modalSelector);
    this.modalImg = document.querySelector(opts.modalImgSelector);
    this.modalFrame = opts.modalFrameSelector
      ? document.querySelector(opts.modalFrameSelector)
      : null;
    this.closeBtn = opts.closeBtnSelector
      ? document.querySelector(opts.closeBtnSelector)
      : null;
    this.downloadLink = opts.downloadLinkSelector
      ? document.querySelector(opts.downloadLinkSelector)
      : null;
  }

  /**
   * Открывает модалку и подставляет нужный тип контента.
   * @param {string} src
   */
  openMedia(src) {
    if (!src || !this.modal) return;

    this.modal.classList.toggle('img-modal--pdf', this.isPdf(src));
    this.setMediaSource(src);
    this.updateDownloadLink(src);
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  /**
   * Закрывает модалку и очищает контент.
   */
  closeMedia() {
    if (!this.modal) return;

    this.modal.setAttribute('aria-hidden', 'true');
    this.modal.classList.remove('img-modal--pdf');
    this.clearMediaSource();
    this.updateDownloadLink('');
    document.body.classList.remove('no-scroll');
  }

  /**
   * Показывает либо изображение, либо PDF во встроенном iframe.
   * @param {string} src
   */
  setMediaSource(src) {
    if (this.isPdf(src)) {
      if (this.modalImg) {
        this.modalImg.removeAttribute('src');
        this.modalImg.hidden = true;
      }
      if (this.modalFrame) {
        this.modalFrame.src = this.getPdfViewerSrc(src);
        this.modalFrame.hidden = false;
      }
      return;
    }

    if (this.modalFrame) {
      this.modalFrame.removeAttribute('src');
      this.modalFrame.hidden = true;
    }

    if (this.modalImg) {
      this.modalImg.src = src;
      this.modalImg.hidden = false;
    }
  }

  /**
   * Очищает и изображение, и iframe.
   */
  clearMediaSource() {
    if (this.modalImg) {
      this.modalImg.removeAttribute('src');
      this.modalImg.hidden = true;
    }

    if (this.modalFrame) {
      this.modalFrame.removeAttribute('src');
      this.modalFrame.hidden = true;
    }
  }

  /**
   * Проверяет, ведет ли ссылка на PDF.
   * @param {string} src
   * @returns {boolean}
   */
  isPdf(src) {
    try {
      const parsedUrl = new URL(src, window.location.href);
      return parsedUrl.pathname.toLowerCase().endsWith('.pdf');
    } catch (error) {
      return String(src || '').toLowerCase().includes('.pdf');
    }
  }

  /**
   * @param {string} src
   * @returns {string}
   */
  getPdfViewerSrc(src) {
    try {
      const parsedUrl = new URL(src, window.location.href);
      const params = new URLSearchParams(parsedUrl.hash.slice(1));
      params.set('toolbar', '0');
      params.set('navpanes', '0');
      parsedUrl.hash = params.toString();
      return parsedUrl.toString();
    } catch (error) {
      const separator = String(src).includes('#') ? '&' : '#';
      return `${src}${separator}toolbar=0&navpanes=0`;
    }
  }

  /**
   * Обновляет состояние кнопки скачивания.
   * @param {string} src
   */
  updateDownloadLink(src) {
    if (!this.downloadLink) return;

    if (!src) {
      this.downloadLink.removeAttribute('href');
      this.downloadLink.removeAttribute('download');
      this.downloadLink.removeAttribute('data-file-name');
      this.downloadLink.setAttribute('aria-disabled', 'true');
      this.downloadLink.tabIndex = -1;
      return;
    }

    this.downloadLink.href = src;
    this.downloadLink.download = this.extractFileName(src);
    this.downloadLink.dataset.fileName = this.extractFileName(src);
    this.downloadLink.removeAttribute('aria-disabled');
    this.downloadLink.tabIndex = 0;
  }

  /**
   * Возвращает имя файла из URL.
   * @param {string} src
   * @returns {string}
   */
  extractFileName(src) {
    try {
      const parsedUrl = new URL(src, window.location.href);
      const pathname = parsedUrl.pathname || '';
      return decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1)) || 'file';
    } catch (error) {
      return 'file';
    }
  }

  /**
   * @returns {boolean}
   */
  isOpen() {
    return this.modal?.getAttribute('aria-hidden') === 'false';
  }
}

/**
 * Отвечает за модалку портретного фото на главной странице.
 */
class ImageModal extends MediaModal {
  /**
   * @param {{
   *   triggerSelector:string,
   *   sourceImgSelector:string,
   *   modalSelector:string,
   *   modalImgSelector:string,
   *   modalFrameSelector?:string,
   *   closeBtnSelector:string,
   *   downloadLinkSelector?:string
   * }} opts
   */
  constructor(opts) {
    super(opts);

    this.trigger = document.querySelector(opts.triggerSelector);
    this.sourceImg = document.querySelector(opts.sourceImgSelector);

    this.onTriggerClick = this.onTriggerClick.bind(this);
    this.onTriggerKeyDown = this.onTriggerKeyDown.bind(this);
    this.onModalClick = this.onModalClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onCloseClick = this.onCloseClick.bind(this);
  }

  /**
   * Подключает обработчики модалки портрета.
   */
  init() {
    if (!this.trigger || !this.sourceImg || !this.modal || !this.modalImg) return;

    this.trigger.addEventListener('click', this.onTriggerClick);
    this.trigger.addEventListener('keydown', this.onTriggerKeyDown);
    this.modal.addEventListener('click', this.onModalClick);
    document.addEventListener('keydown', this.onKeyDown);

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this.onCloseClick);
    }
  }

  /**
   * Открывает портрет в модалке.
   */
  open() {
    const imageSrc = this.sourceImg.currentSrc || this.sourceImg.src;
    this.openMedia(imageSrc);
  }

  /**
   * Закрывает модалку портрета.
   */
  close() {
    this.closeMedia();
  }

  /**
   * @param {KeyboardEvent} e
   */
  onTriggerKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.open();
    }
  }

  /**
   * Открытие по клику на карточку фото.
   */
  onTriggerClick() {
    this.open();
  }

  /**
   * Закрытие по кнопке.
   */
  onCloseClick() {
    this.close();
  }

  /**
   * Закрытие по клику на затемнение.
   * @param {MouseEvent} e
   */
  onModalClick(e) {
    if (e.target === this.modal) this.close();
  }

  /**
   * Закрытие по Escape.
   * @param {KeyboardEvent} e
   */
  onKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen()) this.close();
  }
}

/**
 * Управляет переключателем темы.
 */
class AutoGallery {
  constructor(opts = {}) {
    this.selector = opts.selector ?? '[data-auto-gallery]';
    this.allowedExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'pdf']);
    this.collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
    this.cache = new Map();
    this.controls = new Map();
    this.storagePrefix = 'olyushinvv:auto-gallery:';
    this.storageVersion = 'v2';
    this.storageTtlMs = 7 * 24 * 60 * 60 * 1000;
  }

  /**
   * Инициализирует все галереи на странице.
   */
  init() {
    const galleries = Array.from(document.querySelectorAll(this.selector));

    galleries.forEach((gallery) => {
      this.bindControls(gallery);
      this.loadGallery(gallery);
    });
  }

  /**
   * Загружает содержимое одной галереи через GitHub API.
   * @param {HTMLElement} gallery
   */
  async loadGallery(gallery) {
    const cfg = this.getConfig(gallery);
    if (!cfg) {
      this.renderMessage(gallery, 'Ошибка конфигурации галереи.');
      return;
    }

    try {
      const cached = this.loadPersistentCache(cfg);
      if (cached && cached.length) {
        this.cache.set(gallery, cached);
        this.renderFromCache(gallery, cfg);
        return;
      }

      const files = await this.fetchRepoFiles(cfg);
      const images = files
        .filter((item) => item && item.type === 'file' && this.isAllowedFile(item.name))
        .map((item) => ({
          name: item.name,
          path: item.path || item.name,
          urlPath: this.getRelativeRepoPath(cfg.path, item.path || item.name),
          isPdf: this.isPdfFile(item.name),
          dateMs: this.extractDateFromName(item.name),
          displayName: this.extractDisplayName(item.path || item.name),
        }));

      if (!images.length) {
        this.renderMessage(gallery, 'В этой папке пока нет изображений.');
        return;
      }

      this.cache.set(gallery, images);
      this.savePersistentCache(cfg, images);
      this.renderFromCache(gallery, cfg);
    } catch (error) {
      console.error('AutoGallery error:', error);
      const fallback = this.getEmbeddedManifestFiles(cfg.manifest);
      if (fallback.length) {
        const images = fallback
          .filter((item) => item && item.type === 'file' && this.isAllowedFile(item.name))
          .map((item) => ({
            name: item.name,
            path: item.path || item.name,
            urlPath: this.getRelativeRepoPath(cfg.path, item.path || item.name),
            isPdf: this.isPdfFile(item.name),
            dateMs: this.extractDateFromName(item.name),
            displayName: this.extractDisplayName(item.path || item.name),
          }));

        if (images.length) {
          this.cache.set(gallery, images);
          this.savePersistentCache(cfg, images);
          this.renderFromCache(gallery, cfg);
          return;
        }
      }

      this.renderMessage(gallery, 'Не удалось загрузить изображения автоматически.');
    }
  }

  /**
   * Считывает конфигурацию галереи из data-атрибутов.
   * @param {HTMLElement} gallery
   * @returns {null|{owner:string, repo:string, path:string, base:string, title:string, branch:string, sortMode:string}}
   */
  getConfig(gallery) {
    // Настройки галереи приходят из data-* атрибутов страницы.
    const owner = gallery.dataset.repoOwner;
    const repo = gallery.dataset.repoName;
    const category = this.getGalleryCategory(gallery);
    const path = this.getGalleryPath(gallery, category);
    const base = this.getGalleryBase(gallery, category);
    const manifest = this.getGalleryManifest(gallery, category);
    const title = this.getGalleryTitle(gallery, category);
    const branch = gallery.dataset.galleryBranch || gallery.dataset.repoBranch || '';
    const sortMode = this.normalizeSortMode(gallery.dataset.gallerySort || 'name-asc');

    if (!owner || !repo || !path || !base) return null;
    return { owner, repo, path, base, manifest, title, branch, sortMode };
  }

  /**
   * Возвращает путь файла относительно корневой папки галереи.
   * @param {string} rootPath
   * @param {string} fullPath
   * @returns {string}
   */
  getRelativeRepoPath(rootPath, fullPath) {
    const root = String(rootPath || '').replace(/^\/+|\/+$/g, '');
    const full = String(fullPath || '').replace(/^\/+|\/+$/g, '');

    if (!root) return full;
    if (full === root) return '';

    const prefix = `${root}/`;
    return full.startsWith(prefix) ? full.slice(prefix.length) : full;
  }

  /**
   * @param {HTMLElement} gallery
   * @returns {string}
   */
  getGalleryCategory(gallery) {
    const cached = this.controls.get(gallery) || {};
    const categoryEl = cached.categoryEl || null;
    const value = String(categoryEl?.value || gallery.dataset.galleryCategory || 'diplomas').toLowerCase();
    return value === 'certificates' ? 'certificates' : 'diplomas';
  }

  /**
   * @param {HTMLElement} gallery
   * @param {string} category
   * @returns {string}
   */
  getGalleryPath(gallery, category) {
    if (category === 'certificates' && gallery.dataset.galleryPathCertificates) {
      return gallery.dataset.galleryPathCertificates;
    }
    return gallery.dataset.galleryPath || '';
  }

  /**
   * @param {HTMLElement} gallery
   * @param {string} category
   * @returns {string}
   */
  getGalleryBase(gallery, category) {
    if (category === 'certificates' && gallery.dataset.galleryBaseCertificates) {
      return gallery.dataset.galleryBaseCertificates;
    }
    return gallery.dataset.galleryBase || '';
  }

  /**
   * @param {HTMLElement} gallery
   * @param {string} category
   * @returns {string}
   */
  getGalleryManifest(gallery, category) {
    if (category === 'certificates' && gallery.dataset.galleryManifestCertificates) {
      return gallery.dataset.galleryManifestCertificates;
    }
    return gallery.dataset.galleryManifest || '';
  }

  /**
   * Возвращает ключ кэша для конкретной галереи.
   * @param {{path:string, manifest:string, base:string, branch:string}} cfg
   * @returns {string}
   */
  getCacheKey(cfg) {
    const parts = [
      this.storageVersion,
      cfg.branch || 'main',
      cfg.path || '',
      cfg.manifest || '',
      cfg.base || '',
    ];

    return `${this.storagePrefix}${parts.join('|')}`;
  }

  /**
   * Загружает галерею из localStorage, если кэш ещё актуален.
   * @param {{path:string, manifest:string, base:string, branch:string}} cfg
   * @returns {Array<{name:string,type?:string,path?:string,urlPath?:string,isPdf?:boolean,dateMs?:number|null,displayName?:string}>|null}
   */
  loadPersistentCache(cfg) {
    try {
      const raw = localStorage.getItem(this.getCacheKey(cfg));
      if (!raw) return null;

      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== 'object') return null;

      const cachedAt = Number(payload.cachedAt || 0);
      if (!cachedAt || Date.now() - cachedAt > this.storageTtlMs) return null;

      const items = Array.isArray(payload.items) ? payload.items : [];
      if (!items.length) return null;

      return items.filter((item) => item && item.name && item.path);
    } catch (error) {
      return null;
    }
  }

  /**
   * Сохраняет галерею в localStorage.
   * @param {{path:string, manifest:string, base:string, branch:string}} cfg
   * @param {Array<{name:string,path:string,urlPath:string,isPdf:boolean,dateMs:number|null,displayName:string}>} items
   */
  savePersistentCache(cfg, items) {
    try {
      const payload = {
        cachedAt: Date.now(),
        items,
      };

      localStorage.setItem(this.getCacheKey(cfg), JSON.stringify(payload));
    } catch (error) {
      // Игнорируем ошибки кэширования, чтобы не мешать загрузке галереи.
    }
  }

  /**
   * @param {HTMLElement} gallery
   * @param {string} category
   * @returns {string}
   */
  getGalleryTitle(gallery, category) {
    if (category === 'certificates' && gallery.dataset.galleryTitleCertificates) {
      return gallery.dataset.galleryTitleCertificates;
    }
    return gallery.dataset.galleryTitle || 'Документ';
  }

  /**
   * Загружает список файлов из указанной папки репозитория.
   * @param {{owner:string, repo:string, path:string, branch:string}} cfg
   */
  async fetchRepoFiles(cfg) {
    if (cfg.manifest) {
      const manifestItems = await this.fetchManifestFiles(cfg.manifest);
      if (manifestItems.length) {
        return manifestItems;
      }
    }

    return this.fetchRepoFilesRecursive(cfg, cfg.path);
  }

  /**
   * Загружает список файлов из локального манифеста.
   * @param {string} manifestPath
   * @returns {Promise<Array<{name:string,type:string,path?:string}>>}
   */
  async fetchManifestFiles(manifestPath) {
    const embedded = this.getEmbeddedManifestFiles(manifestPath);
    if (embedded.length) {
      return embedded;
    }

    try {
      const response = await fetch(manifestPath, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return [];

      const payload = await response.json();
      if (!Array.isArray(payload)) return [];

      const items = payload
        .map((item) => this.normalizeManifestItem(item))
        .filter(Boolean);

      return items.length ? items : embedded;
    } catch (error) {
      return embedded;
    }
  }

  /**
   * Возвращает встроенный список файлов для локальной работы без fetch.
   * @param {string} manifestPath
   * @returns {Array<{name:string,type:string,path?:string}>}
   */
  getEmbeddedManifestFiles(manifestPath) {
    const fileName = this.extractManifestFileName(manifestPath);
    const items = EMBEDDED_GALLERY_MANIFESTS[fileName] || [];

    return items
      .map((item) => this.normalizeManifestItem(item))
      .filter(Boolean);
  }

  /**
   * Извлекает имя manifest-файла из пути.
   * @param {string} manifestPath
   * @returns {string}
   */
  extractManifestFileName(manifestPath) {
    try {
      const parsedUrl = new URL(manifestPath, window.location.href);
      return decodeURIComponent(parsedUrl.pathname.split('/').filter(Boolean).pop() || '');
    } catch (error) {
      return decodeURIComponent(String(manifestPath || '').split(/[?#]/)[0].split('/').filter(Boolean).pop() || '');
    }
  }

  /**
   * Приводит элемент манифеста к формату файлов GitHub API.
   * @param {string|object} item
   * @returns {null|{name:string,type:string,path?:string}}
   */
  normalizeManifestItem(item) {
    if (typeof item === 'string') {
      const cleanPath = item.trim();
      if (!cleanPath) return null;
      return {
        name: cleanPath.split('/').filter(Boolean).pop() || cleanPath,
        path: cleanPath,
        type: 'file',
      };
    }

    if (!item || typeof item !== 'object') return null;

    const name = String(item.name || '').trim();
    const path = String(item.path || item.name || '').trim();
    if (!name && !path) return null;

    return {
      name: name || path.split('/').filter(Boolean).pop() || path,
      path: path || name,
      type: item.type || 'file',
    };
  }

  /**
   * Рекурсивно собирает файлы из папки репозитория и всех вложенных подпапок.
   * @param {{owner:string, repo:string, path:string, branch:string}} cfg
   * @param {string} path
   * @returns {Promise<Array<{name:string,type:string,path?:string}>>}
   */
  async fetchRepoFilesRecursive(cfg, path) {
    const encodedPath = path
      .split('/')
      .filter(Boolean)
      .map((part) => encodeURIComponent(part))
      .join('/');

    const refQuery = cfg.branch ? `?ref=${encodeURIComponent(cfg.branch)}` : '';
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedPath}${refQuery}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : [];
    const files = [];

    for (const item of items) {
      if (!item || !item.type) continue;
      if (item.type === 'file') {
        files.push(item);
        continue;
      }

      if (item.type === 'dir' && item.path) {
        const nested = await this.fetchRepoFilesRecursive(cfg, item.path);
        files.push(...nested);
      }
    }

    return files;
  }

  /**
   * Проверяет, является ли файл изображением.
   * @param {string} name
   * @returns {boolean}
   */
  isAllowedFile(name) {
    const idx = name.lastIndexOf('.');
    if (idx < 0) return false;
    const ext = name.slice(idx + 1).toLowerCase();
    return this.allowedExt.has(ext);
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  isPdfFile(name) {
    return String(name || '').toLowerCase().endsWith('.pdf');
  }

  /**
   * Привязывает сортировку и фильтры к галерее.
   * @param {HTMLElement} gallery
   */
  bindControls(gallery) {
    const id = gallery.dataset.galleryId;
    if (!id) return;

    const controls = document.querySelector(
      `[data-gallery-controls][data-gallery-target="${id}"]`
    );
    if (!controls) return;

    const categoryEl = controls.querySelector('[data-gallery-category]');
    const sortEl = controls.querySelector('[data-gallery-sort]');
    const fromEl = controls.querySelector('[data-gallery-from]');
    const toEl = controls.querySelector('[data-gallery-to]');
    const searchEl = controls.querySelector('[data-gallery-search]');
    const searchClearBtn = controls.querySelector('[data-gallery-search-clear]');
    const clearBtn = controls.querySelector('[data-gallery-clear]');

    this.controls.set(gallery, {
      controls,
      categoryEl,
      sortEl,
      fromEl,
      toEl,
      searchEl,
      searchClearBtn,
      clearBtn,
    });

    if (categoryEl && gallery.dataset.galleryCategory) {
      categoryEl.value = gallery.dataset.galleryCategory;
    }

    if (sortEl && gallery.dataset.gallerySort) {
      sortEl.value = gallery.dataset.gallerySort;
    }

    const onChange = () => this.renderFromCache(gallery);
    if (categoryEl) {
      categoryEl.addEventListener('change', () => {
        this.cache.delete(gallery);
        this.loadGallery(gallery);
      });
    }
    if (sortEl) sortEl.addEventListener('change', onChange);
    if (fromEl) fromEl.addEventListener('change', onChange);
    if (toEl) toEl.addEventListener('change', onChange);
    if (searchEl) searchEl.addEventListener('input', onChange);

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (fromEl) fromEl.value = '';
        if (toEl) toEl.value = '';
        if (sortEl) sortEl.value = gallery.dataset.gallerySort || 'name-asc';
        this.renderFromCache(gallery);
      });
    }

    if (searchClearBtn && searchEl) {
      searchClearBtn.addEventListener('click', () => {
        searchEl.value = '';
        this.renderFromCache(gallery);
        searchEl.focus();
      });
    }
  }

  /**
   * Перерисовывает галерею из кэша после сортировки и фильтрации.
   * @param {HTMLElement} gallery
   * @param {object|null} cfgOverride
   */
  renderFromCache(gallery, cfgOverride = null) {
    const cached = this.cache.get(gallery);
    if (!cached || !cached.length) return;

    const cfg = cfgOverride || this.getConfig(gallery);
    if (!cfg) return;

    const { sortMode, fromMs, toMs } = this.getControlState(gallery, cfg);
    let images = this.filterByRange(cached, fromMs, toMs);
    images = this.filterBySearch(images, this.getSearchQuery(gallery));
    images = this.sortImages(images, sortMode);

    if (!images.length) {
      this.renderMessage(
        gallery,
        this.getSearchQuery(gallery) ? 'Ничего не найдено.' : 'Нет файлов в выбранном диапазоне.'
      );
      return;
    }

    this.renderTiles(gallery, images, cfg);
  }

  /**
   * Возвращает текущее состояние контролов галереи.
   * @param {HTMLElement} gallery
   * @param {{sortMode:string}} cfg
   */
  getControlState(gallery, cfg) {
    const cached = this.controls.get(gallery) || {};
    const sortEl = cached.sortEl || null;
    const fromEl = cached.fromEl || null;
    const toEl = cached.toEl || null;

    const sortMode = this.normalizeSortMode(sortEl?.value || cfg.sortMode || 'name-asc');
    const fromMs = this.parseDateInput(fromEl?.value);
    const toMs = this.parseDateInput(toEl?.value, { endOfDay: true });
    const searchQuery = this.getSearchQuery(gallery);

    return { sortMode, fromMs, toMs, searchQuery };
  }

  /**
   * Возвращает строку поиска для текущей галереи.
   * @param {HTMLElement} gallery
   * @returns {string}
   */
  getSearchQuery(gallery) {
    const cached = this.controls.get(gallery) || {};
    const searchEl = cached.searchEl || null;
    return String(searchEl?.value || '').trim().toLowerCase();
  }

  /**
   * Парсит дату из поля фильтра.
   * Поддерживает форматы `дд.мм.гггг` и `гггг-мм-дд`.
   *
   * @param {string} value
   * @param {{endOfDay?:boolean}} opts
   * @returns {number|null}
   */
  parseDateInput(value, opts = {}) {
    if (!value) return null;

    const trimmed = String(value).trim();
    let dateStr = trimmed;

    const dmy = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dmy) {
      dateStr = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }

    const iso = opts.endOfDay ? `${dateStr}T23:59:59.999` : `${dateStr}T00:00:00.000`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  /**
   * Отфильтровывает изображения по диапазону дат.
   * @param {Array<{name:string, dateMs:number|null}>} images
   * @param {number|null} fromMs
   * @param {number|null} toMs
   */
  filterByRange(images, fromMs, toMs) {
    if (!fromMs && !toMs) return images;

    return images.filter((img) => {
      if (!img.dateMs) return false;
      if (fromMs && img.dateMs < fromMs) return false;
      if (toMs && img.dateMs > toMs) return false;
      return true;
    });
  }

  /**
   * Сортирует изображения по имени или по дате.
   * @param {Array<{name:string, dateMs:number|null}>} images
   * @param {string} sortMode
   */
  sortImages(images, sortMode) {
    const [modeRaw, dirRaw] = String(sortMode || 'name-asc').split('-');
    const mode = modeRaw === 'date' ? 'date' : 'name';
    const dir = dirRaw === 'desc' ? 'desc' : 'asc';
    const dirFactor = dir === 'desc' ? -1 : 1;

    return [...images].sort((a, b) => {
      if (mode === 'date') {
        const dateA = a.dateMs ?? this.extractDateFromName(a.name);
        const dateB = b.dateMs ?? this.extractDateFromName(b.name);

        if (dateA && dateB) {
          const dateCompare = dateA - dateB;
          if (dateCompare !== 0) return dateCompare * dirFactor;
          return this.collator.compare(a.name, b.name) * dirFactor;
        }
        if (dateA) return -1 * dirFactor;
        if (dateB) return 1 * dirFactor;
      }

      return this.collator.compare(a.name, b.name) * dirFactor;
    });
  }

  /**
   * Приводит режим сортировки к безопасному виду.
   * @param {string} value
   * @returns {string}
   */
  normalizeSortMode(value) {
    const [modeRaw, dirRaw] = String(value || 'name-asc').split('-');
    const mode = modeRaw === 'date' ? 'date' : 'name';
    const dir = dirRaw === 'desc' ? 'desc' : 'asc';
    return `${mode}-${dir}`;
  }

  /**
   * Пытается извлечь дату из имени файла.
   * Поддерживаются форматы:
   * - YYYY-MM-DD
   * - YYYY_MM_DD
   * - DD-MM-YYYY
   * - DD_MM_YYYY
   *
   * @param {string} name
   * @returns {number|null}
   */
  extractDateFromName(name) {
    const clean = String(name || '').replace(/\.[^.]+$/, '');

    const ymd = clean.match(/(20\d{2})[-_.](\d{1,2})[-_.](\d{1,2})/);
    if (ymd) {
      const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }

    const dmy = clean.match(/(\d{1,2})[-_.](\d{1,2})[-_.](20\d{2})/);
    if (dmy) {
      const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }

    return null;
  }

  /**
   * Собирает публичный URL файла для браузера.
   * @param {string} base
   * @param {string} fileName
   * @returns {string}
   */
  buildImageUrl(base, fileName) {
    const cleanBase = base.replace(/\/$/, '');
    const encodedPath = String(fileName || '')
      .split('/')
      .filter(Boolean)
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${cleanBase}/${encodedPath}`;
  }

  /**
   * Рендерит плитки галереи.
   * @param {HTMLElement} gallery
   * @param {Array<{name:string,isPdf?:boolean}>} images
   * @param {{base:string, title:string}} cfg
   */
  renderTiles(gallery, images, cfg) {
    gallery.innerHTML = '';

    images.forEach((file, index) => {
      // PDF и изображения обрабатываются одним и тем же рендером.
      const imageUrl = this.buildImageUrl(cfg.base, file.urlPath || file.name);
      const formatLabel = this.getFileFormatLabel(file.name);
      const displayName = file.displayName || this.extractDisplayName(file.name);

      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('data-img', imageUrl);

      const media = document.createElement('div');
      media.className = 'tile-media';
      const showCaption = gallery.dataset.galleryCaption === 'true';

      if (file.isPdf) {
        tile.classList.add('tile--pdf');

        const frame = document.createElement('iframe');
        frame.className = 'tile-pdf__preview';
        frame.src = `${imageUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
        frame.setAttribute('title', `${cfg.title} ${index + 1}`);
        frame.setAttribute('loading', 'lazy');
        frame.setAttribute('tabindex', '-1');
        frame.setAttribute('aria-hidden', 'true');

        const badge = document.createElement('span');
        badge.className = 'tile-pdf__badge';
        badge.textContent = 'PDF';
        media.appendChild(frame);
        media.appendChild(badge);
      } else {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = displayName || `${cfg.title} ${index + 1}`;
        img.loading = 'lazy';
        img.decoding = 'async';

        media.appendChild(img);
      }

      const badge = document.createElement('span');
      badge.className = 'tile-format__badge';
      badge.textContent = formatLabel;
      media.appendChild(badge);

      tile.appendChild(media);

      if (showCaption) {
        const caption = document.createElement('div');
        caption.className = 'cap';
        caption.textContent = displayName;
        tile.appendChild(caption);
      }

      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'tile-open';
      openButton.setAttribute('aria-label', `Открыть ${displayName || file.name}`);
      tile.appendChild(openButton);

      gallery.appendChild(tile);
    });
  }

  /**
   * @param {string} fileName
   * @returns {string}
   */
  extractDisplayName(fileName) {
    const raw = String(fileName || '');
    const lower = raw.toLowerCase();

    const knownTitles = [
      ['проект 1 - разработка по поехали! славгород', 'Разработка мобильного ПО «Поехали! Славгород»'],
      ['проект 2 - мультифора', 'Разработка ПО «Мультифора»'],
      ['проект 3 - веб-сайт бара прибой', 'Проект «Бар Прибой»'],
      ['проект 4 - разработка веб-сайта по продаже комплектующих', 'Выпускная квалификационная работа'],
      ['poehali-slavgorod-project', 'Разработка мобильного ПО «Поехали! Славгород»'],
      ['multiforka-project', 'Разработка ПО «Мультифорка»'],
      ['bar-priboy-project', 'Проект «Бар Прибой»'],
      ['osipov-danil-final-thesis', 'Выпускная квалификационная работа'],
      ['документ.pdf', 'Документ'],
      ['программа.zip', 'Программа'],
    ];

    for (const [needle, title] of knownTitles) {
      if (lower.includes(needle)) return title;
    }

    const stem = raw.replace(/\.[^.]+$/, '');
    return stem.split(/[\\/]/).pop().replace(/[_-]+/g, ' ').trim();
  }

  /**
   * @param {string} fileName
   * @returns {string}
   */
  getFileFormatLabel(fileName) {
    const idx = String(fileName || '').lastIndexOf('.');
    if (idx < 0) return 'FILE';

    const ext = String(fileName || '').slice(idx + 1).toLowerCase();
    if (ext === 'jpeg') return 'JPG';
    return ext.toUpperCase();
  }

  /**
   * Показывает текстовое сообщение вместо галереи.
   * @param {HTMLElement} gallery
   * @param {string} text
   */
  renderMessage(gallery, text) {
    gallery.innerHTML = '';

    const msg = document.createElement('p');
    msg.className = 'subtitle';
    msg.style.margin = '0';
    msg.textContent = text;

    gallery.appendChild(msg);
  }
}

/**
 * Лайтбокс для плиток галереи и кликабельных карточек документов.
 */
class GalleryLightbox extends MediaModal {
  /**
   * @param {{
   *   modalSelector:string,
   *   modalImgSelector:string,
   *   modalFrameSelector?:string,
   *   closeBtnSelector:string,
   *   downloadLinkSelector?:string
   * }} opts
   */
  constructor(opts) {
    super(opts);

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onDownloadClick = this.onDownloadClick.bind(this);
  }

  /**
   * Подключает обработчики глобально на документ.
   */
  init() {
    if (!this.modal || !this.modalImg) return;

    document.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKeyDown);

    if (this.downloadLink) {
      this.downloadLink.addEventListener('click', this.onDownloadClick);
    }
  }

  /**
   * Открывает модалку по ссылке на файл.
   * @param {string} src
   */
  open(src) {
    this.openMedia(src);
  }

  /**
   * Закрывает лайтбокс.
   */
  close() {
    this.closeMedia();
  }

  /**
   * Перехватывает клик по плитке, карточке документа, оверлею и кнопке закрытия.
   * @param {MouseEvent} e
   */
  onClick(e) {
    if (e.target === this.modal) {
      this.close();
      return;
    }

    const target = e.target && e.target.closest ? e.target : null;
    if (!target) return;

    const tile = target.closest('.tile[data-img]');
    if (tile) {
      this.open(tile.getAttribute('data-img'));
      return;
    }

    const projectPdf = target.closest('.project-card__actions a[href]');
    if (projectPdf) {
      const src = projectPdf.getAttribute('data-img') || projectPdf.getAttribute('href');
      if (this.isPdf(src)) {
        e.preventDefault();
        this.open(src);
        return;
      }
    }

    const link = target.closest('.row--link[data-img], .row--link[href]');
    if (link) {
      e.preventDefault();
      this.open(link.getAttribute('data-img') || link.getAttribute('href'));
    }
  }

  /**
   * Поддерживает открытие с клавиатуры и закрытие по Escape.
   * @param {KeyboardEvent} e
   */
  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
      return;
    }

    if (e.key !== 'Enter' && e.key !== ' ') return;

    const target = e.target && e.target.closest ? e.target : null;
    if (!target) return;

    const tile = target.closest('.tile[data-img]');
    if (tile) {
      e.preventDefault();
      this.open(tile.getAttribute('data-img'));
      return;
    }

    const projectPdf = target.closest('.project-card__actions a[href]');
    if (projectPdf) {
      const src = projectPdf.getAttribute('data-img') || projectPdf.getAttribute('href');
      if (this.isPdf(src)) {
        e.preventDefault();
        this.open(src);
        return;
      }
    }

    const link = target.closest('.row--link[data-img], .row--link[href]');
    if (!link) return;

    e.preventDefault();
    this.open(link.getAttribute('data-img') || link.getAttribute('href'));
  }

  /**
   * Принудительно скачивает текущий файл из модалки.
   * @param {MouseEvent} e
   */
  onDownloadClick(e) {
    if (!this.downloadLink || this.downloadLink.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    const src = this.downloadLink.getAttribute('href');
    const fileName = this.downloadLink.dataset.fileName || this.downloadLink.getAttribute('download') || 'file';
    forceDownloadFile(src, fileName);
  }
}

/**
 * Обрабатывает кнопки скачивания полных проектов.
 */
class ProjectDownloadManager {
  constructor() {
    this.onClick = this.onClick.bind(this);
  }

  /**
   * Подключает делегирование кликов.
   */
  init() {
    document.addEventListener('click', this.onClick);
  }

  /**
   * @param {MouseEvent} e
   */
  onClick(e) {
    const button = e.target && e.target.closest ? e.target.closest('[data-project-download]') : null;
    if (!button) return;

    e.preventDefault();

    const src = button.getAttribute('data-project-src');
    const fileName = button.getAttribute('data-project-name') || 'project.pdf';
    forceDownloadFile(src, fileName);
  }
}

/**
 * Фильтрует проекты по текстовому поиску.
 */
class ProjectSearchManager {
  constructor() {
    this.roots = [];
    this.onInput = this.onInput.bind(this);
    this.onClearClick = this.onClearClick.bind(this);
  }

  /**
   * Подключает поиск к найденным блокам.
   */
  init() {
    this.roots = Array.from(document.querySelectorAll('[data-project-search]'))
      .map((root) => this.buildContext(root))
      .filter(Boolean);

    this.roots.forEach((ctx) => {
      ctx.input.addEventListener('input', this.onInput);
      ctx.clearBtn.addEventListener('click', this.onClearClick);
      this.update(ctx);
    });
  }

  /**
   * Фильтрует изображения по поисковой строке.
   * @param {Array<{name:string, displayName?:string, path?:string}>} images
   * @param {string} query
   * @returns {Array<{name:string, displayName?:string, path?:string}>}
   */
  filterBySearch(images, query) {
    const cleanQuery = String(query || '').trim().toLowerCase();
    if (!cleanQuery) return images;

    return images.filter((img) => {
      const haystack = [
        img.displayName,
        img.name,
        img.path,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(cleanQuery);
    });
  }

  /**
   * @param {HTMLElement} root
   * @returns {null|{root:HTMLElement,input:HTMLInputElement,clearBtn:HTMLButtonElement,empty:HTMLElement|null,cards:Array<{card:HTMLElement,text:string}>}}
   */
  buildContext(root) {
    const input = root.querySelector('[data-project-search-input]');
    const clearBtn = root.querySelector('[data-project-search-clear]');
    const empty = root.querySelector('[data-project-search-empty]');
    const grid = root.parentElement?.querySelector('[data-project-grid]');
    const cards = grid ? Array.from(grid.querySelectorAll('.project-card')).map((card) => ({
      card,
      text: card.textContent.toLowerCase(),
    })) : [];

    if (!input || !clearBtn || !cards.length) return null;
    return { root, input, clearBtn, empty, cards };
  }

  /**
   * @param {Event} e
   */
  onInput(e) {
    const root = e.currentTarget?.closest?.('[data-project-search]');
    const ctx = this.roots.find((item) => item.root === root);
    if (!ctx) return;
    this.update(ctx);
  }

  /**
   * @param {MouseEvent} e
   */
  onClearClick(e) {
    const root = e.currentTarget?.closest?.('[data-project-search]');
    const ctx = this.roots.find((item) => item.root === root);
    if (!ctx) return;

    ctx.input.value = '';
    this.update(ctx);
    ctx.input.focus();
  }

  /**
   * @param {{input:HTMLInputElement, empty:HTMLElement|null, cards:Array<{card:HTMLElement,text:string}>}} ctx
   */
  update(ctx) {
    const query = ctx.input.value.trim().toLowerCase();
    let visibleCount = 0;

    ctx.cards.forEach(({ card, text }) => {
      const matches = !query || text.includes(query);
      card.hidden = !matches;
      card.setAttribute('aria-hidden', matches ? 'false' : 'true');
      if (matches) visibleCount += 1;
    });

    if (ctx.empty) {
      ctx.empty.hidden = visibleCount > 0;
    }
  }
}

/**
 * Подставляет названия карточек из имен папок проекта.
 */
class ProjectTitleManager {
  constructor() {
    this.selector = '[data-project-grid] .project-card';
  }

  /**
   * Инициализирует автозаполнение заголовков.
   */
  init() {
    const cards = Array.from(document.querySelectorAll(this.selector));
    cards.forEach((card) => this.updateCardTitle(card));
  }

  /**
   * @param {HTMLElement} card
   */
  updateCardTitle(card) {
    const title = card.querySelector('.project-card__body h3');
    if (!title) return;

    const source = card.getAttribute('data-project-folder')
      || card.querySelector('[data-project-src]')?.getAttribute('data-project-src')
      || card.querySelector('.project-card__actions a[href]')?.getAttribute('href')
      || '';

    const folderName = this.extractFolderName(source);
    if (!folderName) return;

    title.textContent = folderName;
  }

  /**
   * Извлекает имя папки из пути к файлу.
   * @param {string} path
   * @returns {string}
   */
  extractFolderName(path) {
    const rawPath = String(path || '').split(/[?#]/)[0].trim();
    if (!rawPath) return '';

    try {
      const url = new URL(rawPath, window.location.href);
      const segments = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      return this.normalizeFolderName(this.pickProjectFolderName(segments));
    } catch (error) {
      const segments = decodeURIComponent(rawPath).split('/').filter(Boolean);
      return this.normalizeFolderName(this.pickProjectFolderName(segments));
    }
  }

  /**
   * Возвращает имя папки проекта из сегментов пути.
   * Для файлов берёт папку-родитель, для папки - её собственное имя.
   * @param {string[]} segments
   * @returns {string}
   */
  pickProjectFolderName(segments) {
    if (!Array.isArray(segments) || !segments.length) return '';

    const last = segments[segments.length - 1] || '';
    if (this.looksLikeFileName(last)) {
      return segments.length >= 2 ? segments[segments.length - 2] : '';
    }

    return last === 'students-work' ? '' : last;
  }

  /**
   * Проверяет, похоже ли значение на имя файла.
   * @param {string} name
   * @returns {boolean}
   */
  looksLikeFileName(name) {
    return /\.[a-z0-9]{1,5}$/i.test(String(name || '').trim());
  }

  /**
   * Убирает служебный префикс у имени папки.
   * @param {string} folderName
   * @returns {string}
   */
  normalizeFolderName(folderName) {
    return String(folderName || '')
      .replace(/^Проект\s*\d+\s*-\s*/i, '')
      .trim();
  }
}

/**
 * Главная точка входа клиентского приложения.
 */
class App {
  constructor() {
    this.mobileMenu = new MobileMenu({
      burgerSelector: '[data-burger]',
      navSelector: '[data-nav]',
    });

    this.dropdownManager = new DropdownManager();

    this.reveal = new RevealOnScroll({
      selectors: '.page-title, .subtitle, .section, .row, .tile, .hero, .portrait, .badge, .btn, .repo-card, .project-card, .project-grid',
    });

    this.imageModal = new ImageModal({
      triggerSelector: '#portraitCard',
      sourceImgSelector: '#portraitImg',
      modalSelector: '#imgModal',
      modalImgSelector: '#imgModalImg',
      modalFrameSelector: '#imgModalFrame',
    });

    this.autoGallery = new AutoGallery();

    this.galleryLightbox = new GalleryLightbox({
      modalSelector: '#imgModal',
      modalImgSelector: '#imgModalImg',
      modalFrameSelector: '#imgModalFrame',
    });

    this.projectDownloadManager = new ProjectDownloadManager();
    this.projectTitleManager = new ProjectTitleManager();
    this.projectSearchManager = new ProjectSearchManager();
  }

  /**
   * Инициализирует все компоненты страницы.
   */
  init() {
    this.mobileMenu.init();
    this.dropdownManager.init();
    this.reveal.init();
    this.imageModal.init();
    this.autoGallery.init();
    this.galleryLightbox.init();
    this.projectDownloadManager.init();
    this.projectTitleManager.init();
    this.projectSearchManager.init();
  }
}

/**
 * Запускает приложение после полной загрузки DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-theme', 'dark');
  initTeachingExperience();
  new App().init();
  cleanupLegacyServiceWorker();
});

/**
 * Удаляет старые service worker и их кеши, чтобы не ловить устаревшие версии страниц.
 */
function cleanupLegacyServiceWorker() {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches.keys())
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('olyushinvv-site-'))
          .map((key) => caches.delete(key))
      ))
      .catch((error) => {
        console.warn('Legacy service worker cleanup failed:', error);
      });
  });
}





