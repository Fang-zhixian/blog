import { initPreviewMetrics } from './preview-metrics';

type ThemeMode = 'auto' | 'light' | 'dark';
type Language = 'zh' | 'en';

const routes: Record<string, string> = {
  home: '/', projects: '/projects/', blog: '/blog/', notes: '/notes/',
  knowledge: '/knowledge/', links: '/links/', about: '/about/',
};
const safeGet = (storage: Storage, key: string) => { try { return storage.getItem(key); } catch { return null; } };
const safeSet = (storage: Storage, key: string, value: string) => { try { storage.setItem(key, value); } catch { /* Storage is optional. */ } };

export function initRumoPreview() {
  const html = document.documentElement;
  const shell = document.querySelector<HTMLElement>('.rumo-shell');
  const terminal = document.querySelector<HTMLElement>('[data-terminal]');
  const input = document.querySelector<HTMLInputElement>('[data-terminal-input]');
  const output = document.querySelector<HTMLElement>('[data-terminal-output]');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let theme: ThemeMode = (safeGet(localStorage, 'rumo-preview-theme') as ThemeMode) || 'auto';
  let language: Language = safeGet(localStorage, 'rumo-preview-lang') === 'en' ? 'en' : 'zh';
  const savedTtyMode = safeGet(localStorage, 'rumo-preview-tty-mode');
  const legacyTtyMode = safeGet(sessionStorage, 'rumo-preview-tty');
  // The old default was dark and was saved even without a choice; only legacy light is unambiguously manual.
  let ttyMode: ThemeMode = savedTtyMode === 'auto' || savedTtyMode === 'light' || savedTtyMode === 'dark'
    ? savedTtyMode : legacyTtyMode === 'light' ? 'light' : 'auto';
  if (!savedTtyMode && legacyTtyMode === 'light') safeSet(localStorage, 'rumo-preview-tty-mode', 'light');
  let ttyTheme: 'light' | 'dark' = 'dark';
  let redrawStillOrbit = () => {};
  const metrics = initPreviewMetrics({ getLanguage: () => language });
  let terminalPosts: Array<{ slug: string; title: string }> = [];
  try { terminalPosts = JSON.parse(terminal?.dataset.terminalPosts || '[]'); } catch { /* An empty list is safe. */ }
  const history: string[] = [];
  let historyIndex = 0;

  function setTheme(value: ThemeMode) {
    theme = value;
    safeSet(localStorage, 'rumo-preview-theme', value);
    html.dataset.themeMode = value;
    html.classList.toggle('dark', value === 'dark' || (value === 'auto' && media.matches));
    document.querySelectorAll<HTMLButtonElement>('button[data-theme-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeMode === value)));
    if (ttyMode === 'auto') setTtyTheme('auto', false);
  }
  function setLanguage(value: Language) {
    language = value;
    safeSet(localStorage, 'rumo-preview-lang', value);
    html.dataset.lang = value;
    html.lang = value === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll<HTMLElement>('[data-zh][data-en]').forEach((element) => { element.textContent = value === 'zh' ? element.dataset.zh || '' : element.dataset.en || ''; });
    document.querySelectorAll<HTMLElement>('[data-content-lang-zh][data-content-lang-en]').forEach((element) => { element.lang = value === 'zh' ? element.dataset.contentLangZh || 'zh-CN' : element.dataset.contentLangEn || 'en'; });
    document.querySelectorAll<HTMLImageElement>('[data-alt-zh][data-alt-en]').forEach((image) => { image.alt = value === 'zh' ? image.dataset.altZh || '' : image.dataset.altEn || ''; });
    document.querySelectorAll<HTMLInputElement>('[data-placeholder-zh][data-placeholder-en]').forEach((element) => { element.placeholder = value === 'zh' ? element.dataset.placeholderZh || '' : element.dataset.placeholderEn || ''; });
    document.querySelectorAll<HTMLElement>('[data-aria-zh][data-aria-en]').forEach((element) => element.setAttribute('aria-label', value === 'zh' ? element.dataset.ariaZh || '' : element.dataset.ariaEn || ''));
    document.querySelectorAll<HTMLElement>('[data-title-zh][data-title-en]').forEach((element) => element.setAttribute('title', value === 'zh' ? element.dataset.titleZh || '' : element.dataset.titleEn || ''));
    document.querySelectorAll<HTMLButtonElement>('[data-lang-switch]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.langSwitch === value)));
    const pathHint = document.querySelector<HTMLElement>('[data-terminal-path]');
    if (pathHint && window.location.pathname !== '/') pathHint.textContent = value === 'en' ? `→ ${window.location.pathname} — press Enter to read` : `→ ${window.location.pathname} — 按 Enter 开始阅读`;
    metrics.render();
    document.dispatchEvent(new CustomEvent('preview:language-changed', { detail: value }));
  }
  function setTtyTheme(value: ThemeMode, remember = true) {
    ttyMode = value;
    ttyTheme = value === 'auto' ? (html.classList.contains('dark') ? 'dark' : 'light') : value;
    if (remember) safeSet(localStorage, 'rumo-preview-tty-mode', value);
    terminal?.classList.toggle('terminal-light', ttyTheme === 'light');
    document.querySelectorAll<HTMLButtonElement>('[data-tty-theme]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.ttyTheme === value)));
    redrawStillOrbit();
  }
  function setTerminal(open: boolean) {
    html.classList.toggle('terminal-active', open);
    if (terminal) terminal.setAttribute('aria-hidden', String(!open));
    if (shell) shell.inert = open;
    if (open) requestAnimationFrame(() => {
      // Avoid opening the mobile keyboard or scrolling past the terminal header on entry.
      const initialFocus = window.matchMedia('(max-width: 600px)').matches
        ? terminal?.querySelector<HTMLButtonElement>('[data-terminal-enter]') : input;
      initialFocus?.focus({ preventScroll: true });
    });
    else {
      safeSet(sessionStorage, 'rumo-preview-entered', 'yes');
      document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
    }
  }
  function writeLine(text: string, className = '') {
    if (!output) return;
    const line = document.createElement('p');
    line.textContent = text;
    if (className) line.className = className;
    output.append(line);
  }
  function navigate(path: string) {
    safeSet(sessionStorage, 'rumo-preview-entered', 'yes');
    window.location.assign(path);
  }
  function runCommand(raw: string) {
    const command = raw.trim();
    if (!command) { setTerminal(false); return; }
    history.push(command); historyIndex = history.length;
    writeLine(`❯  ${command}`, 'terminal-echo');
    const [wordRaw, ...args] = command.split(/\s+/);
    const word = wordRaw.toLowerCase();
    if (routes[word]) { navigate(routes[word]); return; }
    if (word === 'enter' || word === 'skip') { setTerminal(false); return; }
    if (word === 'help') {
      (language === 'en' ? [
        'Available commands', 'help         show this list', 'whoami       who owns this space',
        'ls [section] list sections or recent articles', 'pwd          current location',
        'open <section>  open a section', 'cd <section>    open a section', 'read <slug>  open an article',
        'home / projects / blog / notes / knowledge / links / about',
        'latest       recent writing', 'lang zh|en   change interface language',
        'theme auto|dark|light  change terminal theme', 'date         local time',
        'history      commands in this session', 'echo <text>  print text',
        'clear        clear the terminal', 'enter        enter the site',
        'skip         skip introduction (Esc)', 'like         like this site',
      ] : [
        '可用命令', 'help         显示这份列表', 'whoami       这里的主人是谁',
        'ls [栏目]    列出栏目或最近的文章', 'pwd          当前所在位置',
        'open <栏目>  打开栏目', 'cd <栏目>    打开栏目', 'read <slug>  打开文章',
        'home / projects / blog / notes / knowledge / links / about',
        'latest       最近发布的文字', 'lang zh|en   切换界面语言',
        'theme auto|dark|light  切换终端主题', 'date         本地时间',
        'history      本次输入过的命令', 'echo <内容>  原样输出',
        'clear        清空终端', 'enter        进入网站（或直接按 Enter）',
        'skip         跳过介绍（Esc）', 'like         喜欢这个小站',
      ]).forEach((line) => writeLine(line));
    } else if (word === 'whoami') {
      writeLine(language === 'en' ? 'Zhixian — full-stack developer and technology explorer.' : '方植贤 / Zhixian — 全栈开发者与前沿技术探索者。');
      writeLine(language === 'en' ? 'Exploring AI applications, modern web, and product thinking.' : '关注 AI 应用、现代 Web 与产品思考。');
    } else if (word === 'ls') {
      writeLine(args[0] === 'blog' ? terminalPosts.map((post) => post.slug).join('  ') : 'home  projects  blog  notes  knowledge  links  about');
    } else if (word === 'pwd') {
      writeLine(`~/zhixian-space${window.location.pathname === '/' ? '' : window.location.pathname}`);
    } else if (word === 'open' || word === 'cd') {
      const target = args[0];
      if (target === '..') navigate('/');
      else if (target && routes[target]) navigate(routes[target]);
      else writeLine(language === 'en' ? 'Section not found. Type help to see commands.' : '找不到这个栏目。输入 help 查看可用命令。');
    } else if (word === 'read') {
      const slug = args[0];
      if (slug && /^[a-z0-9-]+$/i.test(slug)) navigate(`/blog/${slug}`);
      else writeLine(language === 'en' ? 'Enter an article slug, for example read xhs-local-knowledge-workbench.' : '请输入文章的 slug，例如 read xhs-local-knowledge-workbench。');
    } else if (word === 'latest') {
      if (terminalPosts.length) terminalPosts.slice(0, 3).forEach((post) => writeLine(post.title));
      else writeLine(language === 'en' ? 'No articles yet.' : '目前还没有文章。');
    } else if (word === 'lang') {
      if (args[0] === 'en' || args[0] === 'zh') { setLanguage(args[0]); writeLine(args[0] === 'en' ? 'Interface language: English.' : '界面语言：简体中文。'); }
      else writeLine(language === 'en' ? 'Usage: lang zh or lang en' : '用法：lang zh 或 lang en');
    } else if (word === 'theme') {
      if (args[0] === 'auto' || args[0] === 'dark' || args[0] === 'light') { setTtyTheme(args[0]); writeLine(language === 'en' ? `Terminal theme: ${args[0]}` : `终端主题：${args[0]}`); }
      else writeLine(language === 'en' ? 'Usage: theme auto, dark, or light' : '用法：theme auto、dark 或 light');
    } else if (word === 'date') writeLine(new Date().toLocaleString());
    else if (word === 'history') history.forEach((entry, index) => writeLine(`${index + 1}  ${entry}`));
    else if (word === 'echo') writeLine(args.join(' '));
    else if (word === 'clear') { if (output) output.replaceChildren(); }
    else if (word === 'like') { void metrics.toggle('site').then((ok) => writeLine(ok ? (language === 'en' ? 'Site like updated.' : '已更新喜欢状态。') : (language === 'en' ? 'Statistics unavailable.' : '统计暂时不可用。'))); }
    else writeLine(language === 'en' ? `Command not found: ${word}. Type help for commands.` : `未找到命令：${word}。输入 help 查看可用命令。`);
    if (input) { input.value = ''; input.focus(); }
    output?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }

  setTheme(theme); setLanguage(language); setTtyTheme(ttyMode, false);
  setTerminal(html.classList.contains('terminal-active'));
  media.addEventListener?.('change', () => { if (theme === 'auto') setTheme('auto'); });
  document.querySelectorAll<HTMLButtonElement>('button[data-theme-mode]').forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.themeMode as ThemeMode)));
  document.querySelectorAll<HTMLButtonElement>('[data-lang-switch]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.langSwitch as Language)));
  document.querySelectorAll<HTMLButtonElement>('[data-tty-theme]').forEach((button) => button.addEventListener('click', () => setTtyTheme(button.dataset.ttyTheme as ThemeMode)));
  document.querySelectorAll<HTMLButtonElement>('[data-terminal-enter]').forEach((button) => button.addEventListener('click', () => setTerminal(false)));
  document.querySelectorAll<HTMLButtonElement>('[data-terminal-open]').forEach((button) => button.addEventListener('click', () => setTerminal(true)));
  document.querySelectorAll<HTMLButtonElement>('[data-terminal-command]').forEach((button) => button.addEventListener('click', () => runCommand(button.dataset.terminalCommand || '')));
  document.querySelectorAll<HTMLButtonElement>('[data-like-site]').forEach((button) => button.addEventListener('click', () => { void metrics.toggle('site'); }));
  document.querySelectorAll<HTMLButtonElement>('[data-like-article]').forEach((button) => button.addEventListener('click', () => { void metrics.toggle('article'); }));
  document.querySelector<HTMLButtonElement>('[data-mobile-search]')?.addEventListener('click', () => {
    const menu = document.querySelector<HTMLDetailsElement>('.rumo-mobile-nav');
    if (menu) menu.open = false;
    document.querySelector<HTMLButtonElement>('[data-search-open]')?.click();
  });
  document.querySelector<HTMLFormElement>('[data-terminal-form]')?.addEventListener('submit', (event) => { event.preventDefault(); runCommand(input?.value || ''); });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && history.length) { event.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); input.value = history[historyIndex]; }
    if (event.key === 'ArrowDown' && history.length) { event.preventDefault(); historyIndex = Math.min(history.length, historyIndex + 1); input.value = history[historyIndex] || ''; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') { event.preventDefault(); output?.replaceChildren(); }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && html.classList.contains('terminal-active')) setTerminal(false); });
  const time = document.querySelector<HTMLElement>('[data-terminal-time]');
  if (time) time.textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

  document.querySelectorAll<HTMLButtonElement>('[data-content-filter]').forEach((button) => button.addEventListener('click', () => {
    const root = button.closest<HTMLElement>('[data-filter-root]');
    if (!root) return;
    const value = button.dataset.contentFilter || 'all';
    root.querySelectorAll<HTMLButtonElement>('[data-content-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    root.querySelectorAll<HTMLElement>('[data-content-language]').forEach((item) => { item.hidden = value !== 'all' && item.dataset.contentLanguage !== value; if (!item.hidden) visible++; });
    const empty = root.querySelector<HTMLElement>('[data-filter-empty]');
    if (empty) {
      empty.dataset.zh = value === 'en' ? '暂无英文内容。界面语言切换不会翻译正文。' : '暂时没有这个语言的内容。';
      empty.dataset.en = value === 'en' ? 'No English content yet. The interface language switch does not translate articles.' : 'No content in this language yet.';
      empty.textContent = language === 'en' ? empty.dataset.en : empty.dataset.zh;
      empty.hidden = visible !== 0;
    }
  }));
  const backTop = document.querySelector<HTMLButtonElement>('[data-back-top]');
  const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
  const updateScroll = () => {
    if (backTop) backTop.hidden = window.scrollY < 250;
    const extent = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.textContent = `${Math.min(100, Math.round(window.scrollY / extent * 100))}%`;
  };
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  document.querySelectorAll<HTMLButtonElement>('[data-back-top-inline]').forEach((button) => button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })));
  window.addEventListener('scroll', updateScroll, { passive: true }); updateScroll();

  const canvas = document.querySelector<HTMLCanvasElement>('[data-terminal-orbit]');
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lightOrbitColor = terminal ? getComputedStyle(terminal).getPropertyValue('--light-accent').trim() || '#2c5d71' : '#2c5d71';
    let frame = 0;
    const draw = () => {
      if (!terminal) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '8px monospace';
      for (let ring = 0; ring < 11; ring++) {
        const radius = 44 + ring * 25;
        const points = 24 + ring * 15;
        for (let i = 0; i < points; i++) {
          const a = (i / points) * Math.PI * 2 + frame * (0.002 + ring * 0.00007);
          const x = 400 + Math.cos(a) * radius;
          const y = 180 + Math.sin(a) * radius * 0.36 + Math.sin(a * 3 + ring) * 3;
          const shimmer = Math.sin(a * 5 + ring + frame * 0.012) + 1;
          const opacity = ttyTheme === 'light' ? 0.32 + shimmer * 0.22 : 0.19 + shimmer * 0.18;
          ctx.fillStyle = ttyTheme === 'light' ? lightOrbitColor : '#a9d6e8';
          ctx.globalAlpha = opacity;
          ctx.fillText(i % 7 === 0 ? '+' : '.', x, y);
        }
      }
      ctx.globalAlpha = 1;
      frame++;
      if (!reduced) requestAnimationFrame(draw);
    };
    if (reduced) redrawStillOrbit = draw;
    draw();
  }
}
