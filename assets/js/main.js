/**
 * Основной клиентский код сайта.
 * Компоненты запускаются только на тех страницах, где есть нужная разметка.
 */

const GALLERY_FILE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'pdf']);

// Каталоги хранят относительные пути, поэтому работают и через сервер, и при открытии HTML с диска.
const ACHIEVEMENT_FILES = Object.freeze({
  teacher: [
    'certificates/2025-undated_1.webp',
    'certificates/2025-10-07_2.webp',
    'certificates/2025-10-07_3.webp',
    'diplomas/2025-undated_4.webp',
    'certificates/2025-05-22_5.webp',
    'diplomas/2025-undated_6.webp',
    'gratitude/2025-03-20_7.webp',
    'gratitude/2025-undated_8.webp',
    'gratitude/2025-05-30_9.webp',
    'certificates/2025-11-14_10.webp',
    'gratitude/2025-undated_11.webp',
    'certificates/2025-12-26_12.webp',
    'certificates/2025-12-26_13.webp',
    'gratitude/2026-undated_14.webp',
    'certificates/2026-01-16_15.webp',
    'gratitude/2025-12-26_16.webp',
    'certificates/2024-12-25_17.webp',
    'gratitude/2026-undated_18.webp',
    'gratitude/2026-undated_19.webp',
    'gratitude/2026-03-19_20.webp',
    'gratitude/2026-04-18_21.webp',
    'gratitude/2026-undated_22.webp',
  ],
  students: [
    'certificates/2025-undated_1.webp',
    'certificates/2025-undated_2.webp',
    'certificates/2025-03-20_3.webp',
    'diplomas/2025-undated_4.webp',
    'diplomas/2025-05-30_5.webp',
    'diplomas/2025-05-30_6.webp',
    'diplomas/2025-undated_7.webp',
    'diplomas/2025-12-26_8.webp',
    'diplomas/2026-undated_9.webp',
    'diplomas/2026-undated_10.webp',
    'diplomas/2026-undated_11.webp',
    'diplomas/2026-undated_12.webp',
    'diplomas/2026-undated_13.webp',
    'diplomas/2026-undated_14.webp',
    'diplomas/2026-undated_15.webp',
    'diplomas/2026-undated_16.webp',
    'diplomas/2026-undated_17.webp',
    'certificates/2026-04-18_18.webp',
    'certificates/2026-04-18_19.webp',
    'certificates/2026-04-18_20.webp',
  ],
});

