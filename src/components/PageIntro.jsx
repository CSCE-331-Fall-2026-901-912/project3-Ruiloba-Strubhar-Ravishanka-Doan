import React from "react";

export default function PageIntro({ eyebrow, title, description, children }) {
  return (
    <div className="page-intro">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>
      {children}
    </div>
  );
}
