/**
 * 导航数据 (可根据需要扩展/修改)
 * 参考 https://dev-tools-hub.180822.xyz/ 的分类与内容
 * 说明：本文件仅增加中文注释，不改变数据结构
 */
var NAV_DATA = [
  // 技术栈（前端/后端常用技术与框架）
  {
    id: "tech-stack",
    name: "技术栈",
    icon: "fa-solid fa-layer-group",
    items: [
      { id: "react", title: "React", url: "https://reactjs.org/", desc: "由 Facebook 推出的用户界面库", icon: "fa-brands fa-react" },
      { id: "vue", title: "Vue.js", url: "https://vuejs.org/", desc: "易用、灵活的渐进式框架", icon: "fa-brands fa-vuejs" },
      { id: "nextjs", title: "Next.js", url: "https://nextjs.org/", desc: "React 全栈框架，支持 SSR/SSG", icon: "fa-solid fa-code" },
      { id: "django", title: "Django", url: "https://www.djangoproject.com/", desc: "Python 的高级 Web 框架", icon: "fa-brands fa-python" },
      { id: "spring", title: "Spring", url: "https://spring.io/", desc: "Java 平台的应用框架", icon: "fa-brands fa-java" },
      { id: "tailwindcss", title: "Tailwind CSS", url: "https://tailwindcss.com/", desc: "实用优先的 CSS 框架", icon: "fa-solid fa-swatchbook" }
    ]
  },

  // 核心开发（IDE、终端、CI/CD 等）
  {
    id: "core-dev",
    name: "核心开发",
    icon: "fa-solid fa-wrench",
    items: [
      { id: "cursor", title: "Cursor", url: "https://www.cursor.com/", desc: "AI 辅助的编程 IDE", icon: "fa-solid fa-robot" },
      { id: "warp", title: "Warp", url: "https://www.warp.dev/", desc: "现代化 GPU 加速终端", icon: "fa-solid fa-terminal" },
      { id: "gha", title: "GitHub Actions", url: "https://github.com/features/actions", desc: "CI/CD 自动化构建与部署", icon: "fa-brands fa-github" }
    ]
  },

  // 前端托管（静态站点与 JS 框架托管平台）
  {
    id: "hosting",
    name: "前端托管",
    icon: "fa-solid fa-cloud-arrow-up",
    items: [
      { id: "vercel", title: "Vercel", url: "https://vercel.com/", desc: "前端框架首选托管平台", icon: "fa-solid fa-cloud" },
      { id: "netlify", title: "Netlify", url: "https://www.netlify.com/", desc: "自动化部署的静态托管", icon: "fa-solid fa-cloud" },
      { id: "github-pages", title: "GitHub Pages", url: "https://pages.github.com/", desc: "简单的静态站点托管", icon: "fa-brands fa-github" },
      { id: "cf-pages", title: "Cloudflare Pages", url: "https://pages.cloudflare.com/", desc: "Cloudflare 生态的静态/JS 框架托管", icon: "fa-solid fa-cloud" }
    ]
  },

  // 数据库服务（Serverless/云数据库平台）
  {
    id: "db-services",
    name: "数据库服务",
    icon: "fa-solid fa-database",
    items: [
      { id: "supabase", title: "Supabase", url: "https://supabase.com/", desc: "开源的 Firebase 替代品 (Postgres)", icon: "fa-solid fa-database" },
      { id: "neon", title: "Neon", url: "https://neon.tech/", desc: "PostgreSQL 无服务器平台", icon: "fa-solid fa-database" },
      { id: "planetscale", title: "PlanetScale", url: "https://planetscale.com/", desc: "基于 Vitess 的 Serverless MySQL", icon: "fa-solid fa-database" },
      { id: "upstash", title: "Upstash", url: "https://upstash.com/", desc: "Serverless Redis/Kafka/VectorDB", icon: "fa-solid fa-database" }
    ]
  },

  // 分析工具（流量与行为分析）
  {
    id: "analytics",
    name: "分析工具",
    icon: "fa-solid fa-chart-line",
    items: [
      { id: "ga", title: "Google Analytics", url: "https://marketingplatform.google.com/about/analytics/", desc: "网站流量与转化分析", icon: "fa-brands fa-google" },
      { id: "clarity", title: "Microsoft Clarity", url: "https://clarity.microsoft.com/", desc: "免费行为分析，热图与会话录制", icon: "fa-brands fa-microsoft" },
      { id: "plausible", title: "Plausible", url: "https://plausible.io/", desc: "隐私友好的轻量分析", icon: "fa-solid fa-chart-simple" },
      { id: "umami", title: "Umami", url: "https://umami.is/", desc: "开源网站分析平台", icon: "fa-solid fa-chart-pie" }
    ]
  },

  // 设计与资源（设计工具、图标与字体）
  {
    id: "design",
    name: "设计与资源",
    icon: "fa-solid fa-palette",
    items: [
      { id: "figma", title: "Figma", url: "https://www.figma.com/", desc: "协作式设计与原型", icon: "fa-brands fa-figma" },
      { id: "canva", title: "Canva", url: "https://www.canva.com/", desc: "在线平面设计工具", icon: "fa-solid fa-pen-nib" },
      { id: "penpot", title: "Penpot", url: "https://penpot.app/", desc: "开源设计与原型工具", icon: "fa-solid fa-pen-ruler" },
      { id: "google-fonts", title: "Google Fonts", url: "https://fonts.google.com/", desc: "免费专业字体库", icon: "fa-solid fa-font" },
      { id: "font-awesome", title: "Font Awesome", url: "https://fontawesome.com/", desc: "海量图标资源", icon: "fa-solid fa-icons" }
    ]
  },

  // 服务器与计算（云服务器与现代计算平台）
  {
    id: "servers",
    name: "服务器与计算",
    icon: "fa-solid fa-server",
    items: [
      { id: "render", title: "Render", url: "https://render.com/", desc: "统一的云平台 (Web/DB/静态站等)", icon: "fa-solid fa-server" },
      { id: "koyeb", title: "Koyeb", url: "https://www.koyeb.com/", desc: "现代化无服务平台", icon: "fa-solid fa-server" },
      { id: "digitalocean", title: "DigitalOcean", url: "https://cloud.digitalocean.com/droplets", desc: "易用的云服务器", icon: "fa-solid fa-server" },
      { id: "linode", title: "Linode", url: "https://www.linode.com/", desc: "老牌稳定的云服务商 (Akamai)", icon: "fa-solid fa-server" }
    ]
  },

  // 文档与 API（文档站与接口设计）
  {
    id: "docs",
    name: "文档与 API",
    icon: "fa-solid fa-book",
    items: [
      { id: "docusaurus", title: "Docusaurus", url: "https://docusaurus.io/", desc: "React 静态文档站生成器", icon: "fa-solid fa-book" },
      { id: "vitepress", title: "VitePress", url: "https://vitepress.dev/", desc: "基于 Vite 的快速文档引擎", icon: "fa-solid fa-book-open" },
      { id: "gitbook", title: "GitBook", url: "https://gitbook.com/", desc: "现代化的文档平台", icon: "fa-solid fa-book" },
      { id: "swagger", title: "Swagger / OpenAPI", url: "https://swagger.io/", desc: "API 设计与文档生态", icon: "fa-solid fa-code" }
    ]
  }
];