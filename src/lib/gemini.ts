import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getGeminiCompletion(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
) {
  try {
    // Convert the messages format to Gemini format
    const geminiMessages = messages.map((msg) => {
      // Gemini doesn't support system messages directly, so we'll convert them to user messages
      const role = msg.role === "system" ? "user" : msg.role;
      return {
        role: role,
        parts: [{ text: msg.content }],
      };
    });

    // If the first message is a system message (now converted to user), add an assistant response
    // to separate it from the actual user messages
    if (messages[0].role === "system") {
      geminiMessages.splice(1, 0, {
        role: "model",
        parts: [{ text: "I'll follow these instructions carefully." }],
      });
    }

    // Create a chat session
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    });

    // Send all messages except the first one (which is the system message)
    // We'll handle that separately
    let response;

    // If we have a system message, we need to handle it differently
    if (messages[0].role === "system") {
      // Send the first message (system converted to user)
      await chat.sendMessage(geminiMessages[0].parts[0].text);

      // Send the remaining messages
      for (let i = 2; i < geminiMessages.length; i++) {
        const msg = geminiMessages[i];
        if (msg.role === "user") {
          response = await chat.sendMessage(msg.parts[0].text);
        }
      }
    } else {
      // No system message, just send all messages in order
      for (const msg of geminiMessages) {
        if (msg.role === "user") {
          response = await chat.sendMessage(msg.parts[0].text);
        }
      }
    }

    if (!response) {
      throw new Error("No response from Gemini");
    }

    const responseText = response.response.text();
    console.log("Gemini response:", responseText);

    return {
      content: responseText,
    };
  } catch (error) {
    console.error("Error getting Gemini completion:", error);
    throw new Error(`Gemini API error: ${error.message || error}`);
  }
}
