const fs = require("fs");
const path = require("path");

// data folder is one level up from this utilities folder
const CART_FILE = path.join(__dirname, "..", "data", "cart.json");
const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

const securityMiddleware = (req, res, next) => {
  // Check if user exists and has the required roles
  if (
    req.user &&
    req.user.roles &&
    (req.user.roles.includes("user") || req.user.roles.includes("admin"))
  ) {
    return next();
  }

  res.status(403).json({ success: false, error: "Forbidden" });
};

// Generic JSON file readers/writers to reduce duplication
const readJson = (filePath, defaultValue = []) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return defaultValue;
  }
};

const writeJson = (filePath, data) => {
  // Keep behavior simple and synchronous for now to remain compatible with existing code
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Backward-compatible specialized functions
const readCart = () => readJson(CART_FILE, []);
const readProducts = () => readJson(PRODUCTS_FILE, []);
const writeCart = (cartItems) => writeJson(CART_FILE, cartItems);
const writeProducts = (products) => writeJson(PRODUCTS_FILE, products);

const generateId = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
};

const validateProduct = (product) => {
  const errors = [];

  if (
    !product ||
    !product.name ||
    typeof product.name !== "string" ||
    product.name.trim() === ""
  ) {
    errors.push("Name is required and must be a non-empty string");
  }

  // Only check price if product exists
  if (!product) {
    errors.push("Price is required and must be a positive number");
  } else {
    const priceNum =
      typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price;
    if (
      !priceNum ||
      typeof priceNum !== "number" ||
      priceNum <= 0 ||
      Number.isNaN(priceNum)
    ) {
      errors.push("Price is required and must be a positive number");
    }
  }

  return errors;
};

const adminMiddleware = (req, res, next) => {
  // Check if user exists and has admin role
  if (req.user && req.user.roles && req.user.roles.includes("admin")) {
    return next();
  }
  res.status(403).json({ success: false, error: "Forbidden" });
};

const calculateBalance = (cartItems, products) => {
  return cartItems.reduce((total, cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId);
    if (product) {
      return total + product.price * cartItem.quantity;
    }
    return total;
  }, 0);
};

const getCartWithDetails = () => {
  const cartItems = readCart();
  const products = readProducts();

  const cartWithDetails = cartItems.map((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId);
    return {
      ...cartItem,
      product: product || null,
      subtotal: product ? product.price * cartItem.quantity : 0,
    };
  });

  const balance = calculateBalance(cartItems, products);

  return {
    items: cartWithDetails,
    balance,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
};

module.exports = {
  securityMiddleware,
  readCart,
  readProducts,
  writeCart,
  calculateBalance,
  getCartWithDetails,
  writeProducts,
  generateId,
  validateProduct,
  adminMiddleware,
  // lower-level helpers (useful for tests)
  readJson,
  writeJson,
};
