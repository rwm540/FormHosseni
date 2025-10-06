import React, { useState, useRef, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, disabled = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
        if (!disabled) {
            setIsVisible(true);
        }
    };
    const hideTooltip = () => {
        setIsVisible(false);
    };
    
    useEffect(() => {
        if (isVisible && wrapperRef.current && tooltipRef.current) {
            const targetRect = wrapperRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            let top = targetRect.top - tooltipRect.height - 8; // Position above
            let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

            // Adjust if it goes off-screen vertically
            if (top < 0) {
                top = targetRect.bottom + 8; // Position below
            }

            // Adjust if it goes off-screen horizontally
            if (left < 0) left = 8;
            if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - 8;
            }

            setPosition({ top, left });
        }
    }, [isVisible]);

    const tooltipElement = (
        <div
            ref={tooltipRef}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
            }}
            className="fixed z-[101] max-w-xs px-3 py-2 text-sm font-medium text-white text-center bg-gray-900 rounded-lg shadow-sm"
            role="tooltip"
        >
            {content}
        </div>
    );
    
    return (
        <div
            ref={wrapperRef}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {isVisible && ReactDOM.createPortal(tooltipElement, document.body)}
        </div>
    );
};

export default Tooltip;
