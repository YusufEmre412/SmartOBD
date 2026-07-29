const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.LLM_API_KEY });

async function analyzeWithAI({ dtcs, vin, make, symptoms }) {
    if (!process.env.GROQ_API_KEY && !process.env.LLM_API_KEY) {
        throw new Error("API key should be set when using the Groq API.");
    }

    const prompt = `
    You are an expert master automotive mechanic. Analyze the following diagnostic data:
    - Diagnostic Trouble Codes (DTCs): ${dtcs.join(", ")}
    - Vehicle VIN: ${vin || "Not Provided"}
    - Vehicle Make: ${make || "Not Provided"}
    - Customer Symptoms: ${symptoms || "Not Provided"}

    Determine the most likely root cause and provide a confidence score.
    Respond ONLY with a valid JSON object matching this exact schema:
    {
      "root_cause": "A short, concise string identifying the primary root cause.",
      "confidence": 85,
      "is_manufacturer_specific": true,
      "breakdown": "A detailed but easily digestible explanation of the failure.",
      "recommended_actions": ["Action 1", "Action 2"]
    }
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert master mechanic. Your only job is to return the requested JSON structure strictly conforming to the schema. Do not include markdown blocks or other text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const textResponse = chatCompletion.choices[0]?.message?.content;
        const data = JSON.parse(textResponse);
        return data;
    } catch (error) {
        console.error("Groq API Detailed Error:", error);
        
        let errorMessage = "An error occurred while connecting to the AI diagnostic service: " + (error.message || error);
        
        return {
            root_cause: "LLM Analysis Failed",
            confidence: 0,
            is_manufacturer_specific: false,
            breakdown: errorMessage,
            recommended_actions: []
        };
    }
}

module.exports = { analyzeWithAI };
