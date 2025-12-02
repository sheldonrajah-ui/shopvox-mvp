// src/app/api/grok/functions.ts
import { z } from "zod";

// Tiny demo catalogue (we’ll make it huge later)
const catalogue = [
  { id: "1", name: "Boerewors 1kg", price: 129.99, category: "meat", image: "https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Boerewors" },
  { id: "2", name: "Braai Broodjies 6-Pack", price: 34.99, category: "bakery", image: "https://via.placeholder.com/300x300/FFD700/000000?text=Broodjies" },
  { id: "3", name: "Castle Lite 24-Pack", price: 299.99, category: "beer", image: "https://via.placeholder.com/300x300/00FF00/FFFFFF?text=Castle+Lite" },
  { id: "4", name: "Charcoal 5kg", price: 89.99, category: "braai", image: "https://via.placeholder.com/300x300/444444/FFFFFF?text=Charcoal" },
  { id: "5", name: "Maas 2L", price: 42.99, category: "dairy", image: "https://via.placeholder.com/300x300/FFFFFF/000000?text=Maas" },
  { id: "6", name: "Chakalaka Mild", price: 28.99, category: "canned", image: "https://via.placeholder.com/300x300/FF6600/FFFFFF?text=Chakalaka" },
  { id: "7", name: "Wors Rolls 10-Pack", price: 49.99, category: "bakery", image: "https://via.placeholder.com/300x300/BROWN/FFFFFF?text=Wors+Rolls" },
  { id: "8", name: "Mrs Ball’s Chutney", price: 36.99, category: "condiments", image: "https://via.placeholder.com/300x300/8B4513/FFFFFF?text=Mrs+Balls" },
];

export const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search the grocery catalogue for products matching the query",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What the user is looking for" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add a product with exact quantity to the user's cart",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          quantity: { type: "number", minimum: 1 },
        },
        required: ["product_id", "quantity"],
      },
    },
  },
];

export async function handleToolCall(toolCall: any) {
  const { name, arguments: args } = toolCall.function;
  const parsed = JSON.parse(args);

  if (name === "search_products") {
    const { query } = parsed;
    const results = catalogue
      .filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);

    return JSON.stringify({
      results,
      message: results.length 
        ? `Sharp sharp! Found ${results.length} lekker things for "${query}". Which ones must I put in the trolley?` 
        : `Eish sorry bru, nothing for "${query}". Try "boerewors", "castle" or "braai pack"?`
    });
  }

  if (name === "add_to_cart") {
    const { product_id, quantity } = parsed;
    const product = catalogue.find(p => p.id === product_id);
    if (!product) return JSON.stringify({ error: "Product not found" });

    return JSON.stringify({
      success: true,
      item: { ...product, quantity },
      message: `Lekker! ${quantity} × ${product.name} in the trolley 🔥 Anything else for the braai?`
    });
  }

  return JSON.stringify({ error: "Unknown tool" });
}