import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "../../utils/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Interface for detected topics
interface DetectedTopic {
    topic: string;
    frequency: number;
}

export async function POST(request: Request) {
    try {
        const { messages, emotion, emotionalContext, userId } = await request.json();

        console.log("Number of messages received:", messages.length);

        // Validate required fields
        if (!messages || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Fetch user context from the database
        const { data: contextData } = await supabase
            .from('user_context')
            .select('context')
            .eq('user_id', userId)
            .single();

        // Fetch user's detected topics
        const { data: topicsData } = await supabase
            .from('detected_topics')
            .select('topic, frequency')
            .eq('user_id', userId)
            .order('frequency', { ascending: false })
            .limit(5);

        // Create personalized context section
        let personalizedContext = emotionalContext || '';
        
        if (contextData?.context) {
            // Add user preferences to the context
            // @ts-ignore
            if (contextData.context.preferences) {
                // @ts-ignore
                personalizedContext += `\nUser preferences: ${JSON.stringify(contextData.context.preferences)}`;
            }
            
            // Add conversation history notes
            // @ts-ignore
            if (contextData.context.conversationNotes) {
                // @ts-ignore
                personalizedContext += `\nPrevious conversation context: ${contextData.context.conversationNotes}`;
            }
        }

        console.log("Personalized context:", personalizedContext);

        // Add topics of interest if available
        if (topicsData && topicsData.length > 0) {
            const topicsString = topicsData.map((t: DetectedTopic) => t.topic).join(", ");
            personalizedContext += `\nUser's topics of interest: ${topicsString}`;
        }

        // Prepare system message
        const systemMessage = {
            role: "system",
            content: `You are an empathetic AI assistant that adapts its responses based on the user's emotional state and personal context. 
                     ${personalizedContext}
                     Maintain a natural, conversational tone while being mindful of the user's emotional state.
                     Keep responses concise (2-3 sentences) but meaningful.
                     If appropriate, gently guide the conversation toward positive or constructive topics.`
        };

        // Call OpenAI API with full context
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                systemMessage,
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        // Get the latest user message for topic analysis
        const latestUserMessage = messages.find((m: any) => m.role === "user");
        const userMessageContent = latestUserMessage?.content;

        // Analyze message for topics (simplified detection)
        if (userMessageContent && typeof userMessageContent === 'string' && userMessageContent.length > 10) {
            try {
                // Request topic detection from OpenAI
                const topicAnalysis = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "Extract 1-3 main topics from this message. Respond with ONLY the topics as a comma-separated list. Keep topics simple and general (single words or short phrases)."
                        },
                        {
                            role: "user", 
                            content: userMessageContent
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 50,
                });

                const topicsText = topicAnalysis.choices[0].message.content?.trim();
                
                if (topicsText) {
                    const topics = topicsText.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
                    
                    // Upsert detected topics
                    for (const topic of topics) {
                        // Check if topic exists
                        const { data: existingTopic } = await supabase
                            .from('detected_topics')
                            .select('id, frequency')
                            .eq('user_id', userId)
                            .eq('topic', topic)
                            .single();

                        if (existingTopic) {
                            // Update existing topic
                            await supabase
                                .from('detected_topics')
                                .update({ 
                                    frequency: existingTopic.frequency + 1,
                                    last_detected: new Date().toISOString()
                                })
                                .eq('id', existingTopic.id);
                        } else {
                            // Insert new topic
                            await supabase
                                .from('detected_topics')
                                .insert({
                                    user_id: userId,
                                    topic: topic,
                                    frequency: 1
                                });
                        }
                    }
                }
            } catch (topicError) {
                console.error("Error analyzing topics:", topicError);
                // Non-critical error, continue without topic analysis
            }
        }

        // Update context with conversation summary if needed
        // This would ideally happen periodically or after significant conversations
        if (messages.length > 5) {
            try {
                // Every few messages, update the conversation context
                const contextUpdate = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "Summarize the key points, preferences, and context from this conversation that would be helpful for future interactions. Be concise."
                        },
                        ...messages
                    ],
                    temperature: 0.5,
                    max_tokens: 100,
                });

                console.log(contextUpdate.choices[0].message.content);

                const conversationNotes = contextUpdate.choices[0].message.content?.trim();
                
                if (conversationNotes) {
                    // Upsert to user_context
                    const { data: existingContext } = await supabase
                        .from('user_context')
                        .select('context')
                        .eq('user_id', userId)
                        .single();
                    
                    if (existingContext) {
                        const context = existingContext.context as { [key: string]: any };
                        const updatedContext = {
                            ...context,
                            conversationNotes
                        };
                        
                        await supabase
                            .from('user_context')
                            .update({ context: updatedContext })
                            .eq('user_id', userId);
                    } else {
                        await supabase
                            .from('user_context')
                            .insert({
                                user_id: userId,
                                context: { conversationNotes }
                            });
                    }
                }
            } catch (contextError) {
                console.error("Error updating context:", contextError);
                // Non-critical error, continue without context update
            }
        }

        return NextResponse.json({
            response: completion.choices[0].message.content?.trim(),
            emotion,
            messageId: completion.id // Include the message ID for feedback
        });
    } catch (error) {
        console.error("OpenAI request error:", error);
        return NextResponse.json(
            {
                error: "OpenAI request error",
            },
            { status: 500 }
        );
    }
}