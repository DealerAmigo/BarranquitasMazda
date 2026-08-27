import React from 'react';

export const MazdaLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" className="w-[150px] h-[50px] sm:w-[180px] sm:h-[60px]" preserveAspectRatio="xMidYMid meet">
        {/* Stylized MAZDA background text */}
        <g stroke="#9CA3AF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20,60 L 20,25 L 45,60 L 70,25 L 70,60" />
          <path d="M 75,60 L 95,25 L 115,60" />
          <path d="M 125,25 L 150,25 L 125,60 L 150,60" />
          <path d="M 160,25 L 160,60 M 160,25 C 190,25 190,60 160,60" />
          <path d="M 195,60 L 215,25 L 235,60" />
        </g>
        
        {/* Bird Wings above AZ */}
        <g strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M 75,18 C 95,22 105,30 110,38" stroke="#4B5563" />
          <path d="M 110,38 C 115,30 135,16 155,16" stroke="#48DFE6" />
        </g>

        {/* BARRANQUITAS text overlapping */}
        <text 
          x="127" y="47" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="16" 
          fontWeight="900" 
          fill="#48DFE6" 
          stroke="#000000"
          strokeWidth="3"
          textAnchor="middle" 
          letterSpacing="1.5"
          paintOrder="stroke fill"
        >
          BARRANQUITAS
        </text>
      </svg>
    </div>
  );
};
