'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'

interface ToolCardProps {
  title: string | React.ReactNode
  subtitle?: string
  icon?: string
  banner?: string
  href?: string
  disabled?: boolean
  comingSoon?: boolean
  featured?: boolean
  starred?: boolean
  wide?: boolean
  className?: string
}

export function ToolCard({
  title,
  subtitle,
  icon,
  banner,
  href,
  disabled = false,
  comingSoon = false,
  featured = false,
  starred = false,
  wide = false,
  className = '',
}: ToolCardProps) {
  const isDisabled = disabled || (comingSoon && !href) || (!href && !wide)

  const cardContent = (
    <div
      className={`
        relative bg-white rounded-[18px] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]
        transition-card
        will-change-transform group
        overflow-hidden
        ${featured ? '' : wide ? 'h-[180px]' : 'p-5'}
        ${isDisabled 
          ? 'opacity-40 cursor-not-allowed pointer-events-none' 
          : 'cursor-pointer hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.08)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0E85F2] focus-within:ring-offset-2'
        }
        ${className}
      `}
      role={isDisabled ? undefined : 'button'}
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      aria-label={isDisabled ? undefined : `Apri ${title}`}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          if (href) {
            window.location.href = href
          }
        }
      }}
    >
      {/* Star Badge */}
      {starred && !comingSoon && (
        <div className="absolute top-3 right-3 z-10">
          <Star className="w-5 h-5 fill-[#0E85F2] text-[#0E85F2]" />
        </div>
      )}


      {/* Featured Card with Banner Image */}
      {featured && banner && (
        <div className="flex flex-col h-full gap-4 p-5 md:p-6">
          <div className="relative w-full h-40 md:h-[160px] overflow-hidden rounded-t-[18px] bg-gray-50">
            <Image
              src={banner}
              alt={`Banner ${title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="flex flex-col gap-1 px-1">
            <h3 className="text-base md:text-lg font-bold text-[#1A1A1A]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs md:text-sm text-[#5A5A5A] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Wide Card with Banner Image */}
      {wide && banner && (
        <div className="flex flex-row items-center gap-6 h-full p-6">
          <div className="flex-shrink-0 flex items-center justify-center">
            <Image
              src={banner}
              alt={`Banner ${title}`}
              width={150}
              height={150}
              className="w-auto h-auto object-contain max-h-[120px]"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <h3 className="text-lg font-bold text-[#1A1A1A]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-[#5A5A5A] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Regular Card with Icon */}
      {!featured && !wide && (
        <>
          {icon && (
            <div className="relative mb-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image
                  src={icon}
                  alt={`Icona ${title}`}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
            {title}
          </h3>

          {subtitle && (
            <p className="text-sm text-[#5A5A5A] leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  )

  const badgeContent = comingSoon && (
    <div className="absolute top-3 right-3 z-20 pointer-events-none">
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[#0E85F2]/40 bg-white text-[#0E85F2] font-medium backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0E85F2] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0E85F2]"></span>
        </span>
        IN ARRIVO
      </span>
    </div>
  )

  if (isDisabled || !href) {
    return (
      <div className="relative group">
        {cardContent}
        {badgeContent}
      </div>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    console.log('[ToolCard] ========== AI TOOL CARD CLICKED ==========');
    console.log('[ToolCard] Tool Name:', title);
    console.log('[ToolCard] Tool Href:', href);
    console.log('[ToolCard] Timestamp:', new Date().toISOString());
    console.log('[ToolCard] User is navigating to AI page...');
    
    // Monitor if navigation is blocked or redirected
    const startTime = Date.now();
    const checkRedirect = () => {
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const elapsed = Date.now() - startTime;
        
        if (currentPath === '/pricing') {
          console.error('[ToolCard] ❌❌❌ REDIRECTED TO PRICING ❌❌❌');
          console.error('[ToolCard] User was redirected to pricing page');
          console.error('[ToolCard] This means middleware blocked access');
          console.error('[ToolCard] Check SERVER logs for [Middleware] and [hasActiveAccessEdge] logs');
        } else if (currentPath === href) {
          console.log('[ToolCard] ✅ Successfully navigated to:', currentPath);
        } else {
          console.warn('[ToolCard] ⚠️ Navigation may have been intercepted');
          console.warn('[ToolCard] Expected:', href);
          console.warn('[ToolCard] Current:', currentPath);
        }
      }, 500);
    };
    
    checkRedirect();
    console.log('[ToolCard] ===========================================');
  }

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className="block relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E85F2] focus-visible:ring-offset-2 rounded-[18px]"
    >
      {cardContent}
      {badgeContent}
    </Link>
  )
}
