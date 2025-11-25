import React from 'react';

export default function Spinner({ size = 28, className = '' }) {
  return (
    <span className={className + ' inline-block'} aria-label="Загрузка...">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        fill="none"
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-20"
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="5"
        />
        <path
          d="M45 25c0-11.05-8.95-20-20-20"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          className="opacity-70"
        />
      </svg>
    </span>
  );
}
