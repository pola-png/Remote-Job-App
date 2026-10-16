'use client';

import React, { useEffect, useRef } from 'react';

interface AdSenseSlotProps {
  slot?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

export default function AdSenseSlot({
  slot,
  style,
  format = 'auto',
  responsive = true,
  className = '',
}: AdSenseSlotProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch (err) {
      // Ignore if AdSense blocked by client ad blocker
    }
  }, []);

  return (
    <div
      className={`adsense-wrapper ${className}`}
      style={{
        overflow: 'hidden',
        textAlign: 'center',
        margin: '1.5rem 0',
        minHeight: '0px',
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client="ca-pub-3004467059794580"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
