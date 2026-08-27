export function getProxyImageUrl(rawUrl?: string): string {
  if (!rawUrl) {
    return 'https://fakeimg.pl/800x600/111111/00FFFF?text=FOTO+PENDIENTE';
  }
  
  // If it is an inventario360 CDN link, direct to image proxy to ensure no CORS or hotlinking blocks
  if (rawUrl.includes('apicdn.inventario360.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  return rawUrl;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl: string) {
  const target = e.currentTarget;
  // If not already proxied, try backend proxy
  if (originalUrl && !target.src.includes('/api/image-proxy') && !originalUrl.includes('fakeimg.pl')) {
    target.src = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    return;
  }
  // Fallback to real inventory photo from DealerAmigo
  target.src = 'https://fakeimg.pl/800x600/111111/00FFFF?text=FOTO+PENDIENTE';
}


