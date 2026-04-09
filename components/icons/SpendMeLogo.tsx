import React from 'react';

interface SpendMeLogoProps {
    className?: string;
    size?: number;
}

const SpendMeLogo: React.FC<SpendMeLogoProps> = ({ className = '', size = 40 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            {/* Main wallet body: blue → teal → green (left to right) */}
            <linearGradient id="bodyGrad" x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="45%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#84CC16" />
            </linearGradient>
            {/* Flap: cyan */}
            <linearGradient id="flapGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            {/* Bottom wave: red-orange → yellow-orange */}
            <linearGradient id="waveGrad" x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="40%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            {/* Clasp orange */}
            <linearGradient id="claspGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
        </defs>

        {/* Main wallet body */}
        <rect x="8" y="24" width="68" height="58" rx="10" fill="url(#bodyGrad)" />

        {/* Wallet flap (top triangle) */}
        <path d="M26 12L72 24H18C12.5 24 8 28.5 8 34V28L26 12Z" fill="url(#flapGrad)" />

        {/* Bottom wave overlay (orange section) */}
        <path d="M8 62C8 62 22 50 42 56C62 62 76 54 76 54V72C76 78 70 82 64 82H18C12.5 82 8 77.5 8 72V62Z" fill="url(#waveGrad)" />

        {/* Clasp */}
        <rect x="72" y="44" width="18" height="20" rx="6" fill="url(#claspGrad)" />
        <circle cx="81" cy="54" r="3.5" fill="#FDE68A" />

        {/* Checkmark */}
        <path
            d="M26 52L38 64L62 36"
            stroke="white"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);

export default SpendMeLogo;
