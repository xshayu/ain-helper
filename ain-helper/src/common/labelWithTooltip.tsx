import React from 'react';

const LabelWithTooltip = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children}
      <span
        tabIndex={0}
        className="text-blue-500 cursor-help focus:outline-none"
      >
        ℹ️
      </span>
      <div
        className="absolute z-10 bottom-full mb-1 w-52 p-2 text-sm text-white bg-gray-700 rounded shadow-lg
                   opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100
                   transition-opacity pointer-events-none"
      >
        {tooltip}
      </div>
    </span>
  );
};

export default LabelWithTooltip;;