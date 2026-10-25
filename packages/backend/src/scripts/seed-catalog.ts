import mongoose from "mongoose";
import { connectDB } from "../shared/config/dbconfig.js";
import { Brand } from "../modules/catalog/models/brand.model.js";
import { Category } from "../modules/catalog/models/category.model.js";
import { Product } from "../modules/catalog/models/product.model.js";
import { ProductVariant } from "../modules/catalog/models/productVariant.model.js";
import { InventoryEvent } from "../modules/inventory/models/inventoryEvent.model.js";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// High-Quality Apparel Master Dataset
// ---------------------------------------------------------------------------

const BRANDS_SEED = [
  {
    name: "FabIndia Heritage",
    slug: "fabindia-heritage",
    description: "Handcrafted Indian ethnic wear celebrating traditional artisans and handloom weaves.",
    logo: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Allen Solly",
    slug: "allen-solly",
    description: "Pioneer in smart casual apparel, corporate wear, and Friday dressing for modern professionals.",
    logo: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Levi Strauss & Co",
    slug: "levi-strauss",
    description: "Authentic denim jeans, trucker jackets, and timeless Western heritage streetwear since 1853.",
    logo: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Zara Studio",
    slug: "zara-studio",
    description: "Contemporary European trendsetting apparel, architectural tailoring, and premium linen silhouettes.",
    logo: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Raymond Complete Man",
    slug: "raymond-complete-man",
    description: "Finest worsted suiting, pure merino wool fabrics, and tailored formal blazers for gentlemen.",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "W for Woman",
    slug: "w-for-woman",
    description: "Expressive Indian fusion wear, contemporary kurtas, palazzos, and festive festive ensembles.",
    logo: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80",
  },
];

