export default function LoadingState({ label = "Memproses..." }) {
  return (
    <div className="glass rounded-lg p-6 text-center text-muted">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-line border-t-primary" />
      <p className="font-semibold">{label}</p>
    </div>
  );
}
