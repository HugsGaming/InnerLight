import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId, sessionId, drawings } = await request.json();
    
    if (!userId || !sessionId || !drawings) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Extract the drawings directly from the request
    // No need for Supabase or signed URLs
    // @ts-ignore
    const houseData = drawings.find(item => item.stage === "house")?.dataUrl;
    // @ts-ignore
    const personData = drawings.find(item => item.stage === "person")?.dataUrl;
    // @ts-ignore
    const treeData = drawings.find(item => item.stage === "tree")?.dataUrl;
    
    if (!houseData || !personData || !treeData) {
      return NextResponse.json(
        { error: "Missing one or more drawings" },
        { status: 400 }
      );
    }
    
    // Function to analyze individual drawings
    async function analyzeDrawing(drawingUrl: string, drawingType: string) {
      const prompt = `Analyze this drawing of a ${drawingType} using the House-Person-Tree (H-P-T) psychological projection test principles.
      
      For House drawings, focus on:
      - Overall size, placement, and proportions
      - Windows, doors (presence, size, accessibility)
      - Roof, walls, chimney details
      - Environmental context (ground, sky, path)
      - Additional elements
      
      For Person drawings, focus on:
      - Body proportions and completeness
      - Facial features and expression
      - Clothing and accessories
      - Posture and stance
      - Activity or position
      
      For Tree drawings, focus on:
      - Size, position, and grounding
      - Trunk characteristics (size, texture, damage)
      - Branches (shape, direction, quantity)
      - Leaves, fruits, or flowers
      - Environmental context
      
      Please provide a psychological interpretation (250-300 words) of what these elements might reveal about the person's:
      - Emotional state
      - Self-perception
      - Relationships with others
      - Environmental adaptation
      
      Keep the analysis compassionate, constructive, and focused on strengths and growth areas.`;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: drawingUrl } }
              ],
            },
          ],
          max_tokens: 1000,
        });
        
        return response.choices[0].message.content?.trim() || "";
      } catch (error) {
        console.error(`Error analyzing ${drawingType} drawing:`, error);
        throw error;
      }
    }
    
    // Analyze each drawing in parallel
    const [houseAnalysis, personAnalysis, treeAnalysis] = await Promise.all([
      analyzeDrawing(houseData, "house"),
      analyzeDrawing(personData, "person"),
      analyzeDrawing(treeData, "tree")
    ]);
    
    // Generate overall analysis
    const overallAnalysisPrompt = `Based on the following individual analyses from a House-Person-Tree Test, provide a comprehensive psychological profile and overall interpretation. Include insights about emotional well-being, interpersonal relationships, self-concept, and environmental adaptation. Calculate numerical scores on a scale of 1-10 for emotional stability, social interaction, self-perception, and environmental adaptation. Be compassionate, constructive, and strength-based in your analysis.

    HOUSE ANALYSIS:
    ${houseAnalysis}
    
    PERSON ANALYSIS:
    ${personAnalysis}
    
    TREE ANALYSIS:
    ${treeAnalysis}`;
    
    const overallResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: overallAnalysisPrompt }
      ],
      max_tokens: 1500,
    });
    
    const overallAnalysis = overallResponse.choices[0].message.content?.trim() || "";
    
    // Extract numerical scores using a separate API call for reliability
    const scoresPrompt = `Based on the following House-Person-Tree Test analyses, assign numerical scores on a scale of 1-10 (where 1 is lowest and 10 is highest) for these psychological dimensions. Only respond with a JSON object containing these four scores.

    HOUSE ANALYSIS:
    ${houseAnalysis}
    
    PERSON ANALYSIS:
    ${personAnalysis}
    
    TREE ANALYSIS:
    ${treeAnalysis}
    
    OVERALL ANALYSIS:
    ${overallAnalysis}
    
    Please provide only a JSON object with these keys:
    {
      "emotionalStability": [1-10],
      "socialInteraction": [1-10],
      "selfPerception": [1-10],
      "environmentalAdaptation": [1-10]
    }`;
    
    const scoresResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "user", content: scoresPrompt }
      ],
      max_tokens: 200,
      response_format: { type: "json_object" }
    });
    
    let scores;
    try {
      scores = JSON.parse(scoresResponse.choices[0].message.content || "{}");
    } catch (e) {
      console.error("Error parsing scores response:", e);
      scores = {
        emotionalStability: 5,
        socialInteraction: 5,
        selfPerception: 5,
        environmentalAdaptation: 5
      };
    }
    
    // Log analysis to localStorage on the client side instead of the database
    
    // Return the complete analysis
    return NextResponse.json({
      house: houseAnalysis,
      person: personAnalysis,
      tree: treeAnalysis,
      overall: overallAnalysis,
      scores
    });
  } catch (error) {
    console.error("Error in HPT analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze drawings" },
      { status: 500 }
    );
  }
}