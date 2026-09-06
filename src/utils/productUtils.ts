export const isAttarPerfumeProduct = (product: any, categoriesList?: any[]): boolean => {
  if (!product) return false;

  // Explicit flag from admin
  if (product.hasFragranceOptions) return true;

  const title = (product.title || '').toLowerCase();
  const categoryName = (product.category || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const material = (product.material || '').toLowerCase();

  const fragranceKeywords = [
    'attar', 'perfume', 'aatar', 'ittar', 'oud', 'oudh', 'musk',
    'scent', 'fragrance', 'parfum', 'edp', 'mist', 'spray', 'rollon',
    'roll-on', 'amber', 'attars', 'perfumes'
  ];

  // 1. Check title, categoryName, description, material
  if (fragranceKeywords.some(kw => 
    title.includes(kw) || 
    categoryName.includes(kw) || 
    material.includes(kw) ||
    description.includes(kw)
  )) {
    return true;
  }

  // 2. Check raw category_id strings (e.g. "attar_123", "perfumes_cat")
  const cats = product.category_ids || (product.category_id ? [product.category_id] : []);
  if (cats.some((catId: string) => fragranceKeywords.some(kw => String(catId).toLowerCase().includes(kw)))) {
    return true;
  }

  // 3. Check against passed categoriesList
  if (categoriesList && categoriesList.length > 0 && cats.length > 0) {
    const isMatched = cats.some((catId: string) => {
      const c = categoriesList.find((cat: any) => cat.id === catId);
      if (!c) return false;
      const cName = (c.name || '').toLowerCase();
      return fragranceKeywords.some(kw => cName.includes(kw));
    });
    if (isMatched) return true;
  }

  return false;
};
