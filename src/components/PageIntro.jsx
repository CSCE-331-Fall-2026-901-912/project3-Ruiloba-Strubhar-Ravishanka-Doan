import React from "react";

// Added 'isHighContrast' prop to explicitly manage low-vision color scales
export default function PageIntro({ eyebrow, title, description, children, isHighContrast }) {
  return (
    <div className="page-intro">
      <div>
        <p
          className="eyebrow"
          style={isHighContrast ? { color: '#ffb3df', fontWeight: '900', fontSize: '1.2rem' } : {}}
        >
          {eyebrow}
        </p>
        <h1
          style={isHighContrast ? { color: '#ffffff', fontWeight: '950' } : {}}
        >
          {title}
        </h1>
        <p
          className="muted"
          style={isHighContrast ? { color: '#ffffff', fontWeight: '700', fontSize: '1.1rem' } : {}}
        >
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
