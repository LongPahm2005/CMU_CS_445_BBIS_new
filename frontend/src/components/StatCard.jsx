export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}) {
  const variantStyles = {
    default: { bg: "bg-secondary-subtle", text: "text-secondary" },
    primary: { bg: "#e0f2fe", text: "#0ea5e9" }, // Sky 50/500
    success: { bg: "#f0fdf4", text: "#22c55e" }, // Green 50/500
    warning: { bg: "#fffbeb", text: "#f59e0b" }, // Amber 50/500
    info: { bg: "#eff6ff", text: "#3b82f6" },    // Blue 50/500
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className="card shadow-sm h-100 border-0 rounded-4 overflow-hidden">
      <div className="card-body d-flex align-items-center justify-content-between p-4">
        <div>
          <p className="text-secondary small fw-medium mb-1 uppercase tracking-wider">{title}</p>
          <h3 className="card-title fw-bold mb-1 text-dark">{value}</h3>
          {subtitle && <p className="text-secondary x-small mb-0 opacity-75">{subtitle}</p>}
        </div>
        <div 
          className="rounded-3 d-flex align-items-center justify-content-center" 
          style={{ 
            width: "52px", 
            height: "52px", 
            backgroundColor: style.bg,
            color: style.text 
          }}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .x-small { font-size: 11px; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
      `}} />
    </div>
  );
}
