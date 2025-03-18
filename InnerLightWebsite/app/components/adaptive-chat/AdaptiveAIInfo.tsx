"use client";

import React, { useState } from "react";
import { Info, X, Brain, MessageCircle, ThumbsUp, Zap } from "lucide-react";

export default function AdaptiveAIInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 underline mb-4"
      >
        <Info size={16} /> Learn how adaptive AI works
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Brain className="text-purple-500" /> How Adaptive AI Works
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Zap className="text-yellow-500" /> What makes this AI special?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Unlike traditional chatbots, our adaptive AI learns from your interactions 
                    and emotional responses to provide more personalized and contextually aware support.
                  </p>
                </div>

                <h3 className="font-semibold text-lg mt-4">Key Features:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                        <MessageCircle size={18} className="text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-medium">Emotion Detection</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The AI analyzes your facial expressions to detect your emotional state and 
                      adjusts its responses accordingly.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                        <Brain size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-medium">Learning System</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The AI remembers past conversations and topics you&apos;re interested in, building 
                      a personalized context over time.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full">
                        <ThumbsUp size={18} className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <h4 className="font-medium">Feedback Integration</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your feedback on responses helps the AI improve and better understand your preferences.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
                        <Zap size={18} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-medium">Topic Analysis</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The AI identifies topics important to you and retains this information for 
                      more relevant future conversations.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold mb-2">Privacy Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your emotional data and feedback are used solely to improve your personal experience.
                    The AI&apos;s learning is specific to your account and helps provide more meaningful 
                    support over time.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}