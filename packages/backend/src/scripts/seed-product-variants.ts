import mongoose from "mongoose";
import { connectDB } from "../shared/config/dbconfig.js";
import { Product } from "../modules/catalog/models/product.model.js";
import { ProductVariant } from "../modules/catalog/models/productVariant.model.js";
import { InventoryEvent } from "../modules/inventory/models/inventoryEvent.model.js";

const SIZES = [
  { size: "S", stock: 25 },
  { size: "M", stock: 35 },
  { size: "L", stock: 30 },
  { size: "XL", stock: 15 },
];

function getCategoryPricing(slug: string): { sellingPrice: number; mrp: number; costPrice: number } {
  const s = slug.toLowerCase();
  if (s.includes("jacket") || s.includes("biker")) {
    return { sellingPrice: 4999, mrp: 6499, costPrice: 1800 };
  }
  if (s.includes("cardigan") || s.includes("hoodie")) {
    return { sellingPrice: 2999, mrp: 3999, costPrice: 1100 };
  }
  if (s.includes("jeans") || s.includes("denim") || s.includes("trousers") || s.includes("pants")) {
    return { sellingPrice: 2499, mrp: 3299, costPrice: 950 };
  }
  if (s.includes("dress") || s.includes("slip")) {
    return { sellingPrice: 3499, mrp: 4499, costPrice: 1200 };
  }
  if (s.includes("shirt") || s.includes("overshirt")) {
    return { sellingPrice: 2199, mrp: 2899, costPrice: 850 };
  }
  if (s.includes("tee") || s.includes("crop") || s.includes("top")) {
    return { sellingPrice: 1499, mrp: 1999, costPrice: 550 };
  }
  return { sellingPrice: 1999, mrp: 2499, costPrice: 750 };
}

async function seedVariants() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Connected successfully.\n");

  const products = await Product.find();
  console.log(`Found ${products.length} products to check/populate variants for.\n`);

  let variantsCreated = 0;
  let variantsRestocked = 0;

  for (const product of products) {
    const existingVariants = await ProductVariant.find({ productId: product._id });
    console.log(`\nProduct: "${product.name}" (${product.slug}) - Existing variants: ${existingVariants.length}`);

    if (existingVariants.length > 0) {
      // Restock any zero-stock variants so they are purchasable
      for (const variant of existingVariants) {
        if (variant.stockQuantity <= 0) {
          variant.stockQuantity = 25;
          variant.isActive = true;
          await variant.save();

          await InventoryEvent.create({
            productVariantId: variant._id,
            eventType: "RESTOCK",
            delta: 25,
            ResultingStockQuantity: 25,
            ResultingReservedQuantity: variant.reservedQuantity || 0,
            reason: "Admin restock for zero-stock catalog SKU",
          });
          variantsRestocked++;
          console.log(`  ↻ Restocked variant ${variant.sku} (Stock set to 25)`);
        }
      }
      continue;
    }

    // Generate variants for products that have 0 variants
    const pricing = getCategoryPricing(product.slug);
    const skuPrefix = product.slug
      .split("-")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);

    for (const s of SIZES) {
      const sku = `VV-${skuPrefix}-${s.size}`;
      const variantSlug = `${product.slug}-${s.size.toLowerCase()}`;

      // Check if SKU already exists anywhere to prevent duplicate key errors
      const existingSku = await ProductVariant.findOne({ sku });
      const finalSku = existingSku ? `${sku}-${product._id.toString().slice(-4)}` : sku;

      const variant = await ProductVariant.create({
        productId: product._id,
        name: `${product.name} - Size ${s.size}`,
        slug: variantSlug,
        sku: finalSku,
        description: `Size ${s.size} variation of ${product.name}`,
        sellingPrice: pricing.sellingPrice,
        mrp: pricing.mrp,
        costPrice: pricing.costPrice,
        stockQuantity: s.stock,
        reservedQuantity: 0,
        weightInGrams: 280,
        attributes: [{ name: "Size", value: s.size }],
        images: product.images && product.images.length > 0 ? product.images.slice(0, 2) : [],
        isActive: true,
      });

      // Create ledger restock event
      await InventoryEvent.create({
        productVariantId: variant._id,
        eventType: "RESTOCK",
        delta: s.stock,
        ResultingStockQuantity: s.stock,
        ResultingReservedQuantity: 0,
        reason: "Initial catalog variant matrix seeding",
      });

      variantsCreated++;
      console.log(`  + Created variant: ${variant.name} [SKU: ${finalSku}] (Stock: ${s.stock}, Price: ₹${pricing.sellingPrice})`);
    }
  }

  console.log("\n==================================================");
  console.log(`Variants Matrix Seeding Complete!`);
  console.log(`- New Variants Created: ${variantsCreated}`);
  console.log(`- Existing Variants Restocked: ${variantsRestocked}`);
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from database.");
}

seedVariants().catch((err) => {
  console.error("Failed to seed variants:", err);
  process.exit(1);
});
