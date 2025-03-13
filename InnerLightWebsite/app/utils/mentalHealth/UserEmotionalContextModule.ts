// app/utils/mentalHealth/UserEmotionalContextModule.ts
import { createClient } from "../supabase/client";
import { encryptedAdaptiveLearningModule } from "../adaptiveLearning/AdaptiveLearningModule";

/**
 * This module enhances the AI's understanding of user emotional states
 * based on psychological principles for more effective responses
 */

interface EmotionalState {
  primaryEmotion: string;
  intensity: number; // 0-10
  secondaryEmotions?: string[];
  triggers?: string[];
  duration?: number; // How long emotion has persisted
  changePattern?: string; // Increasing, decreasing, fluctuating
}

interface CopingStrategy {
  name: string;
  description: string;
  appropriateFor: string[]; // Emotions this works best for
  technique: string;
  effectiveness: number; // 0-10 based on feedback
}

interface EmotionalContextResponse {
  customPrompt: string;
  suggestedApproach: string;
  copingStrategies?: CopingStrategy[];
  professionalConsiderations?: string[];
}

export class UserEmotionalContextModule {
  private supabase = createClient();
  private copingStrategies: CopingStrategy[] = [];
  
  constructor() {
    this.initializeCopingStrategies();
  }
  
  /**
   * Initialize evidence-based coping strategies from psychological research
   */
  private initializeCopingStrategies() {
    this.copingStrategies = [
      {
        name: "Cognitive reframing",
        description: "Identifying negative thought patterns and replacing them with more balanced perspectives",
        appropriateFor: ["anxiety", "fear", "sad", "angry"],
        technique: "Gently encourage identifying negative thoughts and exploring alternative viewpoints",
        effectiveness: 8
      },
      {
        name: "Mindful validation",
        description: "Acknowledging feelings without judgment and accepting them as valid experiences",
        appropriateFor: ["sad", "angry", "fear", "disgust"],
        technique: "Acknowledge the emotion directly and validate its presence without trying to change it immediately",
        effectiveness: 9
      },
      {
        name: "Gratitude practice",
        description: "Shifting focus to positive aspects of life and expressing appreciation",
        appropriateFor: ["sad", "neutral", "happy"],
        technique: "Gently guide toward identifying small positive elements without dismissing negative feelings",
        effectiveness: 7
      },
      {
        name: "Emotional acceptance",
        description: "Allowing emotions to exist without trying to change or fight them",
        appropriateFor: ["sad", "fear", "disgust", "angry"],
        technique: "Encourage sitting with feelings without judgment, recognizing emotions as temporary states",
        effectiveness: 8
      },
      {
        name: "Positive social engagement",
        description: "Connecting with others in meaningful ways",
        appropriateFor: ["happy", "neutral", "sad"],
        technique: "Suggest ways to connect with others or reflect on positive social interactions",
        effectiveness: 8
      },
      {
        name: "Reflective listening",
        description: "Mirroring and validating the user's expressed emotions",
        appropriateFor: ["angry", "sad", "fear", "surprise"],
        technique: "Paraphrase user concerns to show understanding before suggesting any action",
        effectiveness: 9
      },
      {
        name: "Creative expression",
        description: "Using art, writing, or other creative outlets to process emotions",
        appropriateFor: ["sad", "angry", "happy", "fear"],
        technique: "Suggest artistic expression as a way to explore and externalize feelings",
        effectiveness: 8
      }
    ];
  }
  
