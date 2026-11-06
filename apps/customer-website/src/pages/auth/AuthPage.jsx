
import { useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

import {
  AutoPackLogo,
  AlertCircleIcon,
  CheckCircleIcon,
  UserIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '../../components/common/Icons';

import { GUEST_ID_REGEX } from '../../constants/config';

export function AuthPage() {
  const { register, login, resetDemoData } = useAuth();
  const { showToast } = useToast();

  const [userChoice, setUserChoice] = useState(null);
  const [guestIdInput, setGuestIdInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Mouse position for the neutral background highlight.
  const [pointer, setPointer] = useState({
    x: 50,
    y: 45,
  });

  const trimmedGuestId = guestIdInput.trim();
  const isGuestIdValid = GUEST_ID_REGEX.test(trimmedGuestId);
  const isFirstTime = userChoice === 'first-time';

  /**
   * Track mouse movement for a subtle neutral highlight.
   * Background colours remain fixed and do not follow the mouse.
   */
  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setPointer({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  /**
   * Select account type.
   */
  const handleSelectChoice = (choice) => {
    setUserChoice(choice);
    setErrorMsg('');

    setGuestIdInput(
      choice === 'first-time' ? 'Guest_' : ''
    );
  };

  /**
   * Return to account selection.
   */
  const handleBack = () => {
    setUserChoice(null);
    setGuestIdInput('');
    setErrorMsg('');
    setIsSubmitting(false);
  };

  /**
   * Handle Guest ID registration/login.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');

    if (!trimmedGuestId) {
      setErrorMsg('Please enter your Guest ID.');
      return;
    }

    if (!isGuestIdValid) {
      setErrorMsg(
        'Invalid Guest ID. Use Guest_ followed by a number, for example Guest_1.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isFirstTime) {
        await register(trimmedGuestId);

        showToast(
          `Your account has been created successfully. Welcome, ${trimmedGuestId}!`,
          'success'
        );
      } else {
        await login(trimmedGuestId);

        showToast(
          `Welcome back, ${trimmedGuestId}!`,
          'success'
        );
      }
    } catch (err) {
      setErrorMsg(
        err.message || 'Unable to authenticate. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset mock demonstration data.
   */
  const handleConfirmReset = () => {
    resetDemoData();

    setIsResetModalOpen(false);
    setUserChoice(null);
    setGuestIdInput('');
    setErrorMsg('');

    showToast(
      'Demo data successfully reset.',
      'info'
    );
  };

  return (
    <div
      className="auth-page relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden"
      onPointerMove={handlePointerMove}
      style={{
        '--pointer-x': `${pointer.x}%`,
        '--pointer-y': `${pointer.y}%`,
      }}
    >

      {/* ==========================================
          BACKGROUND ANIMATIONS
      ========================================== */}

      <style>{`

        /* ==========================================
           PAGE BACKGROUND
        ========================================== */

        .auth-page {
          background:
            linear-gradient(
              135deg,
              #E7EBF2 0%,
              #DFE5EF 48%,
              #E9EDF4 100%
            );
          isolation: isolate;
        }

        /* ==========================================
           NEUTRAL MOUSE-AREA HIGHLIGHT
        ========================================== */

        .auth-pointer-light {
          position: absolute;
          inset: 0;
          z-index: -4;
          pointer-events: none;
          background:
            radial-gradient(
              440px circle at var(--pointer-x) var(--pointer-y),
              rgba(255, 255, 255, 0.48) 0%,
              rgba(255, 255, 255, 0.24) 35%,
              rgba(255, 255, 255, 0.08) 58%,
              transparent 78%
            );
          opacity: 0;
          mix-blend-mode: screen;
          transition: opacity 180ms ease-out;
        }

        .auth-page:hover .auth-pointer-light {
          opacity: 1;
        }

        /* ==========================================
           FLOATING BACKGROUND LIGHTS
        ========================================== */

        .auth-orb {
          position: absolute;
          z-index: -3;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(2px);
          will-change: transform;
        }

        .auth-orb-orange {
          width: 360px;
          height: 360px;
          left: -130px;
          top: 8%;
          background:
            radial-gradient(
              circle,
              rgba(194, 78, 12, 0.25) 0%,
              rgba(194, 78, 12, 0.09) 48%,
              transparent 72%
            );
          animation: authFloatOne 11s ease-in-out infinite;
        }

        .auth-orb-blue {
          width: 420px;
          height: 420px;
          right: -160px;
          top: 4%;
          background:
            radial-gradient(
              circle,
              rgba(24, 75, 151, 0.23) 0%,
              rgba(24, 75, 151, 0.075) 52%,
              transparent 74%
            );
          animation: authFloatTwo 13s ease-in-out infinite;
        }

        .auth-orb-green {
          width: 320px;
          height: 320px;
          bottom: -150px;
          left: 36%;
          background:
            radial-gradient(
              circle,
              rgba(24, 111, 61, 0.19) 0%,
              rgba(24, 111, 61, 0.055) 55%,
              transparent 75%
            );
          animation: authFloatThree 15s ease-in-out infinite;
        }

        /* ==========================================
           BOX-INSPIRED GRAPHICS
        ========================================== */

        .auth-package {
          position: absolute;
          z-index: -2;
          pointer-events: none;
          border: 1.5px solid rgba(132, 63, 26, 0.48);
          border-radius: 15px;
          background:
            linear-gradient(
              140deg,
              rgba(180, 83, 27, 0.10),
              rgba(255, 255, 255, 0.035)
            );
          box-shadow:
            inset 0 0 18px rgba(105, 49, 18, 0.09),
            0 12px 28px rgba(35, 45, 65, 0.08);
          transform: rotate(25deg);
          animation: authPackageFloat 12s ease-in-out infinite;
        }

        /* Box side folds */
        .auth-package::before {
          content: "";
          position: absolute;
          inset: 0;
          border-left: 1.5px solid rgba(120, 55, 21, 0.48);
          border-right: 1.5px solid rgba(120, 55, 21, 0.48);
          transform: skewY(-28deg) scaleX(0.5);
        }

        /* Box folding seam */
        .auth-package::after {
          content: "";
          position: absolute;
          left: -8%;
          top: 50%;
          width: 116%;
          height: 1.5px;
          background: rgba(120, 55, 21, 0.42);
          transform: rotate(-28deg);
        }

        .auth-package-one {
          width: 86px;
          height: 86px;
          left: 11%;
          top: 21%;
        }

        .auth-package-two {
          width: 62px;
          height: 62px;
          right: 12%;
          bottom: 19%;
          border-color: rgba(24, 72, 135, 0.52);
          background:
            linear-gradient(
              140deg,
              rgba(24, 80, 155, 0.12),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -5s;
        }

        .auth-package-two::before {
          border-color: rgba(24, 72, 135, 0.48);
        }

        .auth-package-two::after {
          background: rgba(24, 72, 135, 0.46);
        }

        /* Third package: green */
        .auth-package-three {
          width: 72px;
          height: 72px;
          left: 29%;
          top: 9%;
          border-color: rgba(22, 125, 69, 0.48);
          background:
            linear-gradient(
              140deg,
              rgba(22, 163, 74, 0.12),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -3s;
          animation-duration: 14s;
        }

        .auth-package-three::before {
          border-color: rgba(22, 125, 69, 0.45);
        }

        .auth-package-three::after {
          background: rgba(22, 125, 69, 0.42);
        }

        /* Fourth package: pink */
        .auth-package-four {
          width: 94px;
          height: 94px;
          right: 27%;
          top: 12%;
          border-color: rgba(207, 63, 127, 0.45);
          background:
            linear-gradient(
              140deg,
              rgba(255, 79, 154, 0.12),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -7s;
          animation-duration: 15s;
        }

        .auth-package-four::before {
          border-color: rgba(207, 63, 127, 0.42);
        }

        .auth-package-four::after {
          background: rgba(207, 63, 127, 0.42);
        }

        /* Fifth package: yellow */
        .auth-package-five {
          width: 54px;
          height: 54px;
          left: 23%;
          bottom: 13%;
          border-color: rgba(155, 116, 0, 0.52);
          background:
            linear-gradient(
              140deg,
              rgba(255, 212, 0, 0.15),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -4s;
          animation-duration: 10s;
        }

        .auth-package-five::before {
          border-color: rgba(155, 116, 0, 0.48);
        }

        .auth-package-five::after {
          background: rgba(155, 116, 0, 0.45);
        }

        /* Sixth package: blue */
        .auth-package-six {
          width: 78px;
          height: 78px;
          right: 7%;
          top: 43%;
          border-color: rgba(24, 72, 135, 0.48);
          background:
            linear-gradient(
              140deg,
              rgba(22, 119, 255, 0.12),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -8s;
          animation-duration: 13s;
        }

        .auth-package-six::before {
          border-color: rgba(24, 72, 135, 0.45);
        }

        .auth-package-six::after {
          background: rgba(24, 72, 135, 0.42);
        }

        /* Seventh package: orange */
        .auth-package-seven {
          width: 48px;
          height: 48px;
          left: 5%;
          bottom: 16%;
          border-color: rgba(180, 83, 27, 0.48);
          background:
            linear-gradient(
              140deg,
              rgba(255, 121, 0, 0.13),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -6s;
          animation-duration: 11s;
        }

        .auth-package-seven::before {
          border-color: rgba(180, 83, 27, 0.45);
        }

        .auth-package-seven::after {
          background: rgba(180, 83, 27, 0.42);
        }

        /* Eighth package: green */
        .auth-package-eight {
          width: 110px;
          height: 110px;
          right: 5%;
          bottom: 5%;
          border-color: rgba(22, 125, 69, 0.42);
          background:
            linear-gradient(
              140deg,
              rgba(22, 163, 74, 0.10),
              rgba(255, 255, 255, 0.035)
            );
          animation-delay: -9s;
          animation-duration: 16s;
        }

        .auth-package-eight::before {
          border-color: rgba(22, 125, 69, 0.40);
        }

        .auth-package-eight::after {
          background: rgba(22, 125, 69, 0.38);
        }

        /* ==========================================
           BACKGROUND RINGS
        ========================================== */

        .auth-ring {
          position: absolute;
          z-index: -3;
          border: 1.5px solid rgba(30, 64, 110, 0.22);
          border-radius: 50%;
          pointer-events: none;
          animation: authRingPulse 8s ease-in-out infinite;
        }

        .auth-ring-one {
          width: 210px;
          height: 210px;
          right: 19%;
          top: 23%;
        }

        .auth-ring-two {
          width: 145px;
          height: 145px;
          right: 20.8%;
          top: 26.5%;
          border-color: rgba(155, 76, 30, 0.24);
          animation-delay: -3s;
        }

        /* ==========================================
           LOGIN CARD ENTRANCE
        ========================================== */

        .auth-card-entrance {
          animation: authCardEnter 650ms cubic-bezier(.2,.8,.2,1) both;
        }

        /* ==========================================
           BACKGROUND ANIMATIONS
        ========================================== */

        @keyframes authFloatOne {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(45px, 35px) scale(1.13);
          }
        }

        @keyframes authFloatTwo {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-50px, 55px) scale(1.1);
          }
        }

        @keyframes authFloatThree {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(35px, -40px);
          }
        }

        @keyframes authPackageFloat {
          0%, 100% {
            transform: translateY(0) rotate(25deg);
          }
          50% {
            transform: translateY(-20px) rotate(34deg);
          }
        }

        @keyframes authRingPulse {
          0%, 100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        @keyframes authCardEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ==========================================
           MOBILE RESPONSIVENESS
        ========================================== */

        @media (max-width: 640px) {
          .auth-package-two,
          .auth-package-four,
          .auth-package-six,
          .auth-package-eight,
          .auth-ring-one {
            display: none;
          }

          .auth-orb {
            opacity: 0.65;
          }

          .auth-pointer-light {
            opacity: 0;
          }
        }

        /* Respect reduced-motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .auth-orb,
          .auth-package,
          .auth-ring,
          .auth-card-entrance {
            animation: none !important;
          }

          .auth-pointer-light {
            transition: none;
          }
        }

      `}</style>

      {/* Background decorations */}

      <div className="auth-pointer-light" />

      <div className="auth-orb auth-orb-orange" />
      <div className="auth-orb auth-orb-blue" />
      <div className="auth-orb auth-orb-green" />

      <div className="auth-package auth-package-one" />
      <div className="auth-package auth-package-two" />
      <div className="auth-package auth-package-three" />
      <div className="auth-package auth-package-four" />
      <div className="auth-package auth-package-five" />
      <div className="auth-package auth-package-six" />
      <div className="auth-package auth-package-seven" />
      <div className="auth-package auth-package-eight" />

      <div className="auth-ring auth-ring-one" />
      <div className="auth-ring auth-ring-two" />

      {/* ==========================================
          LOGIN CONTENT
      ========================================== */}

      <main className="relative z-10 w-full max-w-[460px] auth-card-entrance">

        {/* Brand header */}
        <header className="flex flex-col items-center text-center mb-7">

          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-md">
            <AutoPackLogo />
          </div>

          <p className="mt-4 text-xs text-slate-500 font-medium tracking-wide">
            Customer Portal
            <span className="mx-2 text-slate-300">•</span>
            Autonomous Digital Twin Packaging
          </p>

        </header>

        {/* Main authentication card */}
        <section className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-xl shadow-slate-300/40 overflow-hidden">

          {/* Top colour accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#FF7900] via-[#FFD400] to-[#1677FF]" />

          <div className="p-6 sm:p-8">

            {/* Progress indicator */}
            <div className="flex items-center gap-3 mb-7">

              <div className="flex items-center gap-2">

                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    userChoice === null
                      ? 'bg-[#FF7900] ring-4 ring-orange-100'
                      : 'bg-[#16A34A]'
                  }`}
                />

                <span className="text-[10px] font-bold text-slate-500">
                  Account type
                </span>

              </div>

              <div className="flex-1 h-[3px] rounded-full bg-slate-100 overflow-hidden">

                <div
                  className={`h-full rounded-full bg-[#16A34A] transition-all duration-500 ${
                    userChoice === null ? 'w-0' : 'w-full'
                  }`}
                />

              </div>

              <div className="flex items-center gap-2">

                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    userChoice !== null
                      ? 'bg-[#FF7900] ring-4 ring-orange-100'
                      : 'bg-slate-200'
                  }`}
                />

                <span className="text-[10px] font-bold text-slate-500">
                  Guest ID
                </span>

              </div>

            </div>

            {/* =====================================
                STEP ONE: ACCOUNT CHOICE
            ===================================== */}

            {userChoice === null ? (

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                <div className="text-center mb-7">

                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#1677FF]">
                    Guest Authentication
                  </span>

                  <h1 className="mt-4 text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
                    Welcome to AutoPack
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Are you a first-time user?
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  {/* New customer */}
                  <button
                    type="button"
                    onClick={() => handleSelectChoice('first-time')}
                    className="group relative min-h-[155px] flex flex-col items-center justify-center text-center gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-green-50/70 hover:border-[#16A34A] hover:shadow-md hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100"
                  >

                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#16A34A] flex items-center justify-center transition-all duration-200 group-hover:bg-green-100 group-hover:scale-110">
                      <CheckCircleIcon className="w-6 h-6" />
                    </div>

                    <div>

                      <p className="text-sm font-black text-slate-900">
                        Yes
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Create new Guest ID
                      </p>

                    </div>

                    <span className="absolute top-3 right-3 text-slate-300 group-hover:text-[#16A34A] transition-colors">
                      →
                    </span>

                  </button>

                  {/* Existing customer */}
                  <button
                    type="button"
                    onClick={() => handleSelectChoice('returning')}
                    className="group relative min-h-[155px] flex flex-col items-center justify-center text-center gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-blue-50/70 hover:border-[#1677FF] hover:shadow-md hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >

                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center transition-all duration-200 group-hover:bg-blue-100 group-hover:scale-110">
                      <UserIcon className="w-6 h-6" />
                    </div>

                    <div>

                      <p className="text-sm font-black text-slate-900">
                        No
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Existing Guest ID
                      </p>

                    </div>

                    <span className="absolute top-3 right-3 text-slate-300 group-hover:text-[#1677FF] transition-colors">
                      →
                    </span>

                  </button>

                </div>

                {/* Login information */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-start justify-center gap-2">

                  <ShieldCheckIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />

                  <p className="text-[11px] leading-relaxed text-slate-400 text-center">
                    No password or email required.
                    Authentication is controlled by Guest ID.
                  </p>

                </div>

              </div>

            ) : (

              /* =====================================
                  STEP TWO: GUEST ID FORM
              ===================================== */

              <div className="animate-in fade-in slide-in-from-right-2 duration-300">

                <div className="flex items-start justify-between mb-6">

                  <div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        isFirstTime
                          ? 'text-[#16A34A]'
                          : 'text-[#1677FF]'
                      }`}
                    >
                      {isFirstTime
                        ? 'New customer registration'
                        : 'Returning customer'}
                    </span>

                    <h2 className="mt-2 text-xl font-black text-slate-900">
                      {isFirstTime
                        ? 'Create your Guest ID'
                        : 'Sign in to AutoPack'}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {isFirstTime
                        ? 'Choose an unused Guest ID.'
                        : 'Enter your registered Guest ID.'}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs font-bold text-[#1677FF] hover:underline cursor-pointer"
                  >
                    ← Back
                  </button>

                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Error message */}
                  {errorMsg && (

                    <div
                      role="alert"
                      className="p-3 rounded-xl bg-pink-50 border border-[#FF4F9A]/40 flex items-start gap-2 text-xs font-semibold text-[#D9367C] animate-in fade-in duration-200"
                    >

                      <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />

                      <span>{errorMsg}</span>

                    </div>

                  )}

                  {/* Guest ID field */}
                  <div className="space-y-2">

                    <label
                      htmlFor="guest-id-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Guest ID
                    </label>

                    <div
                      className={`rounded-xl border transition-all duration-200 ${
                        guestIdInput.length === 0
                          ? 'border-slate-300'
                          : isGuestIdValid
                            ? 'border-[#16A34A] ring-2 ring-green-50'
                            : 'border-slate-300'
                      }`}
                    >

                      <input
                        id="guest-id-input"
                        type="text"
                        value={guestIdInput}
                        onChange={(event) => {
                          setGuestIdInput(event.target.value);
                          setErrorMsg('');
                        }}
                        placeholder="e.g. Guest_1"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        autoFocus
                        maxLength={32}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 focus:bg-white outline-none text-sm font-bold text-slate-900 font-mono placeholder:font-normal placeholder:text-slate-400 transition-colors"
                        aria-invalid={Boolean(errorMsg)}
                      />

                    </div>

                    <div className="flex items-center justify-between gap-2 min-h-5">

                      <p className="text-[11px] text-slate-400">
                        Format: Guest_ followed by a number.
                      </p>

                      {trimmedGuestId.length > 0 && (

                        <span
                          className={`text-[10px] font-bold ${
                            isGuestIdValid
                              ? 'text-[#16A34A]'
                              : 'text-slate-400'
                          }`}
                        >
                          {isGuestIdValid
                            ? '✓ Valid format'
                            : 'Guest_123'}
                        </span>

                      )}

                    </div>

                  </div>

                  {/* Submit and cancel */}
                  <div className="flex gap-3 pt-1">

                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={handleBack}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant={isFirstTime ? 'green' : 'orange'}
                      size="md"
                      loading={isSubmitting}
                      disabled={!isGuestIdValid || isSubmitting}
                      fullWidth
                    >
                      {isFirstTime
                        ? 'Create Account'
                        : 'Login'}
                    </Button>

                  </div>

                </form>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">

                  <ShieldCheckIcon className="w-4 h-4 text-slate-400" />

                  <p className="text-[11px] text-slate-400">
                    Your existing account data remains saved.
                  </p>

                </div>

              </div>

            )}

          </div>

        </section>

        {/* Reset demo data */}
        <div className="mt-6 flex flex-col items-center gap-2">

          <p className="text-[11px] font-medium text-slate-400">
            AutoPack Customer Portal
          </p>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>

        </div>

      </main>

      {/* ==========================================
          RESET DEMO DATA MODAL
      ========================================== */}

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Data"
        maxWidth="max-w-sm"
      >

        <div className="space-y-4">

          <div className="p-3 rounded-xl bg-pink-50 border border-[#FF4F9A] text-xs text-slate-800 flex items-start gap-2.5">

            <AlertCircleIcon className="w-5 h-5 text-[#FF4F9A] shrink-0 mt-0.5" />

            <p>
              Are you sure you want to clear all mock accounts,
              transactions and placed orders? This will return
              the application to an empty state.
            </p>

          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="pink"
              size="sm"
              onClick={handleConfirmReset}
            >
              Reset Demo Data
            </Button>

          </div>

        </div>

      </Modal>

    </div>
  );
}
