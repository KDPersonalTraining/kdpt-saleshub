import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KDPT',
    short_name: 'KDPT',
    description: 'Coaching with KD Personal Training',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: '/kd-mark.png', sizes: 'any', type: 'image/png' }],
  };
}
