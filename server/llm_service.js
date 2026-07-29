const Groq = require("groq-sdk");

let groq = null;

async function analyzeWithAI({ dtcs, vin, make, symptoms }) {
    try {
        if (!process.env.GROQ_API_KEY && !process.env.LLM_API_KEY) {
            throw new Error("API key should be set when using the Groq API.");
        }
        
        if (!groq) {
            groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.LLM_API_KEY });
        }

        let prompt = `
        You are an expert master automotive mechanic. Analyze the following diagnostic data:
        - Diagnostic Trouble Codes (DTCs): ${dtcs.join(", ")}
        - Vehicle VIN: ${vin || "Not Provided"}
        - Vehicle Make: ${make || "Not Provided"}
        - Customer Symptoms: ${symptoms || "Not Provided"}
        `;

        if (!vin && (!make || make === "Unknown")) {
            prompt += `
        CRITICAL INSTRUCTION: If any of the provided DTCs are manufacturer-specific (e.g., codes starting with P1, B1, C1, U1, etc.), you MUST explicitly state in the \`breakdown\` field that the code is manufacturer-specific and its exact meaning varies by brand (for example, P1525 can mean Brake Light Switch/VANOS for BMW, Cruise Control Limit for Renault/Nissan, or Speed Sensor for others). 
        You MUST also add a clear warning advising the user to enter their VIN or select their Vehicle Make for a 100% accurate diagnosis.
            `;
        }

        prompt += `
        Determine the most likely root cause and provide a confidence score.
        Respond ONLY with a valid JSON object matching this exact schema:
        {
          "root_cause": "A short, concise string identifying the primary root cause.",
          "confidence": 85,
          "is_manufacturer_specific": true,
          "breakdown": "A detailed but easily digestible explanation of the failure.",
          "recommended_actions": ["Action 1", "Action 2"],
          "diy_guide": {
            "required_part": "Exact part name and typical OEM recommendation",
            "difficulty_level": "Easy (Beginner) | Moderate (Intermediate) | Hard (Professional Needed)",
            "required_tools": ["Tool 1", "Tool 2"],
            "estimated_repair_time": "Time estimate (e.g. 30 - 45 Minutes)",
            "search_keywords": "Search query keywords for parts/tutorials"
          }
        }
        `;

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
            recommended_actions: [],
            diy_guide: {
                required_part: "Unknown",
                difficulty_level: "Moderate (Intermediate)",
                required_tools: ["Basic Tools"],
                estimated_repair_time: "Unknown",
                search_keywords: "general repair"
            }
        };
    }
}

module.exports = { analyzeWithAI };
