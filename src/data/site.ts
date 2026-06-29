// Edit this file to update the homepage copy and links.
// The code links below are deliberately manual. Keep only a few worth pointing to.
export const site = {
  masthead: "david.mn",
  name: "David Nelson",
  title: "David Nelson · david.mn",
  description:
    "The personal site of David Nelson, a software engineer in Brazil.",
  intro:
    "I’m a software engineer based in Brazil. I work on web products, data-heavy systems, and developer workflows. Over the years I’ve worked as both an individual contributor and an engineering leader, and I tend to enjoy the places where technical depth, product judgment, and team direction meet.",
  currently:
    "I’m working at Dexory on software that turns warehouse robot scans into inventory visibility, exceptions, and operational workflows.",
  thinkingAbout: [
    {
      theme: "AI-assisted software development",
      detail:
        "not as magic, but as a change in how software gets written.",
    },
    {
      theme: "Data-heavy applications",
      detail:
        "modeling information well, making queries fast, and keeping product logic understandable as systems grow.",
    },
    {
      theme: "Product-minded engineering",
      detail:
        "building software around real workflows, feedback loops, and the decisions people need to make.",
    },
    {
      theme: "Home automation and personal infrastructure",
      detail: "small systems that are useful because they keep working.",
    },
    {
      theme: "Technical leadership",
      detail:
        "especially the parts close to product judgment, architecture, and team direction.",
    },
  ],
  codeIntro:
    "A few recent public projects and older experiments live on GitHub.",
  codeLinks: [
    {
      title: "sentiment-analysis-imdb",
      description: "An LSTM experiment on film reviews.",
      href: "https://github.com/dmnelson/sentiment-analysis-imdb",
    },
    {
      title: "winston",
      description: "A small constraint-satisfaction implementation for Ruby.",
      href: "https://github.com/dmnelson/winston",
    },
    {
      title: "notaflow",
      description:
        "tools for manual Brazilian NFS-e generation from commercial invoices.",
      href: "https://github.com/dmnelson/notaflow",
    },
    {
      title: "nfse-js",
      description: "TypeScript tooling for Brazil's national NFS-e standard.",
      href: "https://github.com/dmnelson/nfse-js",
    },
    {
      title: "ivce",
      description:
        "a local-first CLI for contractor invoices from YAML files.",
      href: "https://github.com/dmnelson/ivce",
    },
    {
      title: "jsonresume-theme-colophon",
      description:
        "a warm, text-first JSON Resume theme for HTML resumes and PDFs.",
      href: "https://github.com/dmnelson/jsonresume-theme-colophon",
    },
    {
      title: "GitHub archive",
      description: "older public code, experiments, and smaller repos.",
      href: "https://github.com/dmnelson",
    },
  ],
  publicationsIntro:
    "Research work on machine learning and financial time series.",
  publications: [
    {
      title:
        "Stock market’s price movement prediction with LSTM neural networks",
      description: "IJCNN, 2017.",
      href: "https://ieeexplore.ieee.org/document/7966019",
    },
    {
      title: "Using LSTM and Technical Indicators to predict price movements",
      description: "KDMiLe, 2016.",
      href: "https://cin.ufpe.br/~rv2/kdmile2016/anais-kdmile-2016.pdf",
    },
  ],
  elsewhere: [
    { label: "GitHub", href: "https://github.com/dmnelson" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/davidmichaelnelson/",
    },
    { label: "CV", href: "/cv/" },
    { label: "Email", href: "mailto:me@david.mn" },
  ],
  footer: "Belo Horizonte, Brazil",
} as const;
