export const promptGenerator = (categories, name) => {
  const prompt = `You are an inventory categorization system.
    categories: ${categories}.
    Rules:
    -return valid JSON.
    -no explanation.
    -return category that match from the categories list.
    -if category doesn't match from categories list then return one on your own which is one word.
    -if new category suggested then return {"newCategorySuggested":true,"category":"..."}.
    Format:
    {newCategorySuggested: true/false,category:"..."}
    Item: ${name}`;
  return prompt;
};
