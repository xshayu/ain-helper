import { useState } from 'react';

// Section component props type
interface SectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

// Section component with collapsible behavior (using emojis)
const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
    const sectionId = `section-content-${title.replace(/\s+/g, '-')}`;

    return (
        <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button // Changed to button for accessibility
                type="button"
                className="flex justify-between items-center w-full p-4 bg-teal-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-300"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen} // Accessibility
                aria-controls={sectionId} // Accessibility
            >
                <h2 className="text-xl font-semibold text-teal-800">{title}</h2>
                <span className="text-teal-600 text-xl">
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {isOpen && (
                <div
                    id={sectionId} // Accessibility
                    className="p-4"
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default Section;