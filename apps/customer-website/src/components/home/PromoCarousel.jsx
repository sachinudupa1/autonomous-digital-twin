
import { useState, useEffect } from 'react';

import { PROMO_BANNERS } from '../../constants/config';
import { BALL_IMAGES_BY_FILE } from '../../constants/productImages';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '../common/Icons';

/**
 * PromoCarousel
 *
 * Four interactive abstract brand campaigns and one product offer.
 *
 * Brand backgrounds:
 * - CrimsonCraft: bright orange.
 * - Aurelius Optics: bright yellow.
 * - Azura Studio: bright blue.
 * - Verdant Luxe: bright green.
 *
 * Brand slides contain NO photographs or product images.
 * Only the fifth offer slide displays the actual Yellow Glass Ball.
 *
 * Features:
 * - Animated abstract colour backgrounds.
 * - Mouse-following lighting effect.
 * - Floating geometric shapes.
 * - Brand-specific animation styles.
 * - Automatic slide rotation.
 * - Pause on hover.
 * - Previous and next controls.
 * - Individual slide indicators.
 * - Campaign navigation.
 * - Reduced-motion accessibility support.
 */

/**
 * Animated background artwork for the four brand campaigns.
 *
 * All artwork is created with CSS gradients and geometric shapes.
 * No external images or additional assets are required.
 */
function BrandArtwork({ banner, pointer }) {
  const colors = banner.backgroundColors || {};

  const artworkStyle = {
    backgroundColor: colors.base || banner.surface,
    '--brand-base': colors.base || banner.surface,
    '--brand-secondary': colors.secondary || banner.surface,
    '--brand-glow': colors.glow || banner.accent,
    '--brand-highlight': colors.highlight || banner.accent,
    '--brand-accent': banner.accent,
    '--pointer-x': `${pointer.x}%`,
    '--pointer-y': `${pointer.y}%`,
  };

  return (
    <div
      className={`promo-artwork promo-theme-${banner.backgroundTheme || 'default'}`}
      style={artworkStyle}
      aria-hidden="true"
    >
      <div className="promo-artwork-base" />

      <div className="promo-pointer-glow" />

      <div className="promo-orb promo-orb-one" />
      <div className="promo-orb promo-orb-two" />
      <div className="promo-orb promo-orb-three" />

      <div className="promo-ring promo-ring-one" />
      <div className="promo-ring promo-ring-two" />

      <div className="promo-shape promo-shape-one" />
      <div className="promo-shape promo-shape-two" />

      <div className="promo-light promo-light-one" />
      <div className="promo-light promo-light-two" />
      <div className="promo-light promo-light-three" />
      <div className="promo-light promo-light-four" />

      <div className="promo-artwork-texture" />
    </div>
  );
}

