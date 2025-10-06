/**
 * 交互脚本：主题切换、Bing 背景图、鼠标光影、Toast 提示、
 * 分类筛选、搜索、收藏与复制、卡片倾斜、滚动 UI（导航玻璃、进度条、火箭回顶）
 * 注意：本次仅增加中文注释，不改动任何功能。
 */
(function () {
  // Keys（本地存储键名）
  var THEME_KEY = "nav_theme";
  var FAVORITES_KEY = "nav_favorites";
  var CATEGORY_KEY = "nav_category";
  var FAVORITES_ONLY_KEY = "nav_fav_only";

  // Elements（常用 DOM 元素引用）
  var root = document.documentElement;
  var toggleThemeBtn = document.getElementById("toggleTheme");
  var searchInput = document.getElementById("searchInput");
  var categoryBar = document.getElementById("categoryBar");
  var gridEl = document.getElementById("grid");
  var emptyStateEl = document.getElementById("emptyState");
  var resultCountEl = document.getElementById("resultCount");
  var favoritesOnlyBtn = document.getElementById("showFavorites");
  var toastEl = document.getElementById("toast");
  var bingBgEl = document.getElementById("bingBg");
  var cursorGlowEl = document.getElementById("cursorGlow");
  var siteHeader = document.getElementById("siteHeader");
  var scrollTopBtn = document.getElementById("scrollTopBtn");
  var scrollProgressEl = document.getElementById("scrollProgress");
  // 描述弹窗容器（用于显示完整描述）
  var descPopoverEl = document.getElementById("descPopover");
  // Confetti 图层
  var confettiLayerEl = document.getElementById("confettiLayer");
  var confettiCanvas = document.getElementById("confettiCanvas");
  // 使用 canvas-confetti 的 create API；避免预先创建 2D 上下文，以免 transferControlToOffscreen 报错
  var myConfetti = (window.confetti && confettiCanvas) ? window.confetti.create(confettiCanvas, { resize: true, useWorker: false }) : null;
  // 品牌区域（Logo + 标题）
  var brandEl = document.getElementById("brand");

  // State（收藏集合 + 筛选条件状态）
  // 说明：favorites 使用 Set，便于 O(1) 判断是否收藏；state 保存分类/关键词/仅看收藏
  var favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
  var state = {
    category: localStorage.getItem(CATEGORY_KEY) || "all",
    query: "",
    favoritesOnly: localStorage.getItem(FAVORITES_ONLY_KEY) === "1"
  };

  // Theme helpers（主题相关方法）
  // 更新主题切换按钮的图标与文案，保证与当前主题状态同步
  function updateThemeButton() {
    if (!toggleThemeBtn) return;
    var isDark = root.classList.contains("dark");
    toggleThemeBtn.innerHTML =
      '<i class="fa-solid ' + (isDark ? 'fa-moon' : 'fa-sun') + ' mr-1.5"></i>' +
      '<span class="hidden sm:inline">' + (isDark ? '深色模式' : '浅色模式') + '</span>';
  }

  // 设置主题（添加/移除 .dark），并持久化到 localStorage
  function setTheme(theme) {
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
    updateThemeButton();
  }

  // Initialize theme（初始化主题）
  // 优先使用保存的主题；若无则根据系统偏好选择浅色或深色
  (function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      setTheme(saved);
    } else {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  })();

  // Toggle theme（主题切换按钮事件）
  // 点击后在浅色与深色之间切换
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener("click", function () {
      var current = root.classList.contains("dark") ? "dark" : "light";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  // Load Bing daily background image（加载 Bing 每日背景图）
  // 通过官方 HPImageArchive 接口获取；失败时使用后备图片
  function setBingBackground() {
    if (!bingBgEl) return;
    var api = "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN";
    fetch(api).then(function (r) {
      return r.json();
    }).then(function (data) {
      var img = data && data.images && data.images[0];
      var u = img && img.url;
      if (u) {
        var full = u.startsWith("http") ? u : "https://www.bing.com" + u;
        bingBgEl.style.backgroundImage = 'url("' + full + '")';
      }
    }).catch(function () {
      // Fallback image（后备图）
      bingBgEl.style.backgroundImage = 'url("https://bing.com/th?id=OHR.MaroonBells_CO_ZH-CN0706425959_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp")';
    });
  }
  setBingBackground();

  // Mouse light glow（鼠标光影跟随）
  // 将鼠标位置写入 CSS 变量 --x/--y，以驱动 radial-gradient 光影层
  window.addEventListener("mousemove", function (e) {
    if (!cursorGlowEl) return;
    var x = e.clientX + "px";
    var y = e.clientY + "px";
    cursorGlowEl.style.setProperty("--x", x);
    cursorGlowEl.style.setProperty("--y", y);
  });

  // 描述弹窗：在点击描述信息时展示完整文本的小窗口
  function showDescPopover(text, cx, cy) {
    if (!descPopoverEl) return;
    descPopoverEl.textContent = text || "";
    // 先临时放置在屏幕内，避免初次测量尺寸为 0
    descPopoverEl.style.left = "8px";
    descPopoverEl.style.top = "8px";
    // 显示弹窗（带缩放过渡）
    descPopoverEl.classList.remove("opacity-0", "scale-95", "pointer-events-none");
    descPopoverEl.classList.add("opacity-100", "scale-100", "pointer-events-auto");

    // 计算合适位置（避免超出视口）
    var rect = descPopoverEl.getBoundingClientRect();
    var pad = 8;
    var left = Math.min(cx + 12, window.innerWidth - rect.width - pad);
    var top = Math.min(cy + 12, window.innerHeight - rect.height - pad);
    left = Math.max(pad, left);
    top = Math.max(pad, top);
    descPopoverEl.style.left = left + "px";
    descPopoverEl.style.top = top + "px";
  }
  function hideDescPopover() {
    if (!descPopoverEl) return;
    descPopoverEl.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
    descPopoverEl.classList.add("opacity-0", "scale-95", "pointer-events-none");
  }
  // 点击页面空白或弹窗外时关闭；按下 ESC、滚动、窗口大小变化也关闭
  document.addEventListener("click", function (e) {
    var inside = e.target.closest("#descPopover");
    var isDesc = e.target.closest(".desc-text");
    if (!inside && !isDesc) hideDescPopover();
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hideDescPopover();
  });
  window.addEventListener("scroll", hideDescPopover, { passive: true });
  window.addEventListener("resize", hideDescPopover);

  // Confetti Canvas：更自然的物理动画
  function resizeConfettiCanvas() {
    if (!confettiCanvas || !confettiCtx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    confettiCanvas.width = Math.floor(w * confettiDpr);
    confettiCanvas.height = Math.floor(h * confettiDpr);
    confettiCanvas.style.width = w + "px";
    confettiCanvas.style.height = h + "px";
    confettiCtx.setTransform(confettiDpr, 0, 0, confettiDpr, 0, 0);
  }
  resizeConfettiCanvas();
  window.addEventListener("resize", resizeConfettiCanvas);

  

  // DOM 版本（作为降级备用）
  function launchConfettiDOM(x, y) {
    if (!confettiLayerEl) return;
    var colors = ["#22d3ee", "#a78bfa", "#f472b6", "#f59e0b", "#10b981", "#60a5fa"];
    var count = 22;
    for (var i = 0; i < count; i++) {
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = x + "px";
      piece.style.top = y + "px";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (6 + Math.floor(Math.random() * 6)) + "px";
      piece.style.height = (8 + Math.floor(Math.random() * 6)) + "px";
      piece.style.borderRadius = (Math.random() < 0.3 ? 50 : 2) + "px";
      var dx = (Math.random() * 240 - 120);
      var dy = -(80 + Math.random() * 220);
      var rot = 360 + Math.floor(Math.random() * 720);
      var dur = 900 + Math.floor(Math.random() * 700);
      piece.style.setProperty("--dx", dx + "px");
      piece.style.setProperty("--dy", dy + "px");
      piece.style.setProperty("--rot", rot + "deg");
      piece.style.setProperty("--dur", dur + "ms");
      confettiLayerEl.appendChild(piece);
      (function (el, t) {
        setTimeout(function () { el.remove(); }, t + 200);
      })(piece, dur);
    }
  }

  // 包装器：优先使用 canvas-confetti（更自然），不可用时使用 DOM 版本
  function launchConfetti(x, y) {
    var hasLib = typeof window.confetti === "function";
    var api = myConfetti || (hasLib && confettiCanvas ? window.confetti.create(confettiCanvas, { resize: true, useWorker: true }) : null);
    if (api) {
      var origin = {
        x: Math.min(0.98, Math.max(0.02, x / window.innerWidth)),
        y: Math.min(0.98, Math.max(0.02, y / window.innerHeight))
      };
      var colors = ["#22d3ee", "#a78bfa", "#f472b6", "#f59e0b", "#10b981", "#60a5fa"];
      var defaults = {
        origin: origin,
        colors: colors,
        disableForReducedMotion: true
      };
      function fire(ratio, opts) {
        api(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(180 * ratio)
        }));
      }
      // 参考 heroui 的质感：多段 burst，起始更快、后续更广、更慢、更大，重力与衰减适度
      fire(0.25, { spread: 26, startVelocity: 52, scalar: 1.0, ticks: 190 });
      fire(0.2,  { spread: 60, decay: 0.92, scalar: 0.9, drift: (Math.random() - 0.5) * 0.6, ticks: 200 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, startVelocity: 38, gravity: 1.05, ticks: 210 });
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.15, gravity: 1.1, ticks: 220 });
      fire(0.1,  { spread: 120, startVelocity: 45, decay: 0.90, scalar: 1.0, gravity: 1.05, ticks: 210 });
    } else {
      // 若库不可用，回退到 DOM 版本
      launchConfettiDOM(x, y);
    }
  }

  function launchConfettiAtElement(el) {
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    launchConfetti(x, y);
  }

  // 品牌点击动效（随机）：从多种特效中随机选择并按阶段执行
  function runBrandClickAnimation() {
    if (!brandEl) return;
    if (brandEl._animating) return; // 防连点
    brandEl._animating = true;

    // 确保容器有品牌标识类（用于 CSS 选择器匹配）
    brandEl.classList.add("brand");

    // 多种特效定义（阶段类名 + 每阶段持续时间）
    var effects = [
      // 经典：抖动 -> 掉落 -> 回弹
      { stages: ["brand-shake", "brand-drop", "brand-return"], durations: [300, 430, 440] },
      // 旋转缩放混合：轻旋 + 缩放下落 -> 旋转缩放回弹
      { stages: ["brand-twist-out", "brand-twist-in"], durations: [460, 500] },
      // 旋转：旋转下落 -> 旋转回弹
      { stages: ["brand-spin-out", "brand-spin-in"], durations: [500, 520] },
      // 翻转：翻转下落 -> 翻转回弹
      { stages: ["brand-flip-out", "brand-flip-in"], durations: [420, 480] },
      // 弹性：弹性下落 -> 弹性回弹
      { stages: ["brand-bounce-out", "brand-bounce-in"], durations: [420, 440] },
      // 滑动：斜向滑出 -> 斜向滑入
      { stages: ["brand-slide-out", "brand-slide-in"], durations: [380, 420] },
      // 轻微抖动后侧边飞入：抖动 -> 侧向滑出 -> 侧边飞入
      { stages: ["brand-shake-lite", "brand-side-out", "brand-side-in"], durations: [220, 360, 420] }
    ];

    // 随机选择一个特效
    var eff = effects[Math.floor(Math.random() * effects.length)];
    var i = 0;

    // 逐阶段执行
    function nextStage() {
      // 清除上一个阶段类
      if (i > 0) {
        brandEl.classList.remove(eff.stages[i - 1]);
      }
      // 执行完所有阶段后结束
      if (i >= eff.stages.length) {
        brandEl._animating = false;
        return;
      }
      // 添加当前阶段类并在持续时间后进入下一阶段
      brandEl.classList.add(eff.stages[i]);
      var delay = eff.durations[i] || 400;
      setTimeout(function () {
        i++;
        nextStage();
      }, delay);
    }

    nextStage();
  }

  if (brandEl) {
    brandEl.addEventListener("click", function () {
      runBrandClickAnimation();
    });
  }

  // Scroll UI: header glass intensify, progress bar, rocket visibility
  // 滚动相关 UI：导航玻璃态（scrolled）、顶部进度条宽度、右下角火箭显隐
  function updateScrollUi() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;

    if (siteHeader) {
      if (y > 12) {
        siteHeader.classList.add("scrolled");
      } else {
        siteHeader.classList.remove("scrolled");
      }
    }

    if (scrollTopBtn) {
      var show = y > 240;
      scrollTopBtn.classList.toggle("opacity-100", show);
      scrollTopBtn.classList.toggle("translate-y-0", show);
      scrollTopBtn.classList.toggle("pointer-events-auto", show);
      scrollTopBtn.classList.toggle("opacity-0", !show);
      scrollTopBtn.classList.toggle("translate-y-2", !show);
      scrollTopBtn.classList.toggle("pointer-events-none", !show);
    }

    if (scrollProgressEl) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;
      scrollProgressEl.style.width = pct.toFixed(2) + "%";
    }
  }
  // 监听滚动事件（passive 提升滚动性能）
  window.addEventListener("scroll", updateScrollUi, { passive: true });

  // Rocket click -> scroll to top（火箭回顶）
  // 点击火箭按钮平滑滚动至顶部，并立即隐藏火箭
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
      // 立即隐藏火箭作为反馈
      scrollTopBtn.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto");
      scrollTopBtn.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
    });
  }

  // Toast（轻量提示）
  // 显示提示信息（默认“已复制链接”），自动淡出隐藏
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg || "已复制链接";
    toastEl.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");
    toastEl.classList.add("opacity-100");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () {
      toastEl.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
      toastEl.classList.remove("opacity-100");
    }, 1200);
  }

  // Category chips（分类标签）
  // 渲染“全部”和各分类；选中态在浅色（sky）与深色（violet）模式下保持高对比度
  function renderCategories() {
    var chips = [];
    chips.push({ id: "all", name: "全部", icon: "fa-solid fa-border-all" });
    (NAV_DATA || []).forEach(function (c) {
      chips.push({ id: c.id, name: c.name, icon: c.icon || "fa-solid fa-tag" });
    });

    var html = chips.map(function (c) {
      var active = c.id === state.category;
      var base =
        "px-3 py-1.5 rounded-xl border text-sm transition inline-flex items-center gap-2 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/20";
      var act =
        "!text-white !bg-sky-600 hover:!bg-sky-700 " +
        "dark:!text-white dark:!bg-violet-500 dark:hover:!bg-violet-600";
      return (
        '<button class="' +
        base +
        (active ? " " + act : "") +
        '" data-category="' +
        c.id +
        '">' +
        '<i class="' +
        c.icon +
        '"></i>' +
        "<span>" +
        c.name +
        "</span>" +
        "</button>"
      );
    }).join("");
    categoryBar.innerHTML = html;
  }

  // 分类点击：更新选中分类、持久化并重渲染
  categoryBar.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-category]");
    if (!btn) return;
    var id = btn.getAttribute("data-category");
    state.category = id;
    localStorage.setItem(CATEGORY_KEY, id);
    renderCategories();
    renderGrid();
  });

  // Search handling（搜索相关）
  // 标准化文本（小写/修剪），更新查询并刷新网格
  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  // 搜索输入框事件：即输即搜
  searchInput.addEventListener("input", function (e) {
    state.query = e.target.value || "";
    renderGrid();
  });

  // Favorites only toggle（仅看收藏）
  // 切换收藏过滤状态并持久化；按钮样式随状态变化
  favoritesOnlyBtn.addEventListener("click", function () {
    state.favoritesOnly = !state.favoritesOnly;
    localStorage.setItem(FAVORITES_ONLY_KEY, state.favoritesOnly ? "1" : "0");
    favoritesOnlyBtn.classList.toggle("bg-amber-300/30", state.favoritesOnly);
    favoritesOnlyBtn.classList.toggle("border-amber-300/50", state.favoritesOnly);
    renderGrid();
  });
  // Reflect initial state（初始状态回填）
  (function initFavOnly() {
    if (state.favoritesOnly) {
      favoritesOnlyBtn.classList.add("bg-amber-300/30", "border-amber-300/50");
    }
  })();

  // Render grid（网格渲染）
  // 计算筛选后的列表（按分类/关键词/收藏），用于生成卡片 HTML
  function getFilteredItems() {
    var list = [];

    (NAV_DATA || []).forEach(function (c) {
      if (state.category !== "all" && c.id !== state.category) return;
      c.items.forEach(function (it) {
        list.push({ category: c.id, categoryName: c.name, item: it });
      });
    });

    var q = normalize(state.query);
    if (q) {
      list = list.filter(function (x) {
        var t = normalize(x.item.title);
        var d = normalize(x.item.desc);
        var cn = normalize(x.categoryName);
        return t.indexOf(q) >= 0 || d.indexOf(q) >= 0 || cn.indexOf(q) >= 0;
      });
    }

    if (state.favoritesOnly) {
      list = list.filter(function (x) {
        return favorites.has(x.item.id);
      });
    }

    return list;
  }

  // 根据筛选结果渲染卡片；无结果时显示空态提示
  function renderGrid() {
    var items = getFilteredItems();
    resultCountEl.textContent = items.length + " 条结果";

    if (items.length === 0) {
      gridEl.innerHTML = "";
      emptyStateEl.classList.remove("hidden");
      return;
    } else {
      emptyStateEl.classList.add("hidden");
    }

    var card =
      'bg-white/60 border border-slate-200/60 backdrop-blur-xl rounded-2xl p-4 shadow-glass hover:bg-white/80 transition dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20 tilt';
    var titleCls = "text-base font-semibold tracking-wide text-slate-800 dark:text-white";
    var descCls = "mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 cursor-pointer desc-text hover:text-slate-800 dark:hover:text-white";
    var chipCls =
      "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 dark:bg-white/10 dark:border-white/20 dark:text-slate-200";

    var html = items
      .map(function (x) {
        var it = x.item;
        var fav = favorites.has(it.id);
        return (
          '<article class="' +
          card +
          '">' +
          '<div class="flex items-start gap-3">' +
          // 图标容器：闪光 + 轻微摆动；group-hover 触发图标旋转/放大
          '<div class="group icon-wrap inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 dark:bg-white/10 dark:border-white/20 shrink-0 transition hover:scale-105">' +
          '<i class="' +
          (it.icon || "fa-solid fa-link") +
          ' text-fuchsia-500 dark:text-fuchsia-300 text-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-125"></i>' +
          "</div>" +
          '<div class="flex-1">' +
          '<div class="flex items-center justify-between gap-2">' +
          '<a class="' +
          titleCls +
          ' hover:underline" href="' +
          it.url +
          '" target="_blank" rel="noopener">' +
          it.title +
          "</a>" +
          '<div class="flex items-center gap-2">' +
          // 收藏按钮：悬浮放大旋转，点击脉冲 + Toast 提示
          '<button class="fav-btn group px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 transition" aria-label="收藏" data-id="' +
          it.id +
          '">' +
          '<i class="' +
          (fav ? "fa-solid fa-star text-amber-400" : "fa-regular fa-star text-slate-700 dark:text-slate-200") +
          ' transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:text-amber-400"></i>' +
          "</button>" +
          // 复制按钮：悬浮放大旋转并高亮（浅色 sky / 深色 violet）
          '<button class="copy-btn group px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 transition" aria-label="复制链接" data-url="' +
          it.url +
          '">' +
          '<i class="fa-solid fa-copy text-slate-700 dark:text-slate-200 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 group-hover:text-sky-600 dark:group-hover:text-violet-400"></i>' +
          "</button>" +
          "</div>" +
          "</div>" +
          '<p class="' +
          descCls +
          '">' +
          it.desc +
          "</p>" +
          '<div class="mt-2 flex flex-wrap items-center gap-2">' +
          '<span class="' +
          chipCls +
          '"><i class="fa-solid fa-tag"></i>' +
          x.categoryName +
          "</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    gridEl.innerHTML = html;

    // Attach tilt effect to cards（卡片倾斜）
    // 根据鼠标相对位置为卡片设置 rotateX/Y，离开后复位
    attachCardTilt();
  }

  function attachCardTilt() {
    var cards = gridEl.querySelectorAll("article.tilt");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var rx = ((y / rect.height) - 0.5) * -6;
        var ry = ((x / rect.width) - 0.5) * 6;
        card.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  // Delegated handlers for grid actions（网格事件代理）
  // 处理描述点击（弹窗显示完整内容）、收藏与复制点击；展示反馈动画与 Toast
  gridEl.addEventListener("click", function (e) {
    // 描述点击：弹出小窗口显示完整内容
    var descEl = e.target.closest(".desc-text");
    if (descEl) {
      showDescPopover(descEl.textContent || "", e.clientX, e.clientY);
      return;
    }

    var favBtn = e.target.closest(".fav-btn");
    if (favBtn) {
      var id = favBtn.getAttribute("data-id");
      if (!id) return;
      var icon = favBtn.querySelector("i");
      if (icon) {
        icon.classList.add("animate-pulse");
        setTimeout(function () { icon && icon.classList.remove("animate-pulse"); }, 400);
      }
      if (favorites.has(id)) {
        favorites.delete(id);
        showToast("已取消收藏");
      } else {
        favorites.add(id);
        showToast("已加入收藏");
        // 庆祝特效：在收藏按钮处触发彩带
        launchConfettiAtElement(favBtn);
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
      renderGrid();
      return;
    }

    var copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
      var url = copyBtn.getAttribute("data-url");
      if (!url) return;
      navigator.clipboard && navigator.clipboard.writeText(url);
      showToast("链接已复制");
      copyBtn.classList.add("ring-2", "ring-fuchsia-400/50");
      setTimeout(function () {
        copyBtn.classList.remove("ring-2", "ring-fuchsia-400/50");
      }, 600);
    }
  });

  // Keyboard shortcut: focus search with 'f'（键盘快捷键）
  // 按下 f 键快速聚焦搜索框，提升使用效率
  window.addEventListener("keydown", function (e) {
    if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      searchInput.focus();
      e.preventDefault();
    }
  });

  // Init（初始化入口）
  // 渲染分类与网格，并更新滚动相关 UI
  renderCategories();
  renderGrid();
  updateScrollUi();
})();