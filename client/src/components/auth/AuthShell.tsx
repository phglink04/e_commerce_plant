import React from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>
            PlantWorld
          </h1>
          <p style={{ maxWidth: "520px", lineHeight: 1.5 }}>
            Giữ thương hiệu PlantWorld và nâng cấp trải nghiệm xác thực.
          </p>
        </div>
      </section>
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
        }}
      >
        <div className="auth-card">
          <h2 style={{ marginTop: 0 }}>{title}</h2>
          <p style={{ color: "#4b6d52", marginTop: 0 }}>{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
