import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  href?: string;
  disabled?: boolean;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  gradient,
  href,
  disabled = false,
  className = '',
}: FeatureCardProps) {
  const cardContent = (
    <div
      className={`
        relative group cursor-pointer transition-all duration-500 ease-out
        transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2
        ${disabled ? 'cursor-not-allowed opacity-75 hover:scale-100 hover:translate-y-0' : ''}
        ${className}
      `}
    >
      <div
        className={`
          w-full h-80 rounded-2xl p-8 flex flex-col items-center justify-center
          text-center relative overflow-hidden
          ${gradient}
          ${disabled ? 'hover:scale-100' : ''}
        `}
      >
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        </div>
        
        {/* Subtle border for white cards */}
        {gradient.includes('bg-white') && (
          <div className="absolute inset-0 rounded-2xl border border-gray-200"></div>
        )}
        
        {/* Icon */}
        <div className="relative z-10 mb-6">
          <div className={`w-16 h-16 rounded-full backdrop-blur-sm flex items-center justify-center ${
            gradient.includes('bg-white') ? 'bg-gray-100' : 'bg-white/20'
          }`}>
            <Icon className={`w-8 h-8 ${
              gradient.includes('bg-white') ? 'text-gray-600' : 'text-white'
            }`} />
          </div>
        </div>
        
        {/* Title */}
        <h3 className={`relative z-10 text-2xl font-bold mb-3 ${
          gradient.includes('bg-white') ? 'text-gray-900' : 'text-white'
        }`}>
          {title}
        </h3>
        
        {/* Description */}
        <p className={`relative z-10 text-sm leading-relaxed max-w-xs ${
          gradient.includes('bg-white') ? 'text-gray-600' : 'text-white/90'
        }`}>
          {description}
        </p>
        
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      </div>
    </div>
  );

  if (disabled || !href) {
    return cardContent;
  }

  return (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  );
}
