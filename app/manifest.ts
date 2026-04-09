import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Heinz Tattoo Studio',
    short_name: 'Heinz Studio',
    description: 'Sistema de gestão rápido e simples para tatuadores.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/logo.jpeg',
        sizes: 'any',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
