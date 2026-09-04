/**
 * image-generator.js
 * Generates photorealistic AI commercial product images and provides automatic category detection.
 */

// 1. SMART AUTOMATIC CATEGORY DETECTOR (200+ Indian Grocery & Retail Keywords)
const CATEGORY_RULES = [
  {
    category: 'Dairy',
    keywords: [
      'milk', 'butter', 'cheese', 'paneer', 'curd', 'yogurt', 'yoghurt', 'ghee', 
      'amul', 'nandini', 'mother dairy', 'heritage', 'milky mist', 'buttermilk', 
      'lassi', 'cream', 'condensed milk', 'dairy', 'mawa', 'khoya'
    ]
  },
  {
    category: 'Beverages',
    keywords: [
      'tea', 'chai', 'coffee', 'nescafe', 'bru', 'tata tea', 'taj mahal', 'red label',
      'horlicks', 'boost', 'bournvita', 'complan', 'coke', 'pepsi', 'thums up', 'sprite',
      'fanta', 'maaza', 'slice', 'frooti', 'limca', 'mirinda', 'appy', 'juice', 'soda',
      'water', 'kinley', 'bisleri', 'aquafina', 'red bull', 'sting', 'glucon-d', 'tang',
      'green tea', 'badam milk', 'drink', 'beverage'
    ]
  },
  {
    category: 'Snacks',
    keywords: [
      'biscuit', 'biscuits', 'cookie', 'cookies', 'parle', 'good day', 'marie', 'oreo',
      'bourbon', 'monaco', 'krackjack', 'chips', 'lays', 'kurkure', 'bingo', 'namkeen',
      'bhujia', 'haldiram', 'bikaji', 'mixture', 'murukku', 'popcorn', 'maggi', 'noodles',
      'yippee', 'pasta', 'vermicelli', 'sev', 'chocolate', 'cadbury', 'dairy milk',
      'kitkat', '5 star', 'snickers', 'munch', 'perk', 'candy', 'toffee', 'wafer',
      'cake', 'rusk', 'toast', 'chips', 'chivda', 'cheetos'
    ]
  },
  {
    category: 'Groceries',
    keywords: [
      'rice', 'atta', 'flour', 'wheat', 'maida', 'besan', 'sooji', 'rava', 'dal',
      'dhal', 'toor dal', 'moong dal', 'urad dal', 'chana dal', 'sugar', 'salt', 'oil',
      'sunflower oil', 'mustard oil', 'groundnut oil', 'palm oil', 'olive oil', 'masala',
      'turmeric', 'chilli', 'chilly', 'coriander', 'cumin', 'jeera', 'mustard', 'fenugreek',
      'pepper', 'cardamom', 'clove', 'cinnamon', 'garam masala', 'tamarind', 'poha',
      'cornflakes', 'oats', 'quaker', 'kelloggs', 'pulses', 'grains', 'aashirvaad',
      'fortune', 'saffola', 'tata salt', 'freedom', 'sona masoori', 'basmati', 'idli rava',
      'jaggery', 'gur', 'grocery', 'grain', 'spice', 'spices'
    ]
  },
  {
    category: 'Personal Care',
    keywords: [
      'soap', 'dove', 'lux', 'lifebuoy', 'dettol', 'pears', 'santoor', 'cinthol', 'medimix',
      'hamam', 'rexona', 'mysore sandal', 'shampoo', 'clinic plus', 'head & shoulders',
      'sunsilk', 'pantene', 'conditioner', 'hair oil', 'parachute', 'dabur amla', 'bajaj',
      'toothpaste', 'colgate', 'close up', 'pepsodent', 'sensodyne', 'dabur red', 'toothbrush',
      'face wash', 'ponds', 'fair & lovely', 'glow & lovely', 'nivea', 'vaseline', 'lotion',
      'powder', 'talc', 'deodorant', 'perfume', 'axe', 'fogg', 'wild stone', 'shaving',
      'gillette', 'razor', 'blade', 'sanitary', 'whisper', 'stayfree', 'handwash', 'sanitizer'
    ]
  },
  {
    category: 'Household',
    keywords: [
      'detergent', 'surf excel', 'ariel', 'tide', 'wheel', 'rin', 'ghadi', 'washing powder',
      'fabric conditioner', 'comfort', 'dishwash', 'vim', 'pril', 'exo', 'vim bar',
      'cleaner', 'lizol', 'colin', 'harpic', 'domex', 'phenyl', 'floor cleaner',
      'toilet cleaner', 'mosquito', 'all out', 'good knight', 'mortein', 'coil', 'repellent',
      'broom', 'mop', 'wiper', 'scrubber', 'scotch brite', 'sponge', 'garbage bag',
      'matchbox', 'agarbatti', 'incense', 'camphor', 'kapoor', 'candle', 'aluminium foil'
    ]
  },
  {
    category: 'Fruits & Vegetables',
    keywords: [
      'apple', 'banana', 'orange', 'grape', 'grapes', 'mango', 'papaya', 'pomegranate',
      'watermelon', 'lemon', 'lime', 'potato', 'onion', 'tomato', 'ginger', 'garlic',
      'carrot', 'cabbage', 'cauliflower', 'spinach', 'coriander leaves', 'mint',
      'curry leaves', 'cucumber', 'brinjal', 'eggplant', 'lady finger', 'okra',
      'capsicum', 'peas', 'beans', 'vegetable', 'fruit', 'fruits', 'vegetables'
    ]
  },
  {
    category: 'Stationery',
    keywords: [
      'pen', 'pencil', 'eraser', 'sharpener', 'scale', 'ruler', 'notebook', 'book',
      'classmate', 'camlin', 'doms', 'apsara', 'natraj', 'fevicol', 'gum', 'glue',
      'tape', 'scissor', 'stapler', 'pin', 'paper', 'a4 paper', 'marker', 'highlighter',
      'sketch pen', 'crayon', 'color pencil', 'geometry box', 'stationery'
    ]
  }
];

