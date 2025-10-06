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
    var descCls = "mt-1.5 text-sm text-slate-600 dark:text-slate-300";
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
  // 处理收藏与复制点击；更新收藏集合与本地存储；展示反馈动画与 Toast
  gridEl.addEventListener("click", function (e) {
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