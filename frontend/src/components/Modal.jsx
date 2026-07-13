// A small centered modal used for error messages (wrong password, name taken).
export default function Modal({ open, title, message, onClose, tone = 'error' }) {
  if (!open) return null;

  const toneStyles =
    tone === 'error'
      ? 'text-red-400'
      : tone === 'success'
        ? 'text-emerald-400'
        : 'text-sky-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-sm rounded-2xl bg-[#17212b] p-6 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-lg font-bold ${toneStyles}`}>{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-sky-500 py-2.5 font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
