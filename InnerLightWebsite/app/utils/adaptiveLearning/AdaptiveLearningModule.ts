import { createClient } from '../supabase/client';
import { EncryptionManager, EncryptedMessage } from '../encryption/client'

interface UserInteraction {
    userId: string;
    message: string;
    detectedEmotion: string;
    responseEmotion: string;
    timestamp: string;
    feedbackScore?: number;
    contextualTags?: string[];
    sessionId: string;
}

interface EncryptedUserInteraction {
    userId: string;
    encryptedMessage: EncryptedMessage;
    encryptedEmotion: EncryptedMessage;
    encryptedResponseEmotion: EncryptedMessage;
    timestamp: string;
    feedbackScore?: number;
    encryptedContextualTags?: string[];
    sessionId: string;
}

interface EmotionalPattern {
    emotion: string;
    frequency: number;
    commonPhrases: string[];
    triggerContexts: string[];
    recommendedResponses: string[];
}

interface EncryptedEmotionalPattern {
    encryptedEmotion: EncryptedMessage;
    frequency: number;
    encryptedCommonPhrases: EncryptedMessage;
    encryptedTriggerContexts: EncryptedMessage;
    encryptedRecommendedResponses: EncryptedMessage;
}

interface UserAdaptiveProfile {
    userId: string;
    emotionalPatterns: Record<string, EmotionalPattern>;
    conversationHistory: UserInteraction[];
    preferredTones: string[];
    effectiveResponses: string[];
    sessionId: string;
}

interface EncryptedUserAdaptiveProfile {
    userId: string;
    encryptedEmotionalPatterns: EncryptedMessage;
    encryptedConversationHistory: EncryptedMessage;
    encryptedPreferredTones: EncryptedMessage;
    encryptedEffectiveResponses: EncryptedMessage;
    sessionId: string;
}

export class EncryptedAdaptiveLearningModule {
    private userProfiles: Map<string, UserAdaptiveProfile> = new Map();
    private supabase = createClient();
    private encryptionManager: EncryptionManager;
    
    constructor() {
      this.encryptionManager = new EncryptionManager();
      this.initialize();
    }
    
    private async initialize() {
      try {
        await this.encryptionManager.initialize(process.env.ENCRYPTION_PASSWORD!);
      } catch (error) {
        console.error("Failed to initialize encryption manager:", error);
      }
    }
    
    /**
     * Records a new interaction with the user and updates their adaptive profile
     * with encrypted data for privacy
     */
    async recordInteraction(interaction: UserInteraction): Promise<void> {
      try {
        // Ensure encryption manager is initialized
        if (!this.encryptionManager.getKey) {
          await this.encryptionManager.initialize(process.env.ENCRYPTION_PASSWORD!);
        }
        
        // Get or create user profile
        let userProfile = this.userProfiles.get(interaction.userId);
        
        if (!userProfile) {
          // Try to load from database first
          const { data } = await this.supabase
            .from('user_adaptive_profiles')
            .select('*')
            .eq('user_id', interaction.userId)
            .single();
            
          if (data) {
            userProfile = await this.decryptUserProfile(data.profile_data);
          } else {
            // Create new profile if none exists
            userProfile = {
              userId: interaction.userId,
              emotionalPatterns: {},
              conversationHistory: [],
              preferredTones: [],
              effectiveResponses: [],
              sessionId: interaction.timestamp // Use first interaction timestamp as session ID
            };
          }
          
          this.userProfiles.set(interaction.userId, userProfile);
        }
        
        // Add the interaction to history
        userProfile.conversationHistory.push(interaction);
        
        // Update emotional patterns
        const emotion = interaction.detectedEmotion;
        if (!userProfile.emotionalPatterns[emotion]) {
          userProfile.emotionalPatterns[emotion] = {
            emotion,
            frequency: 0,
            commonPhrases: [],
            triggerContexts: [],
            recommendedApproaches: []
          };
        }
        
        userProfile.emotionalPatterns[emotion].frequency += 1;
        
        // Extract phrases and contexts (simplified version)
        const phrases = this.extractKeyPhrases(interaction.message);
        phrases.forEach(phrase => {
          if (!userProfile!.emotionalPatterns[emotion].commonPhrases.includes(phrase)) {
            userProfile!.emotionalPatterns[emotion].commonPhrases.push(phrase);
          }
        });
        
        // Create encrypted interaction for database storage
        const encryptedInteraction = await this.encryptInteraction(interaction);
        
        // Store encrypted interaction in database
        await this.supabase.from("user_ai_interactions").insert({
          user_id: interaction.userId,
          session_id: interaction.sessionId,
          encrypted_message: JSON.stringify(encryptedInteraction.encryptedMessage),
          encrypted_emotion: JSON.stringify(encryptedInteraction.encryptedEmotion),
          encrypted_response_emotion: JSON.stringify(encryptedInteraction.encryptedResponseEmotion),
          feedback_score: interaction.feedbackScore,
          encrypted_contextual_tags: interaction.contextualTags ? 
            JSON.stringify(encryptedInteraction.encryptedContextualTags) : null,
          created_at: interaction.timestamp
        });
        
        // Periodically save to database (every 5 interactions)
        if (userProfile.conversationHistory.length % 5 === 0) {
          await this.saveUserProfile(userProfile);
        }
      } catch (error) {
        console.error('Error recording encrypted interaction:', error);
      }
    }
    
