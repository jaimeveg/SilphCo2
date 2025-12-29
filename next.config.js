/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// [PokeAPI: Máster para obtención de información sobre Pokémon, stats, sprites e imágenenes, movimientos y habilidades, entre otras]
// [Duiker101: Recursos de imagen SVG para componer visuales de los tipos pokémon]

export default nextConfig;