// Скачиваем файл через Blob, чтобы браузер не открывал ZIP или PDF в новой вкладке.
// Если загрузка недоступна, оставляем браузеру обычную ссылку с атрибутом download.
async function downloadFile(src, fileName) {
  if (!src) return;

  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement('a');
    link.href = src;
    link.download = fileName || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

// Возвращает правильную форму русского слова для переданного числа.
function pluralizeRu(value, forms) {
  const number = Math.abs(value);
  const mod10 = number % 10;
  const mod100 = number % 100;

  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

// Считает полный педагогический стаж в годах и месяцах.
// При некорректной или будущей дате возвращает пустую строку.
function formatTeachingExperience(startDate, endDate = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || start > endDate) return '';

  let years = endDate.getFullYear() - start.getFullYear();
  let months = endDate.getMonth() - start.getMonth();

  if (endDate.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years === 0 && months === 0) return 'менее месяца';

  const parts = [];
  if (years > 0) parts.push(`${years} ${pluralizeRu(years, ['год', 'года', 'лет'])}`);
  if (months > 0) parts.push(`${months} ${pluralizeRu(months, ['месяц', 'месяца', 'месяцев'])}`);
  return parts.join(' ');
}

// Обновляет стаж на главной странице. На остальных страницах функция ничего не делает.
function updateTeachingExperience() {
  const item = document.querySelector('[data-teaching-experience]');
  if (!item) return;

  const experience = formatTeachingExperience(item.dataset.teachingExperience);
  if (experience) item.textContent = experience;
}

/**
 * Управляет мобильной навигацией и меню достижений.
 * Закрывает открытые панели по клику снаружи и по клавише Escape.
 */
class Navigation {
  constructor() {
    this.burger = document.querySelector('[data-burger]');
    this.nav = document.querySelector('[data-nav]');
    this.dropdown = document.querySelector('[data-dropdown]');
    this.dropdownButton = this.dropdown?.querySelector('[data-dropdown-btn]') || null;

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  init() {
    if (this.burger && this.nav) {
      this.burger.addEventListener('click', () => this.toggleNavigation());
      this.nav.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('a')) this.closeNavigation();
      });
    }

    this.dropdownButton?.addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleDropdown();
    });

    if (this.nav || this.dropdown) {
      document.addEventListener('click', this.onDocumentClick);
      document.addEventListener('keydown', this.onKeyDown);
    }
  }

  toggleNavigation() {
    const isOpen = this.nav.classList.toggle('open');
    this.burger.setAttribute('aria-expanded', String(isOpen));
  }

  closeNavigation() {
    if (!this.nav || !this.burger) return;
    this.nav.classList.remove('open');
    this.burger.setAttribute('aria-expanded', 'false');
  }

  toggleDropdown() {
    if (!this.dropdown || !this.dropdownButton) return;
    const isOpen = this.dropdown.classList.toggle('open');
    this.dropdownButton.setAttribute('aria-expanded', String(isOpen));
  }

  closeDropdown() {
    if (!this.dropdown || !this.dropdownButton) return;
    this.dropdown.classList.remove('open');
    this.dropdownButton.setAttribute('aria-expanded', 'false');
  }

  onDocumentClick(event) {
    if (this.nav && this.burger && !this.nav.contains(event.target) && !this.burger.contains(event.target)) {
      this.closeNavigation();
    }
    if (this.dropdown && !this.dropdown.contains(event.target)) this.closeDropdown();
  }

  onKeyDown(event) {
    if (event.key !== 'Escape') return;
    this.closeNavigation();
    this.closeDropdown();
  }
}

/**
 * Заменяет внешний вид системного select, но сохраняет исходный элемент.
 * Нативное значение остаётся доступным фильтрам и меняется через событие change.
 */
class ThemedSelect {
  static nextId = 1;

  constructor(select, onOpen) {
    this.select = select;
    this.onOpen = onOpen;
    this.root = null;
    this.button = null;
    this.value = null;
    this.list = null;
    this.options = [];

    this.sync = this.sync.bind(this);
    this.onListKeyDown = this.onListKeyDown.bind(this);
  }

  init() {
    if (this.select.dataset.themedSelectReady === 'true') return;

    const id = `themed-select-${ThemedSelect.nextId++}`;
    this.root = document.createElement('div');
    this.root.className = 'themed-select';

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.id = `${id}-button`;
    this.button.className = 'themed-select__button';
    this.button.setAttribute('aria-haspopup', 'listbox');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-controls', `${id}-list`);
    this.button.setAttribute('aria-label', this.select.getAttribute('aria-label') || 'Выбор значения');

    this.value = document.createElement('span');
    this.value.className = 'themed-select__value';

    const arrow = document.createElement('span');
    arrow.className = 'themed-select__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    this.button.append(this.value, arrow);

    this.list = document.createElement('div');
    this.list.id = `${id}-list`;
    this.list.className = 'themed-select__list';
    this.list.hidden = true;
    this.list.setAttribute('role', 'listbox');
    this.list.setAttribute('aria-labelledby', this.button.id);

    this.options = Array.from(this.select.options).map((nativeOption) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'themed-select__option';
      option.dataset.value = nativeOption.value;
      option.textContent = nativeOption.textContent;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      this.list.appendChild(option);
      return option;
    });

