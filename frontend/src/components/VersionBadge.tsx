export function VersionBadge() {
  return (
    <div className="fixed bottom-2 right-3 text-xs text-slate-600 pointer-events-none select-none">
      v{__APP_VERSION__}
    </div>
  );
}
