(function () {
  // Keys
  var THEME_KEY = "nav_theme";
  var FAVORITES_KEY = "nav_favorites";
  var CATEGORY_KEY = "nav_category";
  var FAVORITES_ONLY_KEY = "nav_fav_only";

  // Elements
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

  // State
  var favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
  var state = {
    category: localStorage.getItem(CATEGORY_KEY) || "all",
    query: "",
    favoritesOnly: localStorage.getItem(FAVORITES_ONLY_KEY) === "1"
  };

  // Theme helpers
  function updateThemeButton() {
    if (!toggleThemeBtn) return;
    var isDark = root.classList.contains("dark");
    toggleThemeBtn.innerHTML =
      '<i class="fa-solid ' + (isDark ? 'fa-moon' : 'fa-sun') + ' mr-1.5"></i>' +
      '<span class="hidden sm:inline">' + (isDark ? '深色模式' : '浅色模式') + '</span>';
  }

  function setTheme(theme) {
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
    updateThemeButton();
  }

  // Initialize theme
  (function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      setTheme(saved);
    } else {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  })();

  // Toggle theme
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener("click", function () {
      var current = root.classList.contains("dark") ? "dark" : "light";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  // Load Bing daily background image
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
      // Fallback image
      bingBgEl.style.backgroundImage = 'url("https://bing.com/th?id=OHR.MaroonBells_CO_ZH-CN0706425959_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp")';
    });
  }
  setBingBackground();

  // Mouse light glow
  window.addEventListener("mousemove", function (e) {
    if (!cursorGlowEl) return;
    var x = e.clientX + "px";
    var y = e.clientY + "px";
    cursorGlowEl.style.setProperty("--x", x);
    cursorGlowEl.style.setProperty("--y", y);
  });

  // Toast
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

  // Category chips
  function renderCategories() {
    var chips = [];
    chips.push({ id: "all", name: "全部", icon: "fa-solid fa-border-all" });
    (NAV_DATA || []).forEach(function (c) {
      chips.push({ id: c.id, name: c.name, icon: c.icon || "fa-solid fa-tag" });
    });

    var html = chips.map(function (c) {
      var active = c.id === state.category;
      var base =
        "px-3 py-1.5 rounded-xl border text-sm transition inline-flex items-center gap-2 bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-slate-200";
      var act = "bg-fuchsia-500/30 border-fuchsia-400/40 text-white";
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

  categoryBar.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-category]");
    if (!btn) return;
    var id = btn.getAttribute("data-category");
    state.category = id;
    localStorage.setItem(CATEGORY_KEY, id);
    renderCategories();
    renderGrid();
  });

  // Search handling
  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  searchInput.addEventListener("input", function (e) {
    state.query = e.target.value || "";
    renderGrid();
  });

  // Favorites only toggle
  favoritesOnlyBtn.addEventListener("click", function () {
    state.favoritesOnly = !state.favoritesOnly;
    localStorage.setItem(FAVORITES_ONLY_KEY, state.favoritesOnly ? "1" : "0");
    favoritesOnlyBtn.classList.toggle("bg-amber-300/30", state.favoritesOnly);
    favoritesOnlyBtn.classList.toggle("border-amber-300/50", state.favoritesOnly);
    renderGrid();
  });
  // Reflect initial state
  (function initFavOnly() {
    if (state.favoritesOnly) {
      favoritesOnlyBtn.classList.add("bg-amber-300/30", "border-amber-300/50");
    }
  })();

  // Render grid
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
          '<button class="fav-btn px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20" aria-label="收藏" data-id="' +
          it.id +
          '">' +
          '<i class="' +
          (fav ? "fa-solid fa-star text-amber-400" : "fa-regular fa-star") +
          '"></i>' +
          "</button>" +
          '<button class="copy-btn px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20" aria-label="复制链接" data-url="' +
          it.url +
          '">' +
          '<i class="fa-solid fa-copy"></i>' +
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

    // Attach tilt effect to cards
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

  // Delegated handlers for grid actions
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

  // Keyboard shortcut: focus search with 'f'
  window.addEventListener("keydown", function (e) {
    if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      searchInput.focus();
      e.preventDefault();
    }
  });

  // Init
  renderCategories();
  renderGrid();
})();