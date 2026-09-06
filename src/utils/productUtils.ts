export const isAttarPerfumeProduct = (product: any, categoriesList?: any[]): boolean => {
  if (!product) return false;

  // Explicit flag from admin
  if (product.hasFragranceOptions) return true;

  const title = (product.title || '').toLowerCase();
  const categoryName = (product.category || '').toLowerCase();

  // Keyword check in title or category name
  if (
    title.includes('attar') ||
    title.includes('perfume') ||
    title.includes('aatar') ||
    categoryName.includes('attar') ||
    categoryName.includes('perfume') ||
    categoryName.includes('aatar')
  ) {
    return true;
  }

  // Check category_ids / category_id against categories list
  const cats = product.category_ids || (product.category_id ? [product.category_id] : []);
  if (categoriesList && categoriesList.length > 0 && cats.length > 0) {
    const isMatched = cats.some((catId: string) => {
      const c = categoriesList.find((cat: any) => cat.id === catId);
      if (!c) return false;
      const cName = (c.name || '').toLowerCase();
      return cName.includes('attar') || cName.includes('perfume') || cName.includes('aatar');
    });
    if (isMatched) return true;
  }

  return false;
};
