import mongoose from "mongoose";
import { connectDB } from "../shared/config/dbconfig.js";
import { Category } from "../modules/catalog/models/category.model.js";
import { fileURLToPath } from "url";

interface CategorySeedNode {
  name: string;
  slug: string;
  description: string;
  children?: CategorySeedNode[];
}

const CATEGORY_TREE_DATA: CategorySeedNode[] = [
  // ---------------------------------------------------------------------------
  // 1. MEN
  // ---------------------------------------------------------------------------
  {
    name: "Men",
    slug: "men",
    description: "Apparel, outerwear, denim, and tailoring for men",
    children: [
      {
        name: "Topwear",
        slug: "men-topwear",
        description: "T-Shirts, shirts, knitwear, and hoodies for men",
        children: [
          {
            name: "T-Shirts",
            slug: "men-t-shirts",
            description: "Heavyweight, oversized, graphic, and classic cotton tees for men",
          },
          {
            name: "Shirts",
            slug: "men-shirts",
            description: "Pure linen, formal oxford, resort, and casual overshirts for men",
          },
          {
            name: "Hoodies & Sweatshirts",
            slug: "men-hoodies",
            description: "Heavyweight French terry hoodies and boxy crewnecks for men",
          },
        ],
      },
      {
        name: "Bottomwear",
        slug: "men-bottomwear",
        description: "Denim jeans, trousers, and cargo pants for men",
        children: [
          {
            name: "Jeans",
            slug: "men-jeans",
            description: "Loose fit, straight leg, and vintage washed denim jeans for men",
          },
          {
            name: "Trousers & Cargos",
            slug: "men-trousers",
            description: "Pleated wool wide-leg trousers, tailored chinos, and utilitarian cargos for men",
          },
        ],
      },
      {
        name: "Outerwear",
        slug: "men-outerwear",
        description: "Jackets, coats, and blazers for men",
        children: [
          {
            name: "Jackets & Coats",
            slug: "men-jackets",
            description: "Boxy leather biker jackets, bomber jackets, and trench coats for men",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. WOMEN
  // ---------------------------------------------------------------------------
  {
    name: "Women",
    slug: "women",
    description: "Contemporary fashion, dresses, knitwear, and tailoring for women",
    children: [
      {
        name: "Topwear",
        slug: "women-topwear",
        description: "Tops, baby tees, shirts, and luxury knits for women",
        children: [
          {
            name: "Tops & Tees",
            slug: "women-tops",
            description: "Ribbed baby tees, sculpted crop tops, and structured knitwear for women",
          },
          {
            name: "Shirts & Blouses",
            slug: "women-shirts",
            description: "Oversized silk blend shirts, tailored poplin, and linen blouses for women",
          },
        ],
      },
      {
        name: "Bottomwear",
        slug: "women-bottomwear",
        description: "Skirts, tailored trousers, and contemporary denim for women",
        children: [
          {
            name: "Skirts & Pants",
            slug: "women-skirts-pants",
            description: "High-waist wide-leg pants, pleated trousers, and midi skirts for women",
          },
          {
            name: "Denim",
            slug: "women-denim",
            description: "Low-rise baggy cargo jeans, wide-leg denim, and vintage washed fits for women",
          },
        ],
      },
      {
        name: "Dresses",
        slug: "women-dresses",
        description: "Evening slip dresses, blazer dresses, and formal silhouettes for women",
        children: [
          {
            name: "Maxi & Midi Dresses",
            slug: "women-maxi-dresses",
            description: "Bias-cut satin slip maxi dresses and structured linen blazer dresses for women",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. KIDS
  // ---------------------------------------------------------------------------
  {
    name: "Kids",
    slug: "kids",
    description: "Everyday essentials, organic cotton tees, and comfortable apparel for boys and girls",
    children: [
      {
        name: "Boys",
        slug: "kids-boys",
        description: "Apparel and casual wear for boys",
        children: [
          {
            name: "Tees & Polos",
            slug: "kids-boys-tees",
            description: "Organic cotton colorblock t-shirts and polos for boys",
          },
          {
            name: "Shorts & Joggers",
            slug: "kids-boys-bottoms",
            description: "Fleece jogger pants and relaxed casual shorts for boys",
          },
        ],
      },
      {
        name: "Girls",
        slug: "kids-girls",
        description: "Dresses, tops, and playwear for girls",
        children: [
          {
            name: "Dresses & Jumpsuits",
            slug: "kids-girls-dresses",
            description: "Tiered cotton floral dresses and everyday play jumpsuits for girls",
          },
          {
            name: "Tops & Leggings",
            slug: "kids-girls-tops",
            description: "Ribbed flutter-sleeve tops and stretch cotton leggings for girls",
          },
        ],
      },
    ],
  },
];

async function seedCategoryTree() {
  console.log("==================================================");
  console.log("   Vendor Vogue Hierarchical Category Seeder");
  console.log("==================================================");

  try {
    console.log("\nConnecting to MongoDB...");
    await connectDB();
    console.log("Connected successfully.\n");

    // Drop legacy conflicting global unique index on 'name' if present,
    // allowing compound '{ parent: 1, name: 1 }' unique index to function properly
    try {
      const existingIndexes = await Category.collection.indexes();
      const legacyNameIndex = existingIndexes.find((idx) => idx.name === "name_1");
      if (legacyNameIndex) {
        console.log("Dropping legacy global 'name_1' index in favor of '{ parent: 1, name: 1 }'...");
        await Category.collection.dropIndex("name_1");
      }
    } catch (idxErr) {
      // Ignore if index does not exist
    }

    let countRoots = 0;
    let countSections = 0;
    let countLeaves = 0;

    // Recursive seeder to guarantee proper ancestor IDs and parent references
    async function seedNode(
      node: CategorySeedNode,
      parentDoc?: any,
      path: string = "",
    ): Promise<any> {
      const currentPath = path ? `${path} > ${node.name}` : node.name;
      const ancestors = parentDoc ? [...parentDoc.ancestors, parentDoc._id] : [];

      let catDoc = await Category.findOne({ slug: node.slug });

      if (!catDoc) {
        catDoc = await Category.create({
          name: node.name,
          slug: node.slug,
          description: node.description,
          parent: parentDoc ? parentDoc._id : null,
          ancestors,
          isActive: true,
        });

        const level = ancestors.length;
        if (level === 0) countRoots++;
        else if (level === 1) countSections++;
        else countLeaves++;

        console.log(` + [Level ${level}] ${currentPath} (${node.slug})`);
      } else {
        // Sync parent & ancestors if they were updated
        catDoc.name = node.name;
        catDoc.description = node.description;
        catDoc.parent = parentDoc ? parentDoc._id : null;
        catDoc.ancestors = ancestors;
        catDoc.isActive = true;
        await catDoc.save();

        console.log(` * [Synced] ${currentPath} (${node.slug})`);
      }

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          await seedNode(child, catDoc, currentPath);
        }
      }

      return catDoc;
    }

    console.log("Seeding Category Hierarchy...");
    for (const rootNode of CATEGORY_TREE_DATA) {
      await seedNode(rootNode);
    }

    console.log("\n==================================================");
    console.log("   CATEGORY TREE SEEDING COMPLETE!");
    console.log(`   - Roots (Men, Women, Kids): 3`);
    console.log(`   - Sections (Level 1): 8`);
    console.log(`   - Leaf Categories (Level 2): 15`);
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Error seeding category tree:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedCategoryTree();
}