  /**
   * Generate a psychologically-informed emotional context for AI responses
   */
  async generateEmotionalContext(
    userId: string, 
    currentEmotion: string, 
    messageContent: string,
    emotionHistory: {emotion: string, timestamp: string}[]
  ): Promise<EmotionalContextResponse> {
    try {
      // Get adaptive learning context for this user
      const adaptiveContext = await encryptedAdaptiveLearningModule.getAdaptiveContext(
        userId, 
        currentEmotion
      );
      
      // Analyze emotional state more deeply
      const emotionalState = this.analyzeEmotionalState(
        currentEmotion,
        messageContent,
        emotionHistory
      );
      
      // Get recommended coping strategies
      const relevantStrategies = this.getRelevantCopingStrategies(
        emotionalState
      );
      
      // Build enhanced prompt based on psychological principles
      const customPrompt = this.buildPsychologicallyInformedPrompt(
        emotionalState,
        adaptiveContext,
        relevantStrategies
      );
      
      // Identify best approach based on emotion and contextual factors
      const suggestedApproach = this.suggestResponseApproach(
        emotionalState,
        relevantStrategies
      );
      
      // Check if additional professional considerations are needed
      const professionalConsiderations = this.getProfessionalConsiderations(
        emotionalState,
        emotionHistory
      );
      
      return {
        customPrompt,
        suggestedApproach,
        copingStrategies: relevantStrategies,
        professionalConsiderations
      };
    } catch (error) {
      console.error('Error generating emotional context:', error);
      // Fallback to basic response
      return {
        customPrompt: adaptiveContext || this.getDefaultPrompt(currentEmotion),
        suggestedApproach: "Empathetic listening"
      };
    }
  }
  
  /**
   * Analyze the user's emotional state in more depth
   */
  private analyzeEmotionalState(
    currentEmotion: string,
    messageContent: string,
    emotionHistory: {emotion: string, timestamp: string}[]
  ): EmotionalState {
    // Calculate emotion intensity (simplified implementation)
    const intensityIndicators = [
      "extremely", "very", "really", "so", "incredibly", 
      "terribly", "absolutely", "completely", "utterly"
    ];
    const containsIntensifier = intensityIndicators.some(word => 
      messageContent.toLowerCase().includes(word)
    );
    
    // Calculate basic intensity
    let intensity = containsIntensifier ? 8 : 5;
    
    // Adjust intensity based on repetition patterns
    const recentEmotions = emotionHistory.slice(-5).map(e => e.emotion);
    const emotionCount = recentEmotions.filter(e => e === currentEmotion).length;
    if (emotionCount >= 3) {
      intensity += 1; // Persistent emotion increases intensity
    }
    
    // Identify change pattern
    let changePattern: string | undefined;
    if (emotionHistory.length >= 5) {
      const previousEmotions = emotionHistory.slice(-5).map(e => e.emotion);
      const isIncreasing = previousEmotions.every((e, i, arr) => 
        i === 0 || e === currentEmotion || e === arr[i-1]
      );
      const isDecreasing = previousEmotions.reverse().every((e, i, arr) => 
        i === 0 || e === currentEmotion || e === arr[i-1]
      );
      
      if (isIncreasing) changePattern = "increasing";
      else if (isDecreasing) changePattern = "decreasing";
      else changePattern = "fluctuating";
    }
    
    // Identify potential secondary emotions (simplified)
    const secondaryEmotionMap: Record<string, string[]> = {
      "angry": ["frustrated", "disappointed", "hurt"],
      "sad": ["grief", "disappointed", "lonely"],
      "fear": ["anxious", "worried", "insecure"],
      "happy": ["content", "excited", "grateful"],
      "surprise": ["confused", "curious", "uncertain"],
      "disgust": ["disapproval", "dislike", "aversion"],
      "neutral": ["calm", "contemplative", "reserved"]
    };
    
    return {
      primaryEmotion: currentEmotion,
      intensity,
      secondaryEmotions: secondaryEmotionMap[currentEmotion] || [],
      changePattern,
      duration: emotionCount
    };
  }
  
  /**
   * Get relevant coping strategies based on emotional state
   */
  private getRelevantCopingStrategies(emotionalState: EmotionalState): CopingStrategy[] {
    return this.copingStrategies
      .filter(strategy => 
        strategy.appropriateFor.includes(emotionalState.primaryEmotion)
      )
      // Sort by effectiveness
      .sort((a, b) => b.effectiveness - a.effectiveness)
      // Take top 3
      .slice(0, 3);
  }
  