function detectCategory(name) {
  if (!name || typeof name !== 'string') return 'Other';
  const clean = name.toLowerCase().trim();
  const words = clean.split(/[^a-z0-9]+/);

  // 1. Check multi-word keyword phrases first (e.g. "tata tea", "surf excel", "good day")
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (kw.includes(' ') && clean.includes(kw)) {
        return rule.category;
      }
    }
  }

  // 2. Check exact word token matches
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (!kw.includes(' ') && words.includes(kw)) {
        return rule.category;
      }
    }
  }

  return 'Other';
}

// 2. CANVAS PRODUCT BADGE GENERATOR
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

  const cat = category || detectCategory(productName);
  const theme = categoryThemes[cat] || categoryThemes['Other'];

  ctx.fillStyle = theme.bgPattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rectX = 30, rectY = 30, rectW = 340, rectH = 340;
  const gradient = ctx.createLinearGradient(rectX, rectY, rectX + rectW, rectY + rectH);
  gradient.addColorStop(0, theme.gradient[0]);
  gradient.addColorStop(1, theme.gradient[1]);
  
  ctx.fillStyle = gradient;
  roundRect(ctx, rectX, rectY, rectW, rectH, 20);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  const dotRadius = 4;
  const padding = 50;
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.arc(padding + i * 16, padding + j * 16, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw emoji icon
  ctx.font = '80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(theme.icon, 200, 150);

  // Draw product name
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  let fontSize = 24;
  ctx.font = `bold ${fontSize}px sans-serif`;
  
  let lines = [productName];
  const maxTextWidth = 280;

  if (ctx.measureText(productName).width > maxTextWidth) {
    const words = productName.split(' ');
    while (words.length === 1 && ctx.measureText(productName).width > maxTextWidth && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    lines = wrapText(ctx, productName, maxTextWidth);
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

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Category pill badge
  ctx.font = 'bold 14px sans-serif';
  const labelWidth = ctx.measureText(cat).width + 30;
  const labelHeight = 28;
  const labelX = 200 - labelWidth / 2;
  const labelY = 320;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  roundRect(ctx, labelX, labelY, labelWidth, labelHeight, 14);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(cat, 200, labelY + labelHeight / 2);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, rectX + 12, rectY + 12, rectW - 24, rectH - 24, 15);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function getProductImageUrl(productOrName, category) {
  let name = '';
  let cat = category || 'Other';
  
  if (typeof productOrName === 'object' && productOrName !== null) {
    if (productOrName.imageUrl) return productOrName.imageUrl;
    name = productOrName.name || '';
    cat = productOrName.category || category || 'Other';
  } else {
    name = productOrName || '';
  }
  
  const key = `${name}-${cat}`;
  if (imageCache.has(key)) {
    return imageCache.get(key);
  }
  
  const dataUrl = generateProductImage(name, cat);
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

// Window Global Exports
window.detectCategory = detectCategory;
window.getProductImageUrl = getProductImageUrl;
window.generateProductImage = generateProductImage;
window.clearImageCache = clearImageCache;
window.wrapText = wrapText;