    this.root.append(this.button, this.list);
    this.select.insertAdjacentElement('afterend', this.root);
    this.select.classList.add('themed-select__native');
    this.select.tabIndex = -1;
    this.select.setAttribute('aria-hidden', 'true');
    this.select.dataset.themedSelectReady = 'true';

    this.button.addEventListener('click', (event) => {
      event.preventDefault();
      this.isOpen() ? this.close() : this.open();
    });
    this.button.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      this.open(true);
    });
    this.list.addEventListener('click', (event) => {
      const option = event.target instanceof Element
        ? event.target.closest('.themed-select__option')
        : null;
      if (option) this.choose(option);
    });
    this.list.addEventListener('keydown', this.onListKeyDown);
    this.select.addEventListener('change', this.sync);
    this.select.addEventListener('themed-select-sync', this.sync);
    this.sync();
  }

  isOpen() {
    return this.root.classList.contains('is-open');
  }

  open(focusOption = false) {
    this.onOpen(this);
    this.root.classList.add('is-open');
    this.list.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    if (focusOption) (this.getSelectedOption() || this.options[0])?.focus();
  }

  close(restoreFocus = false) {
    this.root.classList.remove('is-open');
    this.list.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.button.focus();
  }

  sync() {
    const selected = this.select.selectedOptions[0];
    this.value.textContent = selected?.textContent || '';
    this.options.forEach((option) => {
      const isSelected = option.dataset.value === this.select.value;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-selected', String(isSelected));
    });
  }

  choose(option) {
    this.select.value = option.dataset.value || '';
    this.sync();
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
    this.close(true);
  }

  getSelectedOption() {
    return this.options.find((option) => option.dataset.value === this.select.value) || null;
  }

  moveFocus(current, step) {
    const index = Math.max(0, this.options.indexOf(current));
    this.options[(index + step + this.options.length) % this.options.length]?.focus();
  }

  onListKeyDown(event) {
    const option = event.target instanceof Element
      ? event.target.closest('.themed-select__option')
      : null;
    if (!option) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(option, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.options[event.key === 'Home' ? 0 : this.options.length - 1]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.choose(option);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
    }
  }
}

// Создаёт стилизованные списки и следит, чтобы одновременно был открыт только один.
class ThemedSelectManager {
  constructor() {
    this.items = [];
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  init() {
    this.items = Array.from(document.querySelectorAll('.gallery-controls select'))
      .map((select) => new ThemedSelect(select, (current) => this.closeAll(current)));
    this.items.forEach((item) => item.init());
    if (this.items.length) document.addEventListener('click', this.onDocumentClick);
  }

  closeAll(except = null) {
    this.items.forEach((item) => {
      if (item !== except) item.close();
    });
  }

  onDocumentClick(event) {
    if (!this.items.some((item) => item.root.contains(event.target))) this.closeAll();
  }
}

/**
 * Добавляет мягкое появление видимых элементов.
 * При отключённой анимации или без IntersectionObserver контент показывается сразу.
 */
class RevealOnScroll {
  constructor(selector) {
    this.selector = selector;
  }

