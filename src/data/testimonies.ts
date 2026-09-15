import type { ImageMetadata } from 'astro';
import poster884e95be from '@/assets/testimonies/testimony-884e95be-poster.jpg';
import posterImg2294 from '@/assets/testimonies/testimony-img2294-poster.jpg';
import posterBeefae6d from '@/assets/testimonies/testimony-beefae6d-poster.jpg';

// Authentic testimonies recorded for Garden Ministries and authorized for public use (owner decision 2026-09-15).
// Videos are encoded with scripts/media/encode-video.swift; posters are frames from those encodes.
//
// Optional fields are filled ONLY from information the owner provides — never inferred from the video.
//
// Pending: source ce85921e (landscape, visible InShot watermark) stays unpublished until a clean original
// exists. To add it (or any testimony): encode to /videos/testimonies/testimony-<id>-v1.mp4, save a poster
// frame in src/assets/testimonies/, and append an entry below. Landscape videos are letterboxed in the
// portrait card; no component change is needed.

type Localized = { en: string; es: string };

export type Testimony = {
  /** Stable id from the source file name; carries no personal information. */
  id: string;
  src: string;
  poster: ImageMetadata;
  width: number;
  height: number;
  durationSec: number;
  /** Owner-provided name to show under the video. */
  name?: string;
  /** Owner-provided short context, shown under the video. */
  summary?: Localized;
  /** WebVTT caption files by language, e.g. { es: '/videos/testimonies/testimony-<id>.es.vtt' }. */
  captions?: Partial<Record<'en' | 'es', string>>;
  /** Only when the owner links the testimony to a mission. */
  missionSlug?: string;
};

export const testimonies: Testimony[] = [
  {
    id: '884e95be',
    src: '/videos/testimonies/testimony-884e95be-v1.mp4',
    poster: poster884e95be,
    width: 464,
    height: 832,
    durationSec: 31.5,
  },
  {
    id: 'img2294',
    src: '/videos/testimonies/testimony-img2294-v1.mp4',
    poster: posterImg2294,
    width: 720,
    height: 1280,
    durationSec: 18.4,
  },
  {
    id: 'beefae6d',
    src: '/videos/testimonies/testimony-beefae6d-v1.mp4',
    poster: posterBeefae6d,
    width: 464,
    height: 832,
    durationSec: 58.9,
  },
];
