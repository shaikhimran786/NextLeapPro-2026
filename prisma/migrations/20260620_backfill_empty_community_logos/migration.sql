-- Backfill empty community logos with DiceBear defaults based on slug
UPDATE "Community"
SET logo = CASE 
  WHEN slug IS NOT NULL AND slug != '' 
  THEN 'https://api.dicebear.com/7.x/shapes/svg?seed=' || slug
  ELSE 'https://api.dicebear.com/7.x/shapes/svg?seed=' || CAST(id AS TEXT)
END
WHERE logo = '' OR logo IS NULL;
