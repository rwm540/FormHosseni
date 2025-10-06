import React from 'react';
import PulsingDotsLoader from './PulsingDotsLoader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    leftIcon?: React.ReactNode;
    isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', leftIcon, className = '', isLoading = false, ...props }) => {
    
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';

    const variantClasses = {
        primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
        secondary: 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-200',
        danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <PulsingDotsLoader className="h-5 w-5" />
            ) : (
                <>
                    {leftIcon && <span className="me-2 -ms-1 h-5 w-5">{leftIcon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;