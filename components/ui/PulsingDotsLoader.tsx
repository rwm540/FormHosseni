import React from 'react';

const PulsingDotsLoader: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="currentColor"
        >
            <circle cx="4" cy="12" r="3">
                <animate
                    id="spinner_qFRN"
                    begin="0;spinner_O507.end-0.25s"
                    attributeName="r"
                    dur="0.75s"
                    values="3;1;3"
                />
            </circle>
            <circle cx="12" cy="12" r="1">
                <animate
                    id="spinner_f7ol"
                    begin="spinner_qFRN.end-0.6s"
                    attributeName="r"
                    dur="0.75s"
                    values="3;1;3"
                />
            </circle>
            <circle cx="20" cy="12" r="1">
                <animate
                    id="spinner_O507"
                    begin="spinner_f7ol.end-0.6s"
                    attributeName="r"
                    dur="0.75s"
                    values="3;1;3"
                />
            </circle>
        </svg>
    );
};

export default PulsingDotsLoader;