  init() {
    const elements = Array.from(document.querySelectorAll(this.selector));
    if (!elements.length) return;

    elements.forEach((element, index) => {
      element.classList.add('reveal');
      element.style.transitionDelay = `${Math.min(index * 60, 300)}ms`;
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10%', threshold: 0.1 });

    elements.forEach((element) => observer.observe(element));
  }
}

/**
 * Показывает изображения и PDF в одном модальном окне.
 * Источником служит любой элемент с атрибутом data-img.
 */
class MediaViewer {
  constructor() {
    this.modal = document.querySelector('#imgModal');
    this.image = document.querySelector('#imgModalImg');
    this.frame = document.querySelector('#imgModalFrame');
    this.lastTrigger = null;

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  init() {
    if (!this.modal || !this.image || !this.frame) return;
    document.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKeyDown);
  }

  open(src, trigger) {
    if (!src) return;
    this.lastTrigger = trigger;
    const isPdf = this.isPdf(src);
    this.modal.classList.toggle('img-modal--pdf', isPdf);

    if (isPdf) {
      this.image.removeAttribute('src');
      this.image.hidden = true;
      this.frame.src = this.getPdfViewerSrc(src);
      this.frame.hidden = false;
    } else {
      this.frame.removeAttribute('src');
      this.frame.hidden = true;
      this.image.src = src;
      this.image.hidden = false;
    }

    this.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    this.modal.querySelector('[data-modal-close]')?.focus();
  }

  close() {
    if (this.modal.getAttribute('aria-hidden') !== 'false') return;
    this.modal.setAttribute('aria-hidden', 'true');
    this.modal.classList.remove('img-modal--pdf');
    this.image.removeAttribute('src');
    this.image.hidden = true;
    this.frame.removeAttribute('src');
    this.frame.hidden = true;
    document.body.classList.remove('no-scroll');
    this.lastTrigger?.focus();
    this.lastTrigger = null;
  }

  isPdf(src) {
    try {
      return new URL(src, window.location.href).pathname.toLowerCase().endsWith('.pdf');
    } catch {
      return String(src).toLowerCase().includes('.pdf');
    }
  }

  getPdfViewerSrc(src) {
    const url = new URL(src, window.location.href);
    const params = new URLSearchParams(url.hash.slice(1));
    params.set('toolbar', '0');
    params.set('navpanes', '0');
    url.hash = params.toString();
    return url.toString();
  }

  getTrigger(target) {
    if (!(target instanceof Element)) return null;
    const trigger = target.closest('[data-img]');
    return trigger && !trigger.closest('.img-modal') ? trigger : null;
  }

  onClick(event) {
    const closeButton = event.target instanceof Element
      ? event.target.closest('[data-modal-close]')
      : null;
    if (event.target === this.modal || closeButton) {
      event.preventDefault();
      this.close();
      return;
    }

    const trigger = this.getTrigger(event.target);
    if (!trigger) return;
    event.preventDefault();
    this.open(trigger.dataset.img, trigger);
  }

  onKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (!['Enter', ' '].includes(event.key)) return;

    const trigger = this.getTrigger(event.target);
    if (!trigger) return;
    event.preventDefault();
    this.open(trigger.dataset.img, trigger);
  }
}

/**
 * Формирует каталог наград и применяет фильтры.
 * Список файлов встроен в скрипт, чтобы каталог работал даже без локального HTTP-сервера.
 */
class AchievementGallery {
  constructor() {
    this.galleries = new Map();
    this.collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
  }

  init() {
    document.querySelectorAll('[data-auto-gallery]').forEach((gallery) => {
      const controls = this.getControls(gallery);
      const config = this.getConfig(gallery);
      if (!controls || !config) {
        this.renderStatus(gallery, 'Ошибка конфигурации галереи.');
        return;
      }

      const items = config.files
        .map((entry) => this.normalizeItem(entry))
        .filter(Boolean);
      this.galleries.set(gallery, { controls, config, items });
      this.bindControls(gallery, controls, config);
      if (items.length) this.render(gallery);
      else this.renderStatus(gallery, 'В каталоге пока нет наград.');
    });
  }

  getConfig(gallery) {
    const id = gallery.dataset.galleryId;
    const baseUrl = gallery.dataset.galleryBase;
    const files = ACHIEVEMENT_FILES[id];
    if (!baseUrl || !files) return null;

    return {
      baseUrl: baseUrl.replace(/\/$/, ''),
      files,
      defaultCategory: this.normalizeCategory(gallery.dataset.galleryCategory),
      defaultSort: this.normalizeSort(gallery.dataset.gallerySort),
      titles: {
        diplomas: gallery.dataset.galleryTitle || 'Диплом',
        certificates: gallery.dataset.galleryTitleCertificates || 'Сертификат',
        gratitude: gallery.dataset.galleryTitleGratitude || 'Благодарность',
      },
    };
  }