async function seedCatalog() {
  console.log("==================================================");
  console.log("   Vendor Vogue Apparel Catalog Seeder");
  console.log("==================================================");

  try {
    console.log("\nConnecting to MongoDB...");
    await connectDB();
    console.log("Connected successfully.\n");

    try {
      const existingIndexes = await Category.collection.indexes();
      const legacyNameIndex = existingIndexes.find((idx) => idx.name === "name_1");
      if (legacyNameIndex) {
        console.log("Dropping legacy global 'name_1' index in favor of '{ parent: 1, name: 1 }'...");
        await Category.collection.dropIndex("name_1");
      }
    } catch {
      // Ignore
    }

    // -------------------------------------------------------------------------
    // 1. Seed Brands
    // -------------------------------------------------------------------------
    console.log("1. Seeding Apparel Brands...");
    const brandMap: Record<string, any> = {};

    for (const b of BRANDS_SEED) {
      let brandDoc = await Brand.findOne({ slug: b.slug });
      if (!brandDoc) {
        brandDoc = await Brand.create({
          name: b.name,
          slug: b.slug,
          description: b.description,
          logo: b.logo,
          isActive: true,
        });
        console.log(`   + Created Brand: ${b.name}`);
      } else {
        console.log(`   * Existing Brand: ${b.name}`);
      }
      brandMap[b.slug] = brandDoc;
    }

    // -------------------------------------------------------------------------
    // 2. Seed Hierarchical Category Tree
    // -------------------------------------------------------------------------
    console.log("\n2. Seeding Category Tree Hierarchy...");
    const categoryMap: Record<string, any> = {};

    // Helper to get or create a category with proper ancestor linkage
    async function getOrCreateCategory(
      name: string,
      slug: string,
      description: string,
      parentDoc?: any,
    ) {
      let cat = await Category.findOne({ slug });
      if (!cat) {
        const ancestors = parentDoc
          ? [...parentDoc.ancestors, parentDoc._id]
          : [];

        cat = await Category.create({
          name,
          slug,
          description,
          parent: parentDoc ? parentDoc._id : null,
          ancestors,
          isActive: true,
        });
        console.log(`   + Created Category: ${name} (Path: ${ancestors.length === 0 ? "Root" : "Level " + ancestors.length})`);
      } else {
        console.log(`   * Existing Category: ${name}`);
      }
      return cat;
    }

    // -------------------------------------------------------------------------
    // Roots (Level 0)
    // -------------------------------------------------------------------------
    const menRoot = await getOrCreateCategory("Men", "men", "Apparel, footwear and accessories for men");
    const womenRoot = await getOrCreateCategory("Women", "women", "Apparel, ethnic wear and accessories for women");
    const kidsRoot = await getOrCreateCategory("Kids", "kids", "Apparel, casual wear and playwear for boys and girls");

    // -------------------------------------------------------------------------
    // Men Subcategories (Level 1) & Leaf Categories (Level 2)
    // -------------------------------------------------------------------------
    const menTopwear = await getOrCreateCategory("Topwear", "men-topwear", "Shirts, t-shirts, polos, and jackets for men", menRoot);
    const menBottomwear = await getOrCreateCategory("Bottomwear", "men-bottomwear", "Jeans, trousers, chinos, and shorts for men", menRoot);
    const menOuterwear = await getOrCreateCategory("Outerwear", "men-outerwear", "Jackets, coats, and blazers for men", menRoot);

    const menTShirts = await getOrCreateCategory("T-Shirts", "men-t-shirts", "Heavyweight, oversized, and graphic t-shirts for men", menTopwear);
    const menShirts = await getOrCreateCategory("Shirts", "men-shirts", "Linen, oxford cotton, and weekend shirts for men", menTopwear);
    const menHoodies = await getOrCreateCategory("Hoodies & Sweatshirts", "men-hoodies", "French terry hoodies and sweatshirts for men", menTopwear);
    const menJeans = await getOrCreateCategory("Jeans", "men-jeans", "Slim, straight, and vintage washed denim jeans for men", menBottomwear);
    const menTrousers = await getOrCreateCategory("Trousers & Cargos", "men-trousers", "Pleated trousers, chinos, and utilitarian cargos for men", menBottomwear);
    const menJackets = await getOrCreateCategory("Jackets & Coats", "men-jackets", "Biker jackets, bomber jackets, and trench coats for men", menOuterwear);

    // -------------------------------------------------------------------------
    // Women Subcategories (Level 1) & Leaf Categories (Level 2)
    // -------------------------------------------------------------------------
    const womenTopwear = await getOrCreateCategory("Topwear", "women-topwear", "Tops, baby tees, shirts, and luxury knits for women", womenRoot);
    const womenBottomwear = await getOrCreateCategory("Bottomwear", "women-bottomwear", "Skirts, tailored trousers, and contemporary denim for women", womenRoot);
    const womenDresses = await getOrCreateCategory("Dresses", "women-dresses", "Evening slip dresses, blazer dresses, and formal silhouettes for women", womenRoot);

    const womenTops = await getOrCreateCategory("Tops & Tees", "women-tops", "Ribbed baby tees and sculpted crop tops for women", womenTopwear);
    const womenShirts = await getOrCreateCategory("Shirts & Blouses", "women-shirts", "Oversized silk blend shirts and tailored blouses for women", womenTopwear);
    const womenSkirtsPants = await getOrCreateCategory("Skirts & Pants", "women-skirts-pants", "High-waist wide pants and midi skirts for women", womenBottomwear);
    const womenDenim = await getOrCreateCategory("Denim", "women-denim", "Low-rise baggy cargo jeans and wide-leg denim for women", womenBottomwear);
    const womenMaxiDresses = await getOrCreateCategory("Maxi & Midi Dresses", "women-maxi-dresses", "Bias-cut satin slip maxi dresses and linen dresses for women", womenDresses);

    // -------------------------------------------------------------------------
    // Kids Subcategories (Level 1) & Leaf Categories (Level 2)
    // -------------------------------------------------------------------------
    const kidsBoys = await getOrCreateCategory("Boys", "kids-boys", "Apparel and casual wear for boys", kidsRoot);
    const kidsGirls = await getOrCreateCategory("Girls", "kids-girls", "Dresses, tops, and playwear for girls", kidsRoot);

    const kidsBoysTees = await getOrCreateCategory("Tees & Polos", "kids-boys-tees", "Organic cotton colorblock t-shirts and polos for boys", kidsBoys);
    const kidsBoysBottoms = await getOrCreateCategory("Shorts & Joggers", "kids-boys-bottoms", "Fleece jogger pants and casual shorts for boys", kidsBoys);
    const kidsGirlsDresses = await getOrCreateCategory("Dresses & Jumpsuits", "kids-girls-dresses", "Tiered cotton floral dresses and everyday jumpsuits for girls", kidsGirls);
    const kidsGirlsTops = await getOrCreateCategory("Tops & Leggings", "kids-girls-tops", "Ribbed flutter-sleeve tops and stretch cotton leggings for girls", kidsGirls);

    categoryMap["men-t-shirts"] = menTShirts;
    categoryMap["men-shirts"] = menShirts;
    categoryMap["men-hoodies"] = menHoodies;
    categoryMap["men-jeans"] = menJeans;
    categoryMap["men-trousers"] = menTrousers;
    categoryMap["men-jackets"] = menJackets;

    categoryMap["women-tops"] = womenTops;
    categoryMap["women-shirts"] = womenShirts;
    categoryMap["women-skirts-pants"] = womenSkirtsPants;
    categoryMap["women-denim"] = womenDenim;
    categoryMap["women-maxi-dresses"] = womenMaxiDresses;

    categoryMap["kids-boys-tees"] = kidsBoysTees;
    categoryMap["kids-boys-bottoms"] = kidsBoysBottoms;
    categoryMap["kids-girls-dresses"] = kidsGirlsDresses;
    categoryMap["kids-girls-tops"] = kidsGirlsTops;

    // Legacy aliases for existing product references
    categoryMap["casual-shirts"] = menShirts;
    categoryMap["formal-shirts"] = menShirts;
    categoryMap["polo-tees"] = menTShirts;
    categoryMap["denim-jeans"] = menJeans;
    categoryMap["kurta-sets-men"] = menShirts;
    categoryMap["kurtas-women"] = womenTops;
    categoryMap["dresses-women"] = womenMaxiDresses;

    // -------------------------------------------------------------------------
    // 3. Seed Apparel Products & SKU Variants
    // -------------------------------------------------------------------------
    console.log("\n3. Seeding Apparel Products & SKU Variant Matrices...");

    const PRODUCTS_DATA = [
      {
        name: "Classic Pure Linen Regular Shirt",
        slug: "classic-pure-linen-regular-shirt",
        description: "Breathable woven pure French linen shirt with spread collar and mother-of-pearl buttons. Ideal for warm weather smart dressing.",
        brand: brandMap["allen-solly"]._id,
        category: categoryMap["casual-shirts"]._id,
        hsnCode: "620520",
        gstRate: 12,
        tags: ["linen", "summer", "breathable", "smart-casual"],
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "S", sku: "AS-LIN-WHT-S", mrp: 2999, price: 2199, cost: 950, stock: 25 },
          { size: "M", sku: "AS-LIN-WHT-M", mrp: 2999, price: 2199, cost: 950, stock: 45 },
          { size: "L", sku: "AS-LIN-WHT-L", mrp: 2999, price: 2199, cost: 950, stock: 40 },
          { size: "XL", sku: "AS-LIN-WHT-XL", mrp: 2999, price: 2199, cost: 950, stock: 20 },
        ],
      },
      {
        name: "Executive Royal Twill Formal Shirt",
        slug: "executive-royal-twill-formal-shirt",
        description: "Crafted from 100% two-ply Egyptian Giza cotton with an easy-iron silky twill weave. Designed for high-stakes boardroom elegance.",
        brand: brandMap["raymond-complete-man"]._id,
        category: categoryMap["formal-shirts"]._id,
        hsnCode: "620520",
        gstRate: 12,
        tags: ["giza-cotton", "formal", "office", "twill"],
        images: [
          "https://images.unsplash.com/photo-1620012253295-c15c429f66bf?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "38", sku: "RAY-TWL-BLU-38", mrp: 3499, price: 2799, cost: 1100, stock: 30 },
          { size: "40", sku: "RAY-TWL-BLU-40", mrp: 3499, price: 2799, cost: 1100, stock: 50 },
          { size: "42", sku: "RAY-TWL-BLU-42", mrp: 3499, price: 2799, cost: 1100, stock: 35 },
          { size: "44", sku: "RAY-TWL-BLU-44", mrp: 3499, price: 2799, cost: 1100, stock: 15 },
        ],
      },
      {
        name: "501 Original Fit Selvedge Denim Jeans",
        slug: "501-original-fit-selvedge-denim-jeans",
        description: "The blueprint for all denim jeans since 1873. Features authentic button fly, straight leg silhouette, and durable non-stretch cotton twill.",
        brand: brandMap["levi-strauss"]._id,
        category: categoryMap["denim-jeans"]._id,
        hsnCode: "620342",
        gstRate: 12,
        tags: ["denim", "501", "vintage", "selvedge", "durable"],
        images: [
          "https://images.unsplash.com/photo-1542272604-780c96856592?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "30", sku: "LEV-501-IND-30", mrp: 4999, price: 3999, cost: 1600, stock: 20 },
          { size: "32", sku: "LEV-501-IND-32", mrp: 4999, price: 3999, cost: 1600, stock: 40 },
          { size: "34", sku: "LEV-501-IND-34", mrp: 4999, price: 3999, cost: 1600, stock: 40 },
          { size: "36", sku: "LEV-501-IND-36", mrp: 4999, price: 3999, cost: 1600, stock: 18 },
        ],
      },
      {
        name: "Hand-Block Printed Chanderi Silk Kurta",
        slug: "hand-block-printed-chanderi-silk-kurta",
        description: "Artisanal hand-block printed kurta featuring natural vegetable dyes, zari borders, and breathable cotton-silk lining. Festive perfection.",
        brand: brandMap["fabindia-heritage"]._id,
        category: categoryMap["kurtas-women"]._id,
        hsnCode: "620442",
        gstRate: 12,
        tags: ["chanderi", "ethnic", "hand-block", "silk", "festive"],
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "XS", sku: "FAB-CHN-MRN-XS", mrp: 3299, price: 2499, cost: 1050, stock: 15 },
          { size: "S", sku: "FAB-CHN-MRN-S", mrp: 3299, price: 2499, cost: 1050, stock: 30 },
          { size: "M", sku: "FAB-CHN-MRN-M", mrp: 3299, price: 2499, cost: 1050, stock: 35 },
          { size: "L", sku: "FAB-CHN-MRN-L", mrp: 3299, price: 2499, cost: 1050, stock: 25 },
        ],
      },
      {
        name: "Floral Tiered Bohemian Maxi Dress",
        slug: "floral-tiered-bohemian-maxi-dress",
        description: "Flowing georgette maxi dress with puff sleeves, smocked bodice, and romantic tiered ruffle skirt. Perfect for sunny vacations and brunches.",
        brand: brandMap["zara-studio"]._id,
        category: categoryMap["dresses-women"]._id,
        hsnCode: "620442",
        gstRate: 12,
        tags: ["maxi-dress", "bohemian", "floral", "summer", "vacation"],
        images: [
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "S", sku: "ZAR-DRS-FLR-S", mrp: 4590, price: 3590, cost: 1400, stock: 18 },
          { size: "M", sku: "ZAR-DRS-FLR-M", mrp: 4590, price: 3590, cost: 1400, stock: 24 },
          { size: "L", sku: "ZAR-DRS-FLR-L", mrp: 4590, price: 3590, cost: 1400, stock: 14 },
        ],
      },
      {
        name: "Classic Pique Knit Heritage Polo",
        slug: "classic-pique-knit-heritage-polo",
        description: "Ribbed collar cotton pique polo featuring subtle contrast tipping, twin-needle hem, and signature athletic fit.",
        brand: brandMap["allen-solly"]._id,
        category: categoryMap["polo-tees"]._id,
        hsnCode: "610910",
        gstRate: 5,
        tags: ["polo", "pique", "casual", "tennis", "cotton"],
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "S", sku: "AS-POL-NVY-S", mrp: 1499, price: 999, cost: 420, stock: 40 },
          { size: "M", sku: "AS-POL-NVY-M", mrp: 1499, price: 999, cost: 420, stock: 60 },
          { size: "L", sku: "AS-POL-NVY-L", mrp: 1499, price: 999, cost: 420, stock: 55 },
          { size: "XL", sku: "AS-POL-NVY-XL", mrp: 1499, price: 999, cost: 420, stock: 30 },
        ],
      },
      {
        name: "Embroidered Tussar Silk Kurta Set",
        slug: "embroidered-tussar-silk-kurta-set",
        description: "Men's festive long kurta paired with churidar pajama. Embroidered mandarin collar and placket in metallic resham threads.",
        brand: brandMap["fabindia-heritage"]._id,
        category: categoryMap["kurta-sets-men"]._id,
        hsnCode: "620342",
        gstRate: 12,
        tags: ["kurta-set", "festive", "diwali", "silk", "ethnic-men"],
        images: [
          "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=1000&auto=format&fit=crop&q=85",
        ],
        variants: [
          { size: "38", sku: "FAB-KRT-GLD-38", mrp: 4999, price: 3999, cost: 1700, stock: 15 },
          { size: "40", sku: "FAB-KRT-GLD-40", mrp: 4999, price: 3999, cost: 1700, stock: 25 },
          { size: "42", sku: "FAB-KRT-GLD-42", mrp: 4999, price: 3999, cost: 1700, stock: 20 },
        ],
      },
    ];

    let totalProductsSeeded = 0;
    let totalVariantsSeeded = 0;

    for (const p of PRODUCTS_DATA) {
      let productDoc = await Product.findOne({ slug: p.slug });
      if (!productDoc) {
        productDoc = await Product.create({
          name: p.name,
          slug: p.slug,
          description: p.description,
          brand: p.brand,
          category: p.category,
          hsnCode: p.hsnCode,
          gstRate: p.gstRate,
          tags: p.tags,
          images: p.images,
          isActive: true,
        });
        console.log(`   + Created Product: ${p.name}`);
        totalProductsSeeded++;
      } else {
        console.log(`   * Existing Product: ${p.name}`);
      }

      // Seed Variants
      for (const v of p.variants) {
        let variantDoc = await ProductVariant.findOne({ sku: v.sku });
        if (!variantDoc) {
          variantDoc = await ProductVariant.create({
            productId: productDoc._id,
            name: `${p.name} - Size ${v.size}`,
            slug: `${p.slug}-${v.size.toLowerCase()}`,
            sku: v.sku,
            description: `Size ${v.size} variation of ${p.name}`,
            sellingPrice: v.price,
            mrp: v.mrp,
            costPrice: v.cost,
            stockQuantity: v.stock,
            reservedQuantity: 0,
            weightInGrams: 280,
            attributes: [{ name: "Size", value: v.size }],
            images: p.images.slice(0, 1),
            isActive: true,
          });

          // Ledger Event
          await InventoryEvent.create({
            productVariantId: variantDoc._id,
            eventType: "RESTOCK",
            delta: v.stock,
            ResultingStockQuantity: v.stock,
            ResultingReservedQuantity: 0,
            reason: "Initial catalog seeding opening stock",
          });

          totalVariantsSeeded++;
        }
      }
    }

    console.log("\n==================================================");
    console.log("   CATALOG SEEDING COMPLETE!");
    console.log(`   - Brands: ${Object.keys(brandMap).length}`);
    console.log(`   - Categories: ${Object.keys(categoryMap).length + 5}`);
    console.log(`   - Products Created: ${totalProductsSeeded}`);
    console.log(`   - SKU Variants Created: ${totalVariantsSeeded}`);
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Catalog seeding error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedCatalog();
}