    /**
     * Provides adaptive emotional context for the AI response based on user history
     */
    async getAdaptiveContext(userId: string, currentEmotion: string): Promise<string> {
      try {
        const userProfile = this.userProfiles.get(userId);
        
        if (!userProfile) {
          return this.getDefaultContext(currentEmotion);
        }
        
        // Analyze emotional patterns and history to generate personalized context
        const emotionalPattern = userProfile.emotionalPatterns[currentEmotion];
        
        if (!emotionalPattern || emotionalPattern.frequency < 3) {
          return this.getDefaultContext(currentEmotion);
        }
        
        // Build context based on user's emotional patterns and history
        const recentResponses = userProfile.conversationHistory
          .slice(-10)
          .filter(interaction => interaction.detectedEmotion === currentEmotion);
        
        let adaptiveContext = `The user has shown ${currentEmotion} emotion ${emotionalPattern.frequency} times. `;
        
        // Add personalized approach based on what has worked before
        if (emotionalPattern.recommendedApproaches.length > 0) {
          adaptiveContext += `Previous successful approaches include: ${emotionalPattern.recommendedApproaches.join(', ')}. `;
        }
        
        // Add transition patterns if detected
        const commonTransitions = this.analyzeEmotionalTransitions(userProfile, currentEmotion);
        if (commonTransitions) {
          adaptiveContext += commonTransitions + ' ';
        }
        
        // Add specific language adaptations if needed
        if (emotionalPattern.commonPhrases.length > 0) {
          adaptiveContext += `User often expresses this emotion with phrases like: "${emotionalPattern.commonPhrases.slice(0, 3).join('", "')}". `;
        }
        
        return adaptiveContext;
      } catch (error) {
        console.error('Error getting adaptive context:', error);
        return this.getDefaultContext(currentEmotion);
      }
    }
    
    /**
     * Analyzes how the user typically transitions from one emotion to another
     */
    private analyzeEmotionalTransitions(profile: UserAdaptiveProfile, currentEmotion: string): string | null {
      const history = profile.conversationHistory;
      if (history.length < 5) return null;
      
      // Simple transition analysis - look for patterns in emotional shifts
      const transitions: Record<string, number> = {};
      
      for (let i = 1; i < history.length; i++) {
        const prevEmotion = history[i-1].detectedEmotion;
        const currEmotion = history[i].detectedEmotion;
        
        if (prevEmotion === currentEmotion) {
          const transitionKey = `${prevEmotion}->${currEmotion}`;
          transitions[transitionKey] = (transitions[transitionKey] || 0) + 1;
        }
      }
      
      // Find most common transition
      let mostCommonTransition = '';
      let maxCount = 0;
      
      Object.entries(transitions).forEach(([transition, count]) => {
        if (count > maxCount) {
          mostCommonTransition = transition;
          maxCount = count;
        }
      });
      
      if (maxCount >= 2) {
        const [from, to] = mostCommonTransition.split('->');
        return `The user often transitions from ${from} to ${to} emotions.`;
      }
      
      return null;
    }
    
