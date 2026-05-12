export function normalizeFinish(finish: string): string {
  const finishes: Record<string, string> = {
    'ch': 'Chrome',
    'chrome': 'Chrome',
    'polished chrome': 'Polished Chrome',
    'bn': 'Brushed Nickel',
    'brushed nickel': 'Brushed Nickel',
    'orb': 'Oil Rubbed Bronze',
    'oil rubbed bronze': 'Oil Rubbed Bronze',
    'matte black': 'Matte Black',
    'mb': 'Matte Black',
    'pb': 'Polished Brass',
    'polished brass': 'Polished Brass',
    'ss': 'Stainless Steel',
    'stainless steel': 'Stainless Steel',
    'matte gold': 'Matte Gold',
    'champagne': 'Champagne Bronze',
    'vb': 'Venetian Bronze',
  };

  const normalized = finish.toLowerCase().trim();
  return finishes[normalized] || finish;
}

export function normalizeBrand(brand: string): string {
  return brand.trim().replace(/\s+/g, ' ');
}

export function normalizeSKU(sku: string): string {
  return sku.trim().toUpperCase().replace(/\s+/g, '');
}

export function extractSKU(text: string): string | null {
  // Common SKU patterns
  const patterns = [
    /SKU[:\s]+([A-Z0-9\-]+)/i,
    /Model[:\s]+([A-Z0-9\-]+)/i,
    /Item[:\s]+([A-Z0-9\-]+)/i,
    /^([A-Z0-9]{6,})$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeSKU(match[1]);
    }
  }

  return null;
}

export function detectProductType(title: string, description: string = ''): string {
  const combined = (title + ' ' + description).toLowerCase();

  if (combined.includes('faucet') || combined.includes('tap')) return 'faucet';
  if (combined.includes('cartridge') || combined.includes('valve seat')) return 'cartridge';
  if (combined.includes('valve')) return 'valve';
  if (combined.includes('handle')) return 'handle';
  if (combined.includes('sprayer')) return 'sprayer';
  if (combined.includes('spout')) return 'spout';
  if (combined.includes('aerator')) return 'aerator';
  if (combined.includes('connector') || combined.includes('hose')) return 'connector';
  if (combined.includes('cabinet') || combined.includes('hardware')) return 'hardware';

  return 'plumbing-product';
}

export function detectCertifications(description: string, specs: Record<string, string> = {}): string[] {
  const combined = (description + ' ' + Object.values(specs).join(' ')).toLowerCase();
  const certs: string[] = [];

  if (combined.includes('watersense')) certs.push('WaterSense');
  if (combined.includes('cuc') || combined.includes('cupc')) certs.push('cUPC');
  if (combined.includes('nsf')) certs.push('NSF');
  if (combined.includes('ada')) certs.push('ADA');
  if (combined.includes('lead-free') || combined.includes('lead free')) certs.push('Lead-Free');
  if (combined.includes('fips 4694') || combined.includes('4694')) certs.push('FIPS 4694');

  return [...new Set(certs)];
}

export function extractPrice(text: string): number {
  const match = text.match(/\$?([\d,]+\.?\d*)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}
