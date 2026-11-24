import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  isOwner: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, isOwner, onClose }) => {
  const navigationKeys = [
    { key: 'H', desc: "Bosh sahifaga o'tish" },
    { key: 'C', desc: "Katalog bo'limini ochish" },
    { key: 'K', desc: "Kategoriyalar bo'limini ochish" },
    { key: 'T', desc: "Turnirlar bo'limini ochish" },
    { key: 'R', desc: "Reyting jadvalini ochish" },
    { key: 'J', desc: "Hamjamiyat maydoniga o'tish" },
    { key: 'P', desc: "Shaxsiy profilga o'tish" },
    ...(isOwner ? [{ key: 'G', desc: 'OWNER Boshqaruv paneli' }] : []),
  ];

  const utilityKeys = [
    { key: '/ · Ctrl+K', desc: 'Global qidiruv oynasini ochish / yopish' },
    { key: 'A', desc: "Yuqori e'lon panelini ko'rsatish / yashirish" },
    { key: '?', desc: 'Klaviatura yorliqlari oynasini ochish / yopish' },
    { key: 'Esc', desc: "Faol modal yoki menyuni yopish" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="shortcuts-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[940] bg-[#03060E]/78 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl rounded-2xl nx-elevated p-6 space-y-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-cyan-300">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="shortcuts-modal-title" className="font-heading font-bold text-base text-white">
                    Klaviatura yorliqlari
                  </h2>
                  <p className="text-xs text-slate-400">
                    Platforma bo'ylab tezkor navigatsiya va qulay boshqaruv
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="shortcuts-modal-close"
                aria-label="Yopish"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-cyan-300">Navigatsiya</div>
                <div className="divide-y divide-white/[0.06]">
                  {navigationKeys.map((item) => (
                    <div key={item.key} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300">{item.desc}</span>
                      <kbd className="nx-kbd">{item.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-cyan-300">Tizim va Qulaylik</div>
                <div className="divide-y divide-white/[0.06]">
                  {utilityKeys.map((item) => (
                    <div key={item.key} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300">{item.desc}</span>
                      <kbd className="nx-kbd shrink-0">{item.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
