import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getChatCompletion(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
) {
  try {
    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo-16k", // Using a model with larger context window
      temperature: 0.1, // Even lower temperature to strictly follow instructions
      max_tokens: 1000, // Reduced from 2000 to save tokens
      response_format: { type: "text" },
    });

    const response = completion.choices[0].message;
    console.log("OpenAI response:", response.content);

    // Extract just the message part (before any __ACTION_DATA marker)
    let userMessage = response.content;
    if (response.content.includes("__ACTION_DATA:")) {
      userMessage = response.content.split("__ACTION_DATA:")[0].trim();
      // Ensure the message is brief
      if (userMessage.length > 100) {
        // Reduced from 150 to 100
        userMessage = userMessage.substring(0, 97) + "...";
      }
    }

    // Return the original response with any modifications
    return {
      ...response,
      content: response.content,
    };
  } catch (error) {
    console.error("Error getting chat completion:", error);
    throw new Error(`OpenAI API error: ${error.message || error}`);
  }
}
