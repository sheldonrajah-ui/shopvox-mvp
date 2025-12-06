export const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search SA grocery catalogue",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add item to cart",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" }, quantity: { type: "number" } },
        required: ["product_id", "quantity"],
      },
    },
  },
];

const catalogue = [
  { id: "1", name: "Boerewors 1kg", price: 129.99, category: "meat" },
  { id: "2", name: "Castle Lite 24-Pack", price: 299.99, category: "beer" },
  { id: "3", name: "Charcoal 5kg", price: 89.99, category: "braai" },
  { id: "4", name: "Pap 10kg", price: 119.99, category: "staples" },
  { id: "5", name: "Chakalaka Mild", price: 28.99, category: "canned" },
  // Add 25+ more – e.g., Mrs Ball's R36.99, lean wors R149 for healthy infer
];

export async function handleToolCall(toolCall: any) {
  const { name, arguments: args } = toolCall.function;
  const parsed = JSON.parse(args);

  if (name === "search_products") {
    const { query } = parsed;
    // Inductive: If "healthy", filter low-cal
    let results = catalogue.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (query.toLowerCase().includes('healthy')) {
      results = results.filter(p => p.price < 100); // Stub for healthy swaps
    }
    return JSON.stringify({ results, message: `Found ${results.length} items for "${query}". Add?` });
  }

  if (name === "add_to_cart") {
    const { product_id, quantity = 1 } = parsed;
    const product = catalogue.find(p => p.id === product_id);
    if (product) {
      // Save to session or DB stub
      return JSON.stringify({ success: true, item: { ...product, quantity }, message: `Added ${quantity}x ${product.name}!` });
    }
  }

  return JSON.stringify({ error: "Tool failed" });
}