/* ==========================================================================
   QAFIZZ - product list
   This is the ONLY file you need to edit to add, change or remove products.

   Each product:
     id        short name used in the link: qafizz.com/product.html?id=glow-serum
               (lowercase letters, numbers and dashes only)
     name      product title
     price     in CAD, e.g. 24.99
     was       optional old price to show a sale (or null)
     badge     optional label on the photo, e.g. "Bestseller" (or "")
     tagline   one short line shown on the home page card
     details   bullet points on the product page
     images    photo paths or URLs, first one is the main photo
               e.g. ["images/curl-comb-1.jpg", "images/curl-comb-2.jpg"]
               put the photo files in the images/ folder
     styles    optional options the buyer picks from (colour, size...)
               each one: { name: "Black", stripe: "https://buy.stripe.com/..." }
               a style's own stripe link wins; otherwise the product's is used
     stripe    your Stripe Payment Link for this product
               leave "" and the button says "Coming soon" instead of Buy
     reviews   REAL reviews from your customers only, newest first:
               { name: "Jazmin G.", place: "Toronto, ON", date: "2026-09-20",
                 stars: 5, text: "Heats up fast..." }
   ========================================================================== */

window.QAFIZZ_PRODUCTS = [
  {
    id: "curl-comb",
    name: "Cordless 2-in-1 Straightening Comb & Curler",
    price: 39.99,
    was: 54.99,
    badge: "Bestseller",
    tagline: "Straighten or curl, no cord, heats up in about a minute.",
    details: [
      "2-in-1: straightening brush and curling iron",
      "4 heat settings with an LED display",
      "Cordless, charges with USB-C",
      "Heats up in about 60 seconds",
      "Small enough for your bag"
    ],
    images: [],
    styles: [
      { name: "Black", stripe: "" },
      { name: "Beige", stripe: "" }
    ],
    stripe: "",
    reviews: []
  },
  {
    id: "galaxy-projector",
    name: "Galaxy Star Projector",
    price: 44.99,
    was: 59.99,
    badge: "Viral",
    tagline: "Turns your ceiling into a nebula.",
    details: [
      "Nebula and star modes with 8 colours",
      "Remote plus a sleep timer",
      "USB-C powered, cable included"
    ],
    images: [],
    styles: [],
    stripe: "",
    reviews: []
  },
  {
    id: "portable-blender",
    name: "Portable Blender Bottle",
    price: 35.99,
    was: 45.99,
    badge: "",
    tagline: "Smoothies anywhere. Charges with USB-C.",
    details: [
      "400 ml bottle with 6 stainless steel blades",
      "About 15 blends per charge",
      "Blades lock unless the lid is on"
    ],
    images: [],
    styles: [
      { name: "Pink", stripe: "" },
      { name: "White", stripe: "" },
      { name: "Green", stripe: "" }
    ],
    stripe: "",
    reviews: []
  },
  {
    id: "heavy-tee",
    name: "Oversized Heavyweight Tee",
    price: 34.00,
    was: null,
    badge: "New",
    tagline: "Boxy fit, thick cotton, never see-through.",
    details: [
      "280 gsm 100% cotton",
      "Dropped shoulders, boxy cut",
      "Size down for a regular fit"
    ],
    images: [],
    styles: [
      { name: "S", stripe: "" },
      { name: "M", stripe: "" },
      { name: "L", stripe: "" },
      { name: "XL", stripe: "" }
    ],
    stripe: "",
    reviews: []
  }
];