export function PromoCarousel({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [pointer, setPointer] = useState({
    x: 65,
    y: 45,
  });

  const bannerCount = PROMO_BANNERS.length;
  const banner = PROMO_BANNERS[currentIndex];

  /**
   * Automatically rotate campaigns every five seconds.
   * Pause rotation while the user is interacting with the banner.
   */
  useEffect(() => {
    if (isPaused || bannerCount < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (
        (previousIndex + 1) % bannerCount
      ));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused, bannerCount]);

  if (!banner) {
    return null;
  }

  const isOffer = banner.type === 'offer';

  /**
   * Retrieve the actual product photograph.
   * Only the featured product offer uses this image.
   */
  const offerImage = (
    isOffer && banner.productImage
      ? BALL_IMAGES_BY_FILE[banner.productImage]
      : null
  );

  /**
   * Track mouse movement to create an interactive lighting effect.
   */
  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setPointer({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  /**
   * Navigate to the next campaign.
   */
  const nextSlide = () => {
    setCurrentIndex((previousIndex) => (
      (previousIndex + 1) % bannerCount
    ));
  };

  /**
   * Navigate to the previous campaign.
   */
  const previousSlide = () => {
    setCurrentIndex((previousIndex) => (
      (previousIndex - 1 + bannerCount) % bannerCount
    ));
  };

  /**
   * Select a campaign using its indicator.
   */
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  /**
   * Open the corresponding website page.
   * Campaigns with a search query pass it to Products.
   */
  const handleCampaignClick = () => {
    const destination = banner.ctaPage || 'products';

    const navigationParams = banner.searchQuery
      ? { search: banner.searchQuery }
      : {};

    onNavigate(destination, navigationParams);
  };

  /**
   * Use dark text on bright brand buttons for better contrast.
   */
  const campaignButtonText = banner.textColor || '#FFFFFF';

  return (
    <>
      <style>{`

        .promo-artwork {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 310px;
          overflow: hidden;
          isolation: isolate;
          background: var(--brand-base);
          transition: background-color 500ms ease;
        }

        .promo-artwork-base {
          position: absolute;
          inset: 0;
          z-index: -5;
          background:
            radial-gradient(
              ellipse at 72% 45%,
              var(--brand-glow) 0%,
              transparent 62%
            ),
            linear-gradient(
              135deg,
              var(--brand-base) 0%,
              var(--brand-secondary) 55%,
              var(--brand-base) 100%
            );
          background-size: 150% 150%;
          animation: promoBackgroundDrift 12s ease-in-out infinite alternate;
        }

        .promo-pointer-glow {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background:
            radial-gradient(
              230px circle at var(--pointer-x) var(--pointer-y),
              var(--brand-highlight),
              transparent 72%
            );
          opacity: 0.23;
          mix-blend-mode: screen;
          transition: opacity 250ms ease;
        }

        .promo-artwork:hover .promo-pointer-glow {
          opacity: 0.40;
        }

        .promo-orb {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          will-change: transform;
        }

        .promo-orb-one {
          width: 220px;
          height: 220px;
          top: -55px;
          right: 12%;
          background:
            radial-gradient(
              circle at 35% 30%,
              var(--brand-highlight) 0%,
              var(--brand-glow) 35%,
              transparent 72%
            );
          opacity: 0.58;
          animation: promoFloatOne 11s ease-in-out infinite;
        }

        .promo-orb-two {
          width: 175px;
          height: 175px;
          left: 8%;
          bottom: -85px;
          background:
            radial-gradient(
              circle at 40% 35%,
              var(--brand-highlight),
              var(--brand-glow) 42%,
              transparent 74%
            );
          opacity: 0.42;
          animation: promoFloatTwo 14s ease-in-out infinite;
        }

        .promo-orb-three {
          width: 105px;
          height: 105px;
          right: 4%;
          bottom: 8%;
          background:
            radial-gradient(
              circle at 35% 30%,
              var(--brand-highlight),
              transparent 70%
            );
          opacity: 0.30;
          animation: promoFloatThree 9s ease-in-out infinite;
        }

        .promo-ring {
          position: absolute;
          border: 1px solid var(--brand-highlight);
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.30;
        }

        .promo-ring-one {
          width: 245px;
          height: 245px;
          right: -45px;
          top: 25px;
          animation: promoRingRotate 24s linear infinite;
        }

        .promo-ring-two {
          width: 165px;
          height: 165px;
          right: -5px;
          top: 65px;
          border-width: 2px;
          opacity: 0.17;
          animation: promoRingRotate 18s linear infinite reverse;
        }

        .promo-shape {
          position: absolute;
          pointer-events: none;
          border: 1px solid var(--brand-highlight);
          opacity: 0.22;
        }

        .promo-shape-one {
          width: 100px;
          height: 100px;
          right: 34%;
          top: 22%;
          border-radius: 24px;
          transform: rotate(35deg);
          animation: promoShapeFloat 13s ease-in-out infinite;
        }

        .promo-shape-two {
          width: 62px;
          height: 62px;
          right: 17%;
          bottom: 12%;
          border-radius: 18px;
          transform: rotate(45deg);
          animation: promoShapeFloat 10s ease-in-out infinite reverse;
        }

        .promo-light {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--brand-highlight);
          box-shadow:
            0 0 12px var(--brand-highlight),
            0 0 24px var(--brand-glow);
          opacity: 0.65;
          pointer-events: none;
        }

        .promo-light-one {
          left: 19%;
          top: 22%;
          animation: promoLightPulse 4s ease-in-out infinite;
        }

        .promo-light-two {
          right: 24%;
          top: 18%;
          animation: promoLightPulse 5s ease-in-out infinite 1s;
        }

        .promo-light-three {
          right: 12%;
          bottom: 28%;
          animation: promoLightPulse 4.5s ease-in-out infinite 2s;
        }

        .promo-light-four {
          left: 40%;
          bottom: 12%;
          animation: promoLightPulse 5.5s ease-in-out infinite 0.5s;
        }

        .promo-artwork-texture {
          position: absolute;
          inset: 0;
          z-index: 4;
          pointer-events: none;
          opacity: 0.10;
          background-image:
            radial-gradient(
              rgba(255,255,255,0.8) 0.7px,
              transparent 0.7px
            );
          background-size: 20px 20px;
        }

        /* CrimsonCraft: abstract circular forms */
        .promo-theme-crimson .promo-orb-one {
          width: 245px;
          height: 245px;
        }

        .promo-theme-crimson .promo-ring-one {
          border-style: dashed;
        }

        .promo-theme-crimson .promo-shape-one {
          border-radius: 50%;
        }

        /* Aurelius Optics: refined geometric forms */
        .promo-theme-aurelius .promo-orb-one {
          background:
            radial-gradient(
              circle at 35% 30%,
              var(--brand-highlight),
              var(--brand-glow) 40%,
              transparent 74%
            );
        }

        .promo-theme-aurelius .promo-ring-one {
          border-width: 2px;
        }

        .promo-theme-aurelius .promo-shape-one {
          border-radius: 50% 50% 12px 12px;
        }

        /* Azura Studio: flowing oval forms */
        .promo-theme-azura .promo-orb-one {
          width: 255px;
          height: 185px;
          border-radius: 46% 54% 62% 38%;
          transform: rotate(-28deg);
        }

        .promo-theme-azura .promo-orb-two {
          width: 190px;
          height: 110px;
          border-radius: 50%;
          transform: rotate(30deg);
        }

        .promo-theme-azura .promo-ring-one {
          width: 285px;
          height: 150px;
          border-radius: 50%;
          transform: rotate(-25deg);
        }

        .promo-theme-azura .promo-ring-two {
          width: 220px;
          height: 110px;
          border-radius: 50%;
          transform: rotate(-25deg);
        }

        .promo-theme-azura .promo-shape-one {
          width: 180px;
          height: 35px;
          border-radius: 50%;
          transform: rotate(-25deg);
        }

        /* Verdant Luxe: organic abstract forms */
        .promo-theme-verdant .promo-orb-one {
          border-radius: 42% 58% 55% 45%;
          transform: rotate(30deg);
        }

        .promo-theme-verdant .promo-orb-two {
          border-radius: 40% 60% 48% 52%;
          transform: rotate(-25deg);
        }

        .promo-theme-verdant .promo-ring-one {
          border-radius: 42% 58% 55% 45%;
          transform: rotate(45deg);
        }

        .promo-theme-verdant .promo-shape-one {
          border-radius: 35% 65% 50% 50%;
          transform: rotate(25deg);
        }

        @keyframes promoBackgroundDrift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }

        @keyframes promoFloatOne {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-20px, 25px) scale(1.10);
          }
        }

        @keyframes promoFloatTwo {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(25px, -25px);
          }
        }

        @keyframes promoFloatThree {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-22px);
          }
        }

        @keyframes promoRingRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes promoShapeFloat {
          0%, 100% {
            translate: 0 0;
          }
          50% {
            translate: 0 -18px;
          }
        }

        @keyframes promoLightPulse {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.5);
          }
        }

        @media (max-width: 639px) {
          .promo-artwork {
            min-height: 230px;
          }

          .promo-ring-one {
            right: -70px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .promo-artwork *,
          .promo-artwork::before,
          .promo-artwork::after {
            animation: none !important;
            transition: none !important;
          }

          .promo-pointer-glow {
            display: none;
          }
        }

      `}</style>

      <section
        className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onPointerMove={handlePointerMove}
        aria-label="Brand advertising and featured product offers"
      >
        {!isOffer ? (

          <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_.95fr] sm:h-[310px]">

            {/* LEFT: BRAND INFORMATION */}

            <div
              className="relative z-10 flex flex-col justify-center px-6 sm:px-7 lg:px-9 py-8 sm:py-6 min-h-[250px] sm:min-h-0"
              style={{
                backgroundColor: banner.backgroundColors?.base || banner.surface,
                color: banner.textColor || '#FFFFFF',
                borderLeft: `6px solid ${banner.accent}`,
              }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">

                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{
                    color: banner.textColor || '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.20)',
                    border: '1px solid rgba(0,0,0,0.16)',
                  }}
                >
                  {banner.tag}
                </span>

                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: banner.textColor || '#FFFFFF',
                    opacity: 0.75,
                  }}
                >
                  {banner.brand}
                </span>

              </div>

              <h2 className="max-w-xl text-2xl sm:text-2xl lg:text-[2rem] font-black tracking-tight leading-[1.12]">
                {banner.heading}
              </h2>

              <p
                className="mt-3 max-w-lg text-xs sm:text-sm leading-relaxed"
                style={{
                  color: banner.textColor || '#FFFFFF',
                  opacity: 0.82,
                }}
              >
                {banner.subheading}
              </p>

              <div className="mt-5">

                <button
                  type="button"
                  onClick={handleCampaignClick}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  style={{
                    backgroundColor: banner.accent,
                    color: campaignButtonText,
                  }}
                >
                  <span>{banner.buttonText}</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* RIGHT: INTERACTIVE COLOUR ARTWORK */}

            <div className="relative w-full min-h-[230px] sm:h-full overflow-hidden">

              <BrandArtwork
                banner={banner}
                pointer={pointer}
              />

              <div className="absolute z-10 right-5 bottom-4 pointer-events-none">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.28em]"
                  style={{
                    color: banner.textColor || '#FFFFFF',
                    opacity: 0.55,
                  }}
                >
                  {banner.brand}
                </span>
              </div>

            </div>

          </div>

        ) : (

          /* FIFTH SLIDE: ACTUAL PRODUCT OFFER */

          <div
            className="grid grid-cols-1 sm:grid-cols-[1.15fr_.85fr] sm:min-h-[310px]"
            style={{
              backgroundColor: banner.surface || '#FFF4E8',
            }}
          >

            {/* LEFT: OFFER DETAILS */}

            <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-9 py-7 sm:py-6">

              <span
                className="inline-flex self-start rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-white"
                style={{
                  color: banner.accent,
                  borderColor: banner.accent,
                }}
              >
                {banner.tag}
              </span>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {banner.brand}
              </p>

              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {banner.heading}
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
                {banner.subheading}
              </p>

              <div className="mt-5">

                <button
                  type="button"
                  onClick={handleCampaignClick}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-transform cursor-pointer"
                  style={{
                    backgroundColor: banner.accent,
                  }}
                >
                  {banner.buttonText}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>

              </div>

            </div>

            {/* RIGHT: ACTUAL YELLOW GLASS BALL IMAGE */}

            <div className="relative min-h-[240px] sm:min-h-[310px] flex items-center justify-center p-5 sm:p-6">

              {offerImage ? (

                <div className="relative w-full max-w-[290px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

                  <div className="w-full aspect-[5/4] flex items-center justify-center p-3 bg-white">

                    <img
                      src={offerImage}
                      alt="Aurelius Optics Yellow Glass Ball"
                      className="block w-full h-full object-contain"
                      draggable={false}
                    />

                  </div>

                  <div className="border-t border-slate-100 bg-white px-4 py-3 text-center">

                    <p className="text-sm font-black text-slate-900">
                      Yellow Glass Ball
                    </p>

                    <p
                      className="mt-1 text-sm font-bold"
                      style={{
                        color: banner.accent,
                      }}
                    >
                      ₹200 per unit
                    </p>

                  </div>

                </div>

              ) : (

                <div className="text-sm font-semibold text-slate-500">
                  Featured product image unavailable
                </div>

              )}

            </div>

          </div>

        )}

        {/* CAROUSEL CONTROL BAR */}

        <div className="relative z-20 bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between">

          <div
            className="flex items-center gap-1.5"
            aria-label="Choose advertising campaign"
          >

            {PROMO_BANNERS.map((item, index) => (

              <button
                key={item.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  currentIndex === index
                    ? 'w-6'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                style={
                  currentIndex === index
                    ? {
                        backgroundColor: item.accent,
                      }
                    : undefined
                }
                aria-label={`Show campaign ${index + 1}: ${item.brand}`}
                aria-pressed={currentIndex === index}
              />

            ))}

          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={previousSlide}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
              aria-label="Previous campaign"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-bold text-slate-500 font-mono tabular-nums">
              {currentIndex + 1} / {bannerCount}
            </span>

            <button
              type="button"
              onClick={nextSlide}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
              aria-label="Next campaign"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>

          </div>

        </div>

      </section>
    </>
  );
}
