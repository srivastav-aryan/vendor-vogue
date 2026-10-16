//Models
export {
  Product,
  type LeanProduct,
  type PopulatedLeanProduct,
  type ProductDocument,
} from "./models/product.model.js";
export {
  ProductVariant,
  type LeanProductVariant,
  type ProductVariantDocument,
} from "./models/productVariant.model.js";
export {
  Category,
  type LeanCategory,
  type CategoryDocument,
} from "./models/category.model.js";
export {
  Brand,
  type LeanBrand,
  type BrandDocument,
} from "./models/brand.model.js";

// Services
export { BrandService } from "./services/brand.service.js";
export { CategoryService } from "./services/category.service.js";
export { ProductService } from "./services/product.service.js";

// Interfaces
export type { IBrandService } from "./interfaces/brand.service.interface.js";
export type { BrandControllerInterface } from "./interfaces/brand.controller.interface.js";
export type { ICategoryServices } from "./interfaces/category.service.interface.js";
export type { ICategoryControllerInterface } from "./interfaces/category.controller.interface.js";
export type { IProductService } from "./interfaces/product.service.interface.js";
export type { ProductControllerInterface } from "./interfaces/product.controller.interface.js";

// Controllers
export { brandControllerCreator } from "./controllers/brand.controller.js";
export { categoryControllerCreator } from "./controllers/category.controller.js";
export { productControllerCreator } from "./controllers/product.controller.js";

// Routes
export { createBrandRouter } from "./routes/brand.routes.js";
export { createCategoryRouter } from "./routes/category.routes.js";
export { createProductRouter } from "./routes/product.routes.js";

// Mappers
export { CategoryMapper } from "./mappers/category.mapper.js";
export { ProductMapper } from "./mappers/product.mapper.js";

// Errors
export {
  CatalogError,
  type CatalogErrorCode,
  CATALOG_ERROR_CODES,
} from "./errors/catalog.errors.js";
