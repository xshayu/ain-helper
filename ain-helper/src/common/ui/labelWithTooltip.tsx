import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const LabelWithTooltip = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateTooltipPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10, // Position above the trigger
        left: rect.left + rect.width / 2 - 104, // Center the tooltip (half of 208px width)
      });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleFocus = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleBlur = () => {
    setShowTooltip(false);
  };

  return (
    <span 
      ref={triggerRef}
      className="relative inline-flex items-center gap-1 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      <span
        tabIndex={0}
        className="text-blue-500 cursor-help focus:outline-none"
      >
        ℹ️
      </span>
      
      {mounted && showTooltip && createPortal(
        <div
          className="fixed z-50 w-52 p-2 text-sm text-white bg-gray-700 rounded shadow-lg
                     transition-opacity pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateY(-100%)',
          }}
        >
          {tooltip}
        </div>,
        document.body
      )}
    </span>
  );
};

export default LabelWithTooltip;