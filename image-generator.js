/**
 * image-generator.js
 * Generates product images using HTML Canvas API.
 */

const imageCache = new Map();

const categoryThemes = {
  'Groceries': { gradient: ['#FF9A56', '#FF6B35'], icon: '🌾', bgPattern: '#FFE0C0' },
  'Snacks': { gradient: ['#FF6B6B', '#EE4444'], icon: '🍪', bgPattern: '#FFD0D0' },
  'Beverages': { gradient: ['#4ECDC4', '#44B09E'], icon: '🥤', bgPattern: '#C0F0EC' },
  'Personal Care': { gradient: ['#A78BFA', '#7C3AED'], icon: '🧴', bgPattern: '#E0D5FF' },
  'Household': { gradient: ['#60A5FA', '#3B82F6'], icon: '🏠', bgPattern: '#D0E5FF' },
  'Stationery': { gradient: ['#FBBF24', '#F59E0B'], icon: '✏️', bgPattern: '#FFF0C0' },
  'Dairy': { gradient: ['#34D399', '#10B981'], icon: '🥛', bgPattern: '#C0FFE8' },
  'Fruits & Vegetables': { gradient: ['#6EE7B7', '#34D399'], icon: '🥬', bgPattern: '#C0FFD5' },
  'Other': { gradient: ['#9CA3AF', '#6B7280'], icon: '📦', bgPattern: '#E0E0E0' }
};

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function generateProductImage(productName, category) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  const theme = categoryThemes[category] || categoryThemes['Other'];

  // a. Fill background with a soft pattern color
  ctx.fillStyle = theme.bgPattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // b. Draw a large rounded rectangle (340x340, centered) with gradient fill
  const rectX = 30, rectY = 30, rectW = 340, rectH = 340;
  const gradient = ctx.createLinearGradient(rectX, rectY, rectX + rectW, rectY + rectH);
  gradient.addColorStop(0, theme.gradient[0]);
  gradient.addColorStop(1, theme.gradient[1]);
  
  ctx.fillStyle = gradient;
  roundRect(ctx, rectX, rectY, rectW, rectH, 20);
  ctx.fill();

  // c. Add subtle decorative circles/dots pattern in corners
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  const dotRadius = 4;
  const padding = 50;
  
  // Top left pattern
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.arc(padding + i * 16, padding + j * 16, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Bottom right pattern
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.arc(400 - padding - i * 16, 400 - padding - j * 16, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // d. Draw the emoji icon large in the center-upper area
  ctx.font = '80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(theme.icon, 200, 150);

  // e. Draw the product name below the icon
  let fontSize = 28;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  const maxTextWidth = 300;
  let lines = wrapText(ctx, productName, maxTextWidth);

  // Auto-size font if text is too wide for a single word
  if (lines.length > 2 || (lines.length === 1 && ctx.measureText(productName).width > maxTextWidth)) {
    let words = productName.split(' ');
    // Handle very long single words
    while (words.length === 1 && ctx.measureText(productName).width > maxTextWidth && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    
    lines = wrapText(ctx, productName, maxTextWidth);
    
    // Split into 2 lines near middle if it's still long
    if (lines.length > 2) {
      const half = Math.ceil(words.length / 2);
      lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')];
    }
  }

  const textY = 240;
  const lineHeight = fontSize + 8;
  
  if (lines.length === 1) {
    ctx.fillText(lines[0], 200, textY + lineHeight / 2);
  } else {
    ctx.fillText(lines[0], 200, textY);
    ctx.fillText(lines[1], 200, textY + lineHeight);
  }

  // Reset shadow for next elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // f. Draw a small category label at the bottom
  ctx.font = 'bold 14px sans-serif';
  const labelWidth = ctx.measureText(category).width + 30;
  const labelHeight = 28;
  const labelX = 200 - labelWidth / 2;
  const labelY = 320;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  roundRect(ctx, labelX, labelY, labelWidth, labelHeight, 14);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(category, 200, labelY + labelHeight / 2);

  // g. Add a subtle inner border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, rectX + 12, rectY + 12, rectW - 24, rectH - 24, 15);
  ctx.stroke();

  // 4. Return canvas.toDataURL('image/png')
  return canvas.toDataURL('image/png');
}

function getProductImageUrl(productName, category) {
  const key = `${productName}-${category}`;
  if (imageCache.has(key)) {
    return imageCache.get(key);
  }
  
  const dataUrl = generateProductImage(productName, category);
  imageCache.set(key, dataUrl);
  return dataUrl;
}

function clearImageCache(key) {
  if (key) {
    imageCache.delete(key);
  } else {
    imageCache.clear();
  }
}

// Export to window
window.generateProductImage = generateProductImage;
window.getProductImageUrl = getProductImageUrl;
window.clearImageCache = clearImageCache;
window.wrapText = wrapText;