    /**
     * Record user feedback to improve future responses
     */
    async recordFeedback(userId: string, interactionId: string, score: number): Promise<void> {
      try {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return;
        
        // Update feedback score in database
        await this.supabase
          .from("user_ai_interactions")
          .update({ feedback_score: score })
          .eq("id", interactionId)
          .eq("user_id", userId);
        
        // Find the interaction and update its feedback score
        const interaction = userProfile.conversationHistory.find(i => i.timestamp === interactionId);
        if (interaction) {
          interaction.feedbackScore = score;
          
          // If positive feedback, record the response approach as effective
          if (score >= 4) {
            const emotion = interaction.detectedEmotion;
            if (userProfile.emotionalPatterns[emotion]) {
              // Extract the approach used (simplified)
              const responseApproach = this.extractResponseApproach(interaction);
              
              if (responseApproach && 
                  !userProfile.emotionalPatterns[emotion].recommendedApproaches.includes(responseApproach)) {
                userProfile.emotionalPatterns[emotion].recommendedApproaches.push(responseApproach);
              }
            }
          }
          
          await this.saveUserProfile(userProfile);
        }
      } catch (error) {
        console.error('Error recording encrypted feedback:', error);
      }
    }
    
    /**
     * Save encrypted user profile to database
     */
    private async saveUserProfile(profile: UserAdaptiveProfile): Promise<void> {
      try {
        const encryptedProfile = await this.encryptUserProfile(profile);
        
        const { error } = await this.supabase
          .from('user_adaptive_profiles')
          .upsert({
            user_id: profile.userId,
            profile_data: encryptedProfile,
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      } catch (error) {
        console.error('Error saving encrypted user profile:', error);
      }
    }
    
    /**
     * Encrypt an interaction for secure storage
     */
    private async encryptInteraction(interaction: UserInteraction): Promise<EncryptedUserInteraction> {
      const encryptedMessage = await this.encryptionManager.encrypt(interaction.message);
      const encryptedEmotion = await this.encryptionManager.encrypt(interaction.detectedEmotion);
      const encryptedResponseEmotion = await this.encryptionManager.encrypt(interaction.responseEmotion);
      
      let encryptedContextualTags = undefined;
      if (interaction.contextualTags && interaction.contextualTags.length > 0) {
        encryptedContextualTags = await this.encryptionManager.encrypt(
          JSON.stringify(interaction.contextualTags)
        );
      }
      
      return {
        userId: interaction.userId,
        encryptedMessage,
        encryptedEmotion,
        encryptedResponseEmotion,
        timestamp: interaction.timestamp,
        feedbackScore: interaction.feedbackScore,
        encryptedContextualTags,
        sessionId: interaction.sessionId
      };
    }
    
    /**
     * Decrypt an interaction from secure storage
     */
    private async decryptInteraction(encryptedInteraction: EncryptedUserInteraction): Promise<UserInteraction> {
      const message = await this.encryptionManager.decrypt(encryptedInteraction.encryptedMessage);
      const detectedEmotion = await this.encryptionManager.decrypt(encryptedInteraction.encryptedEmotion);
      const responseEmotion = await this.encryptionManager.decrypt(encryptedInteraction.encryptedResponseEmotion);
      
      let contextualTags = undefined;
      if (encryptedInteraction.encryptedContextualTags) {
        const tagsString = await this.encryptionManager.decrypt(encryptedInteraction.encryptedContextualTags);
        contextualTags = JSON.parse(tagsString);
      }
      
      return {
        userId: encryptedInteraction.userId,
        message,
        detectedEmotion,
        responseEmotion,
        timestamp: encryptedInteraction.timestamp,
        feedbackScore: encryptedInteraction.feedbackScore,
        contextualTags,
        sessionId: encryptedInteraction.sessionId
      };
    }
    
    /**
     * Encrypt a user profile for secure storage
     */
    private async encryptUserProfile(profile: UserAdaptiveProfile): Promise<any> {
      // Keep only last 50 interactions to manage size
      const trimmedProfile = {
        ...profile,
        conversationHistory: profile.conversationHistory.slice(-50)
      };
      
      // Encrypt emotional patterns
      const encryptedEmotionalPatterns = await this.encryptionManager.encrypt(
        JSON.stringify(trimmedProfile.emotionalPatterns)
      );
      
      // Encrypt conversation history
      const encryptedConversationHistory = await this.encryptionManager.encrypt(
        JSON.stringify(trimmedProfile.conversationHistory)
      );
      
      // Encrypt preferred tones
      const encryptedPreferredTones = await this.encryptionManager.encrypt(
        JSON.stringify(trimmedProfile.preferredTones)
      );
      
      // Encrypt effective responses
      const encryptedEffectiveResponses = await this.encryptionManager.encrypt(
        JSON.stringify(trimmedProfile.effectiveResponses)
      );
      
      return {
        userId: profile.userId,
        encryptedEmotionalPatterns: JSON.stringify(encryptedEmotionalPatterns),
        encryptedConversationHistory: JSON.stringify(encryptedConversationHistory),
        encryptedPreferredTones: JSON.stringify(encryptedPreferredTones),
        encryptedEffectiveResponses: JSON.stringify(encryptedEffectiveResponses),
        sessionId: profile.sessionId
      };
    }
    
    /**
     * Decrypt a user profile from secure storage
     */
    private async decryptUserProfile(encryptedProfileData: any): Promise<UserAdaptiveProfile> {
      if (!encryptedProfileData) {
        throw new Error("No encrypted profile data provided");
      }
      
      try {
        // Decrypt emotional patterns
        const emotionalPatternsString = await this.encryptionManager.decrypt(
          JSON.parse(encryptedProfileData.encryptedEmotionalPatterns)
        );
        const emotionalPatterns = JSON.parse(emotionalPatternsString);
        
        // Decrypt conversation history
        const conversationHistoryString = await this.encryptionManager.decrypt(
          JSON.parse(encryptedProfileData.encryptedConversationHistory)
        );
        const conversationHistory = JSON.parse(conversationHistoryString);
        
        // Decrypt preferred tones
        const preferredTonesString = await this.encryptionManager.decrypt(
          JSON.parse(encryptedProfileData.encryptedPreferredTones)
        );
        const preferredTones = JSON.parse(preferredTonesString);
        
        // Decrypt effective responses
        const effectiveResponsesString = await this.encryptionManager.decrypt(
          JSON.parse(encryptedProfileData.encryptedEffectiveResponses)
        );
        const effectiveResponses = JSON.parse(effectiveResponsesString);
        
        return {
          userId: encryptedProfileData.userId,
          emotionalPatterns,
          conversationHistory,
          preferredTones,
          effectiveResponses,
          sessionId: encryptedProfileData.sessionId
        };
      } catch (error) {
        console.error("Error decrypting user profile:", error);
        throw new Error("Failed to decrypt user profile");
      }
    }
    
    // Helper methods
    private extractKeyPhrases(message: string): string[] {
      // Simplified implementation - in production would use NLP
      const words = message.toLowerCase().split(/\s+/);
      const phrases: string[] = [];
      
      // Extract 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        phrases.push(`${words[i]} ${words[i+1]}`);
        if (i < words.length - 2) {
          phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
        }
      }
      
      return phrases.slice(0, 5); // Return top 5 phrases
    }
    
    private extractResponseApproach(interaction: UserInteraction): string | null {
      // Simplified - would use NLP to categorize response approaches
      const approaches = [
        'validation and empathy',
        'practical advice',
        'positive reframing',
        'reflective listening',
        'gentle encouragement',
        'distraction techniques'
      ];
      
      // Dummy implementation - in production would analyze the response
      return approaches[Math.floor(Math.random() * approaches.length)];
    }
    
    private getDefaultContext(emotion: string): string {
      const defaultContexts: Record<string, string> = {
        angry: "The user seems angry or frustrated. Respond with empathy and help de-escalate the situation. Acknowledge their feelings and offer constructive support.",
        happy: "The user appears happy and positive. Match their upbeat energy while maintaining a natural conversation flow. Feel free to share in their joy.",
        sad: "The user seems sad or down. Show empathy and understanding. Offer emotional support without being overly cheerful. Listen and acknowledge their feelings.",
        neutral: "The user appears neutral. Maintain a balanced and engaged conversation while being responsive to subtle emotional cues.",
        fear: "The user shows signs of anxiety or fear. Provide reassurance and support. Help them feel safe and understood while offering practical perspectives.",
        disgust: "The user appears disgusted or disapproving. Address their concerns seriously while helping to reframe the situation constructively.",
        surprise: "The user seems surprised or taken aback. Explore their reaction with curiosity while providing steady, grounded responses."
      };
      
      return defaultContexts[emotion] || defaultContexts.neutral;
    }
}

export const encryptedAdaptiveLearningModule = new EncryptedAdaptiveLearningModule();
