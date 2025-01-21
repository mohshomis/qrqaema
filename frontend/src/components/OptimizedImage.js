import React, { useState } from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  sizes = '100vw',
  loading = 'lazy'
}) => {
  const [error, setError] = useState(!src);

  if (!src) {
    return (
      <div 
        className={`optimized-image-placeholder ${className}`}
        style={{
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
          ...style
        }}
      >
        <span role="img" aria-label="no image">🖼️</span>
      </div>
    );
  }
  
  // Generate WebP URL if the original is a JPEG or PNG
  const getWebPUrl = (url) => {
    try {
      const originalUrl = new URL(url);
      // Add webp parameter to URL
      originalUrl.searchParams.append('format', 'webp');
      return originalUrl.toString();
    } catch {
      return url;
    }
  };

  // Generate different sized URLs for responsive images
  const generateSrcSet = (url) => {
    try {
      const originalUrl = new URL(url);
      const widths = [320, 640, 960, 1280];
      return widths
        .map(width => {
          originalUrl.searchParams.set('width', width);
          return `${originalUrl.toString()} ${width}w`;
        })
        .join(', ');
    } catch {
      return url;
    }
  };

  if (error) {
    return (
      <div 
        className={`optimized-image-error ${className}`}
        style={{
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      >
        <span role="img" aria-label="broken image">🖼️</span>
      </div>
    );
  }

  return (
    <picture>
      {/* WebP format for browsers that support it */}
      <source
        type="image/webp"
        srcSet={generateSrcSet(getWebPUrl(src))}
        sizes={sizes}
      />
      
      {/* Original format as fallback */}
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        onError={() => setError(true)}
      />
    </picture>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  sizes: PropTypes.string,
  loading: PropTypes.oneOf(['lazy', 'eager', 'auto'])
};

OptimizedImage.defaultProps = {
  src: null,
  className: '',
  style: {},
  sizes: '100vw',
  loading: 'lazy'
};

export default OptimizedImage;
