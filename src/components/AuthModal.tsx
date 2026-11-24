import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { AuthTab } from '../types/nexplay';
import { evaluatePasswordStrength } from '../utils/nexplayLogic';
import { FloatingLabelInput } from './FloatingLabelInput';

interface AuthModalProps {
  open: boolean;
  initialTab: AuthTab;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<string | null>;
  onRegister: (username: string, password: string, confirm: string) => Promise<string | null>;
}

const formVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 18 : -18,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -18 : 18,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1] as const,
    },
  }),
};

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  initialTab,
  onClose,
  onLogin,
  onRegister,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [direction, setDirection] = useState<number>(1);
  const [measuredHeight, setMeasuredHeight] = useState<number | 'auto'>('auto');

  // Preserve form values across rapid tab switches
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const formContentRef = useRef<HTMLDivElement | null>(null);
  const loginUsernameRef = useRef<HTMLInputElement | null>(null);
  const regUsernameRef = useRef<HTMLInputElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setActiveTab(initialTab);
      setLoginError('');
      setRegError('');
      setLoginLoading(false);
      setRegLoading(false);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = window.setTimeout(() => {
        if (initialTab === 'register') {
          regUsernameRef.current?.focus();
        } else {
          loginUsernameRef.current?.focus();
        }
      }, 140);

      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = prevOverflow;
      };
    } else {
      setLoginLoading(false);
      setRegLoading(false);
      if (returnFocusRef.current && document.contains(returnFocusRef.current)) {
        try {
          returnFocusRef.current.focus();
        } catch {
          // Ignore focus restoration failures
        }
        returnFocusRef.current = null;
      }
    }
  }, [open, initialTab]);

  // Escape & Focus trap
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = Array.from(
          cardRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Smooth dynamic height measurement via ResizeObserver
  useEffect(() => {
    if (!open || !formContentRef.current) return;
    const el = formContentRef.current;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setMeasuredHeight(Math.ceil(h));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, activeTab, loginError, regError]);

  // Subtle ambient particles in modal backdrop
  useEffect(() => {
    if (!open) return;
    const canvas = particlesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(320, window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = w < 640 ? 20 : 38;
    const orbs = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: i % 3 === 0 ? 1.8 + Math.random() * 1.2 : 0.9 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.07 - Math.random() * 0.16,
      alpha: 0.16 + Math.random() * 0.28,
      hue: i % 2 === 0 ? '96, 165, 250' : '34, 211, 238',
    }));

    let rafId = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < orbs.length; i++) {
        const p = orbs[i];
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${p.alpha.toFixed(2)})`;
        ctx.fill();
      }
      if (!reduced) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    tick();
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [open]);

  const handleSwitchTab = (next: AuthTab) => {
    if (next === activeTab) return;
    setDirection(next === 'register' ? 1 : -1);
    setActiveTab(next);
    window.setTimeout(() => {
      if (next === 'register') {
        regUsernameRef.current?.focus();
      } else {
        loginUsernameRef.current?.focus();
      }
    }, 220);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Foydalanuvchi nomi va parolni kiriting.");
      return;
    }
    setLoginLoading(true);
    const err = await onLogin(loginUsername.trim(), loginPassword);
    setLoginLoading(false);
    if (err) {
      setLoginError(err);
    } else {
      setLoginUsername('');
      setLoginPassword('');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    const err = await onRegister(regUsername.trim(), regPassword, regConfirm);
    setRegLoading(false);
    if (err) {
      setRegError(err);
    } else {
      setRegUsername('');
      setRegPassword('');
      setRegConfirm('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-heading"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(14px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[920] flex items-center justify-center p-4 bg-[#03060E]/82"
        >
          <canvas
            ref={particlesCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          />

          <motion.div
            ref={cardRef}
            id="auth-modal-card"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.965 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-3xl rounded-2xl nx-elevated px-6 pb-6 pt-12 sm:px-8 sm:pb-8 sm:pt-12 max-h-[92vh] overflow-y-auto overflow-x-hidden"
            style={{
              background:
                'radial-gradient(circle at 12% 10%, rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.18), transparent 55%), radial-gradient(circle at 88% 90%, rgba(var(--rgb-acc-r), var(--rgb-acc-g), var(--rgb-acc-b), 0.14), transparent 55%), rgba(11, 16, 27, 0.96)',
              boxShadow:
                '0 28px 70px -24px rgba(0, 0, 0, 0.94), 0 0 0 1px rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.24)',
            }}
          >
            <button
              type="button"
              id="auth-close-btn"
              onClick={onClose}
              aria-label="Oynani yopish"
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-7 md:gap-8 items-center">
              {/* Left Column: Brand Identity & Atmospheric Panel */}
              <div className="md:col-span-5 space-y-4 border-b md:border-b-0 md:border-r border-white/[0.08] pb-5 md:pb-0 md:pr-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="nx-logo-sweep-wrap w-11 h-11 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm text-white shrink-0"
                    style={{
                      background:
                        'linear-gradient(var(--rgb-grad-deg, 135deg), var(--rgb-primary), var(--rgb-secondary))',
                      boxShadow:
                        '0 10px 24px -8px rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.55)',
                    }}
                  >
                    NX
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold tracking-wider text-cyan-300/90">
                      NEXPLAY
                    </span>
                    <span className="block text-xs text-slate-400">O'yin ekotizimi</span>
                  </div>
                </motion.div>

                <motion.h2
                  id="auth-modal-heading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="font-heading font-bold text-xl sm:text-2xl text-white leading-snug"
                >
                  NEXPLAY Hisob Markazi
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs sm:text-sm text-slate-400 leading-relaxed"
                >
                  Shaxsiy profilingiz, sevimli o'yinlaringiz va sessiyalar tarixingizni yagona
                  markazdan boshqaring.
                </motion.p>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-1">
                  {[
                    {
                      text: 'Login va parol orqali xavfsiz kirish',
                      color: 'var(--rgb-primary)',
                      delay: 0.22,
                    },
                    {
                      text: "Sevimli o'yinlar va sessiyalar tarixi",
                      color: 'var(--rgb-secondary)',
                      delay: 0.27,
                    },
                    {
                      text: 'Hamjamiyat va reyting tizimi',
                      color: 'var(--rgb-accent)',
                      delay: 0.32,
                    },
                  ].map((item) => (
                    <motion.li
                      key={item.text}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center gap-2.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: `0 0 8px ${item.color}`,
                        }}
                      />
                      <span>{item.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Animated Tabs + Smooth Dynamic Height Form Viewport */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="md:col-span-7 space-y-4"
              >
                {/* Animated Sliding Tab Bar */}
                <div
                  className="relative grid grid-cols-2 p-1 rounded-xl bg-[#050811] border border-white/[0.08]"
                  role="tablist"
                  aria-label="Kirish yoki ro'yxatdan o'tish"
                >
                  {(['login', 'register'] as const).map((tab) => {
                    const selected = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        id={tab === 'login' ? 'tab-btn-login' : 'tab-btn-register'}
                        onClick={() => handleSwitchTab(tab)}
                        className={`relative z-10 py-2.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                          selected
                            ? 'font-semibold text-white'
                            : 'font-medium text-slate-400 hover:text-white'
                        }`}
                      >
                        {selected && (
                          <motion.div
                            layoutId="auth-tab-glider"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                              background:
                                'linear-gradient(var(--rgb-grad-deg, 135deg), rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.28), rgba(var(--rgb-sec-r), var(--rgb-sec-g), var(--rgb-sec-b), 0.2))',
                              border: '1px solid rgba(var(--rgb-r), var(--rgb-g), var(--rgb-b), 0.36)',
                            }}
                          />
                        )}
                        <span className="relative z-10">
                          {tab === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Height-Animated Forms Viewport */}
                <motion.div
                  animate={{ height: measuredHeight }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div ref={formContentRef}>
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                      {activeTab === 'login' ? (
                        <motion.form
                          key="login-form"
                          custom={direction}
                          variants={formVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          onSubmit={handleLoginSubmit}
                          noValidate
                          className="space-y-3.5 pt-0.5"
                        >
                          <FloatingLabelInput
                            id="login-username"
                            label="Foydalanuvchi nomi (login)"
                            hint="Masalan: player01 yoki alpha"
                            value={loginUsername}
                            onChange={(v) => {
                              setLoginUsername(v);
                              if (loginError) setLoginError('');
                            }}
                            autoComplete="username"
                            required
                            invalid={Boolean(loginError)}
                            describedBy={loginError ? 'login-error-msg' : undefined}
                            inputRef={loginUsernameRef}
                          />

                          <FloatingLabelInput
                            id="login-password"
                            label="Parol"
                            hint="Shaxsiy parolingizni kiriting"
                            type="password"
                            value={loginPassword}
                            onChange={(v) => {
                              setLoginPassword(v);
                              if (loginError) setLoginError('');
                            }}
                            autoComplete="current-password"
                            required
                            invalid={Boolean(loginError)}
                            describedBy={loginError ? 'login-error-msg' : undefined}
                            enablePasswordToggle
                          />

                          <div
                            id="login-error-msg"
                            role="alert"
                            aria-live="polite"
                            className="min-h-[1.25rem] text-xs text-rose-400"
                          >
                            {loginError}
                          </div>

                          <button
                            type="submit"
                            id="auth-login-submit"
                            disabled={loginLoading}
                            className="nx-btn-primary w-full py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {loginLoading && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                                aria-hidden="true"
                              />
                            )}
                            <span>{loginLoading ? 'Tekshirilmoqda...' : 'Hisobga kirish'}</span>
                          </button>
                        </motion.form>
                      ) : (
                        <motion.form
                          key="register-form"
                          custom={direction}
                          variants={formVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          onSubmit={handleRegisterSubmit}
                          noValidate
                          className="space-y-3.5 pt-0.5"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <FloatingLabelInput
                              id="reg-username"
                              label="Foydalanuvchi nomi (kamida 3 belgi)"
                              hint="Lotin harflari, raqam va . _ - ruxsat etiladi"
                              value={regUsername}
                              onChange={(v) => {
                                setRegUsername(v);
                                if (regError) setRegError('');
                              }}
                              autoComplete="username"
                              required
                              invalid={Boolean(regError)}
                              describedBy={regError ? 'register-error-msg' : undefined}
                              inputRef={regUsernameRef}
                            />
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <FloatingLabelInput
                              id="reg-password"
                              label="Parol (kamida 6 belgi)"
                              hint="Kamida 6 belgidan iborat ishonchli parol"
                              type="password"
                              value={regPassword}
                              onChange={(v) => {
                                setRegPassword(v);
                                if (regError) setRegError('');
                              }}
                              autoComplete="new-password"
                              required
                              invalid={Boolean(regError)}
                              describedBy={regError ? 'register-error-msg' : undefined}
                              enablePasswordToggle
                            />
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <FloatingLabelInput
                              id="reg-password-confirm"
                              label="Parolni tasdiqlang"
                              hint="Yuqoridagi parolni aynan takrorlang"
                              type="password"
                              value={regConfirm}
                              onChange={(v) => {
                                setRegConfirm(v);
                                if (regError) setRegError('');
                              }}
                              autoComplete="new-password"
                              required
                              invalid={Boolean(regError)}
                              describedBy={regError ? 'register-error-msg' : undefined}
                            />
                          </motion.div>

                          {/* Animated Password Strength & Validation Checklist */}
                          {(() => {
                            const strength = evaluatePasswordStrength(regPassword);
                            const barWidth =
                              strength.score === 0
                                ? '0%'
                                : strength.score === 1
                                  ? '33%'
                                  : strength.score === 2
                                    ? '68%'
                                    : '100%';
                            const barColor =
                              strength.score <= 1
                                ? '#fb7185'
                                : strength.score === 2
                                  ? '#fbbf24'
                                  : '#22d3ee';
                            const checks = [
                              {
                                label: 'Login 3+ belgi',
                                ok: /^[a-zA-Z0-9._-]{3,24}$/.test(regUsername.trim()),
                              },
                              {
                                label: 'Parol 6+ belgi',
                                ok: regPassword.length >= 6,
                              },
                              {
                                label: 'Parollar mos',
                                ok: regPassword.length >= 6 && regPassword === regConfirm,
                              },
                            ];

                            return (
                              <motion.div
                                id="reg-strength-meter"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.24, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 space-y-2.5"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Parol mustahkamligi</span>
                                  <span
                                    className="font-semibold tabular-nums"
                                    style={{ color: strength.score === 0 ? '#94a3b8' : barColor }}
                                  >
                                    {strength.label}
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    initial={false}
                                    animate={{ width: barWidth, backgroundColor: barColor }}
                                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                  />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
                                  {checks.map((item) => (
                                    <div
                                      key={item.label}
                                      className={`inline-flex items-center gap-1.5 text-[11px] transition-colors ${
                                        item.ok ? 'text-cyan-300 font-medium' : 'text-slate-500'
                                      }`}
                                    >
                                      <motion.span
                                        initial={false}
                                        animate={{
                                          scale: item.ok ? [0.8, 1.15, 1] : 1,
                                          backgroundColor: item.ok
                                            ? 'rgba(34, 211, 238, 0.2)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        }}
                                        transition={{ duration: 0.22 }}
                                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                      </motion.span>
                                      <span>{item.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })()}

                          <div
                            id="register-error-msg"
                            role="alert"
                            aria-live="polite"
                            className="min-h-[1.25rem] text-xs text-rose-400"
                          >
                            {regError}
                          </div>

                          <motion.button
                            type="submit"
                            id="auth-register-submit"
                            disabled={regLoading}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.985 }}
                            className="nx-btn-primary nx-btn-gaming w-full py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {regLoading && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                                aria-hidden="true"
                              />
                            )}
                            <span>{regLoading ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish"}</span>
                          </motion.button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