  getControls(gallery) {
    const id = gallery.dataset.galleryId;
    const root = id
      ? document.querySelector(`[data-gallery-controls][data-gallery-target="${id}"]`)
      : null;
    if (!root) return null;

    const controls = {
      category: root.querySelector('[data-gallery-category]'),
      sort: root.querySelector('[data-gallery-sort]'),
      from: root.querySelector('[data-gallery-from]'),
      to: root.querySelector('[data-gallery-to]'),
      clear: root.querySelector('[data-gallery-clear]'),
    };
    return Object.values(controls).every(Boolean) ? controls : null;
  }

  bindControls(gallery, controls, config) {
    controls.category.value = config.defaultCategory;
    controls.sort.value = config.defaultSort;
    controls.category.dispatchEvent(new Event('themed-select-sync'));
    controls.sort.dispatchEvent(new Event('themed-select-sync'));

    [controls.category, controls.sort, controls.from, controls.to].forEach((control) => {
      control.addEventListener('change', () => this.render(gallery));
    });

    controls.clear.addEventListener('click', () => {
      controls.category.value = config.defaultCategory;
      controls.sort.value = config.defaultSort;
      controls.from.value = '';
      controls.to.value = '';
      controls.category.dispatchEvent(new Event('themed-select-sync'));
      controls.sort.dispatchEvent(new Event('themed-select-sync'));
      this.render(gallery);
    });
  }

  normalizeItem(entry) {
    const path = typeof entry === 'string' ? entry.trim() : String(entry?.path || '').trim();
    if (!path || (typeof entry === 'object' && entry.type && entry.type !== 'file')) return null;

    const name = path.split('/').filter(Boolean).pop() || '';
    if (!this.isAllowedFile(name)) return null;

    return {
      name,
      relativePath:path.replace(/^\/+/, ''),
      category: this.getCategory(path),
      date: this.extractDate(name),
      isPdf: name.toLowerCase().endsWith('.pdf'),
      displayName: name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(),
    };
  }

  isAllowedFile(name) {
    const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    return GALLERY_FILE_EXTENSIONS.has(extension);
  }

  getCategory(path) {
    const segments = path.toLowerCase().split('/');
    if (segments.includes('certificates')) return 'certificates';
    if (segments.includes('gratitude')) return 'gratitude';
    return 'diplomas';
  }

  normalizeCategory(value) {
    const category = String(value || '').toLowerCase();
    return ['all', 'diplomas', 'certificates', 'gratitude'].includes(category) ? category : 'all';
  }

  normalizeSort(value) {
    const [fieldValue, directionValue] = String(value || '').split('-');
    const field = fieldValue === 'date' ? 'date' : 'name';
    const direction = directionValue === 'desc' ? 'desc' : 'asc';
    return `${field}-${direction}`;
  }

