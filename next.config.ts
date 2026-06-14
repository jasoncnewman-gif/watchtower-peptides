import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/peptides/glp-1-s',              destination: '/peptides/semaglutide',   permanent: true  },
      { source: '/peptides/glp-2-t',              destination: '/peptides/tirzepatide',   permanent: true  },
      { source: '/peptides/glp-3-r',              destination: '/peptides/retatrutide',   permanent: true  },
      { source: '/peptides/kisspeptin',           destination: '/peptides/kisspeptin-10', permanent: true  },
      // Canonical profile is at pt-141 (comprehensive — seeded June 2026)
      { source: '/peptides/pt-141-bremelanotide', destination: '/peptides/pt-141',        permanent: true  },
      // Canonical profile is at cjc-1295 (has vendor coverage; covers both DAC and no-DAC)
      { source: '/peptides/cjc-1295-no-dac',      destination: '/peptides/cjc-1295',      permanent: false },
    ]
  },
};

export default nextConfig;