  /**
   * Build a psychologically-informed prompt for AI
   */
  private buildPsychologicallyInformedPrompt(
    emotionalState: EmotionalState,
    adaptiveContext: string,
    strategies: CopingStrategy[]
  ): string {
    // Start with adaptive context as base
    let prompt = adaptiveContext + " ";
    
    // Add psychological depth based on emotional intensity
    if (emotionalState.intensity >= 8) {
      prompt += "The user is expressing high emotional intensity. Prioritize validation before problem-solving. ";
    } else if (emotionalState.intensity <= 3) {
      prompt += "The user's emotional expression is subtle. Acknowledge the emotion while being conversational. ";
    }
    
    // Add context about emotional change patterns
    if (emotionalState.changePattern === "increasing") {
      prompt += "The user's emotional intensity appears to be escalating across messages. Provide extra validation and support. ";
    } else if (emotionalState.changePattern === "decreasing") {
      prompt += "The user's emotional intensity appears to be diminishing. Continue supporting this positive trajectory. ";
    } else if (emotionalState.changePattern === "fluctuating") {
      prompt += "The user's emotions have been fluctuating. Maintain consistency in your supportive approach. ";
    }
    
    // Add insights from psychological strategies
    if (strategies.length > 0) {
      prompt += `Consider using the "${strategies[0].name}" approach: ${strategies[0].technique}. `;
      
      if (strategies.length > 1) {
        prompt += `Alternatively, a "${strategies[1].name}" approach may also be effective. `;
      }
    }
    
    // Add reminders about therapeutic boundaries
    prompt += "Remember that you are a supportive companion, not a therapist. Keep responses supportive, but avoid clinical diagnoses or treatment plans. ";
    
    return prompt;
  }
  
  /**
   * Suggest best response approach based on emotional context
   */
  private suggestResponseApproach(
    emotionalState: EmotionalState, 
    strategies: CopingStrategy[]
  ): string {
    // If we have strategies, recommend the top one
    if (strategies.length > 0) {
      return strategies[0].technique;
    }
    
    // Fallback approaches based on emotion and intensity
    if (emotionalState.intensity >= 8) {
      return "Use validation and normalization: 'It makes sense you would feel this way, and many people have similar experiences.'";
    } else if (emotionalState.primaryEmotion === "happy") {
      return "Use celebration and amplification: 'That's wonderful to hear! What aspect of this brings you the most joy?'";
    } else if (emotionalState.primaryEmotion === "fear" || emotionalState.primaryEmotion === "anxiety") {
      return "Use grounding and reassurance: 'This feeling is temporary, and you have resources to handle this situation.'";
    }
    
    return "Use reflective listening: Paraphrase the user's feelings to show understanding before responding further.";
  }
  
  /**
   * Check if there are any professional considerations to note
   */
  private getProfessionalConsiderations(
    emotionalState: EmotionalState,
    emotionHistory: {emotion: string, timestamp: string}[]
  ): string[] | undefined {
    const considerations: string[] = [];
    
    // Check for persistent negative emotions
    const negativeEmotions = ["sad", "angry", "fear", "disgust"];
    const recentEmotions = emotionHistory.slice(-10);
    const negativeCount = recentEmotions.filter(e => 
      negativeEmotions.includes(e.emotion)
    ).length;
    
    if (negativeCount >= 8 && emotionalState.intensity >= 7) {
      considerations.push(
        "User has shown persistent negative emotions with high intensity. " +
        "Remember to be supportive while acknowledging your limitations as an AI companion."
      );
    }
    
    // Caution about offering advice for severe emotional states
    if (emotionalState.intensity >= 9) {
      considerations.push(
        "User is expressing extremely intense emotions. Focus on validation and " +
        "supportive presence rather than solutions or advice."
      );
    }
    
    return considerations.length > 0 ? considerations : undefined;
  }
  
  /**
   * Default prompt if other methods fail
   */
  private getDefaultPrompt(emotion: string): string {
    const defaultPrompts: Record<string, string> = {
      "angry": "The user seems frustrated. Respond with validation and calm understanding without minimizing their feelings.",
      "sad": "The user appears to feel down. Respond with empathy and gentle support.",
      "happy": "The user is in a positive state. Match their positive energy while being authentic.",
      "fear": "The user seems anxious. Provide a sense of calm presence and support.",
      "surprise": "The user is surprised. Acknowledge this reaction and explore it with curiosity.",
      "disgust": "The user seems bothered or repelled by something. Take their perspective seriously.",
      "neutral": "Engage with the user in a balanced, attentive way while being responsive to emotional cues."
    };
    
    return defaultPrompts[emotion] || defaultPrompts.neutral;
  }
}

export const userEmotionalContextModule = new UserEmotionalContextModule();