  // Принимает дату в формате ДД.ММ.ГГГГ и отбрасывает невозможные календарные даты.
  parseDateInput(value, endOfDay = false) {
    const match = String(value || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date.getTime();
  }

  // Извлекает полную дату или хотя бы год из имени файла для сортировки и фильтрации.
  extractDate(name) {
    const value = name.replace(/\.[^.]+$/, '');
    const fullDate = value.match(/(20\d{2})[-_.](\d{1,2})[-_.](\d{1,2})/);
    if (fullDate) {
      const date = new Date(Number(fullDate[1]), Number(fullDate[2]) - 1, Number(fullDate[3]));
      return date.getTime();
    }

    const year = value.match(/(?:^|\D)(20\d{2})(?:\D|$)/);
    return year ? new Date(Number(year[1]), 0, 1).getTime() : null;
  }

  render(gallery) {
    const state = this.galleries.get(gallery);
    if (!state?.items.length) return;

    const { controls, config } = state;
    const category = this.normalizeCategory(controls.category.value);
    const from = this.parseDateInput(controls.from.value);
    const to = this.parseDateInput(controls.to.value, true);

    let items = category === 'all'
      ? [...state.items]
      : state.items.filter((item) => item.category === category);

    if (from || to) {
      items = items.filter((item) => {
        if (!item.date) return false;
        return (!from || item.date >= from) && (!to || item.date <= to);
      });
    }

    items = this.sortItems(items, controls.sort.value);
    if (!items.length) {
      this.renderStatus(gallery, from || to
        ? 'Нет наград в выбранном диапазоне.'
        : 'В выбранной категории пока нет наград.');
      return;
    }

    this.renderItems(gallery, items, config);
  }

  sortItems(items, sortValue) {
    const [field, direction] = this.normalizeSort(sortValue).split('-');
    const factor = direction === 'desc' ? -1 : 1;

    return items.sort((left, right) => {
      if (field === 'date') {
        if (left.date && right.date && left.date !== right.date) return (left.date - right.date) * factor;
        if (left.date && !right.date) return -1;
        if (!left.date && right.date) return 1;
      }
      return this.collator.compare(left.name, right.name) * factor;
    });
  }

  buildFileUrl(baseUrl, relativePath) {
    const encodedPath = relativePath
      .split('/')
      .filter(Boolean)
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${baseUrl}/${encodedPath}`;
  }

  renderItems(gallery, items, config) {
    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const src = this.buildFileUrl(config.baseUrl, item.relativePath);
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.dataset.img = src;

      const media = document.createElement('div');
      media.className = 'tile-media';

      if (item.isPdf) {
        const frame = document.createElement('iframe');
        frame.className = 'tile-pdf__preview';
        frame.src = `${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
        frame.title = `${config.titles[item.category]} ${index + 1}`;
        frame.loading = 'lazy';
        frame.tabIndex = -1;
        frame.setAttribute('aria-hidden', 'true');
        media.appendChild(frame);
      } else {
        const image = document.createElement('img');
        image.src = src;
        image.alt = `${config.titles[item.category]}: ${item.displayName}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        media.appendChild(image);
      }

      const badge = document.createElement('span');
      badge.className = 'tile-format__badge';
      badge.textContent = item.name.split('.').pop().toUpperCase().replace('JPEG', 'JPG');
      media.appendChild(badge);
      tile.appendChild(media);
      fragment.appendChild(tile);
    });

    gallery.replaceChildren(fragment);
  }

  renderStatus(gallery, text) {
    const status = document.createElement('p');
    status.className = 'gallery-status';
    status.textContent = text;
    gallery.replaceChildren(status);
  }
}

// Обрабатывает кнопки скачивания архивов со студенческими проектами.
class ProjectDownloads {
  init() {
    if (!document.querySelector('[data-project-download]')) return;

    document.addEventListener('click', (event) => {
      const button = event.target instanceof Element
        ? event.target.closest('[data-project-download]')
        : null;
      if (!button) return;
      event.preventDefault();
      downloadFile(button.dataset.projectSrc, button.dataset.projectName || 'project.zip');
    });
  }
}

// Старые версии сайта регистрировали service worker. Удаляем его кеши,
// чтобы постоянные посетители не получали устаревшие страницы после обновления.
function cleanupLegacyServiceWorker() {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;

  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames
        .filter((name) => name.startsWith('olyushinvv-site-'))
        .map((name) => caches.delete(name)));
    } catch (error) {
      console.warn('Не удалось удалить старый кеш сайта:', error);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateTeachingExperience();
  new Navigation().init();
  new ThemedSelectManager().init();
  new AchievementGallery().init();
  new MediaViewer().init();
  new ProjectDownloads().init();
  new RevealOnScroll('.page-title, .subtitle, .section, .row, .portrait, .project-card').init();
  cleanupLegacyServiceWorker();
});
