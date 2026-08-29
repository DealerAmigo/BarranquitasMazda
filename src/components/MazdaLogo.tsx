import React from 'react';

export const MazdaLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 240 75" 
        className="w-[220px] h-[65px] sm:w-[320px] sm:h-[85px] md:w-[380px] md:h-[95px] max-w-full drop-shadow-[0_2px_10px_rgba(0,255,255,0.15)]" 
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Stylized MAZDA background text */}
        <g stroke="#CCCCCC" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20,58 L 20,22 L 45,58 L 70,22 L 70,58" />
          <path d="M 75,58 L 95,22 L 115,58" />
          <path d="M 125,22 L 150,22 L 125,58 L 150,58" />
          <path d="M 160,22 L 160,58 M 160,22 C 190,22 190,58 160,58" />
          <path d="M 195,58 L 215,22 L 235,58" />
        </g>
        
        {/* Bird Wings above AZ */}
        <g strokeWidth="4.5" fill="none" strokeLinecap="round">
          <path d="M 75,16 C 95,20 105,28 110,36" stroke="#555555" />
          <path d="M 110,36 C 115,28 135,14 155,14" stroke="#00FFFF" />
        </g>

        {/* BARRANQUITAS text overlapping */}
        <text 
          x="127" y="47" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="17" 
          fontWeight="900" 
          fill="#00FFFF" 
          stroke="#000000"
          strokeWidth="3.5"
          textAnchor="middle" 
          letterSpacing="1.8"
          paintOrder="stroke fill"
        >
          BARRANQUITAS
        </text>
      </svg>
    </div>
  );
};
