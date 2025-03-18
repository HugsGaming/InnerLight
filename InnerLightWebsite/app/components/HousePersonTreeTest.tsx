"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Loader2, Save, Home, User, Palmtree, RefreshCw, ArrowRight } from "lucide-react";
import { marked } from "marked";

enum DrawingStage {
  HOUSE = "house",
  PERSON = "person",
  TREE = "tree",
  ANALYSIS = "analysis",
}

interface AnalysisResult {
  house: string;
  person: string;
  tree: string;
  overall: string;
  scores: {
    emotionalStability: number;
    socialInteraction: number;
    selfPerception: number;
    environmentalAdaptation: number;
  };
}

const HousePersonTreeTest: React.FC = () => {

    const formatMarkdown = (text:string) => {
        if (!text) return "";
        try {
            return marked(text);
        } catch (error) {
            console.error("Error formatting markdown:", error);
            return text;
        }
    }

  const [currentStage, setCurrentStage] = useState<DrawingStage>(DrawingStage.HOUSE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drawings, setDrawings] = useState<{ [key in DrawingStage]?: string }>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [sessionId] = useState(() => uuidv4());
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [instructions, setInstructions] = useState("");
  
  const supabase = createClient();
  const router = useRouter();

  // Set instructions based on current stage
  useEffect(() => {
    switch (currentStage) {
      case DrawingStage.HOUSE:
        setInstructions("Draw a house. This can be any type of house you imagine.");
        break;
      case DrawingStage.PERSON:
        setInstructions("Draw a person. This can be anyone you wish to represent.");
        break;
      case DrawingStage.TREE:
        setInstructions("Draw a tree. Any type of tree that comes to mind.");
        break;
      case DrawingStage.ANALYSIS:
        setInstructions("Analyzing your drawings to generate insights...");
        break;
    }
  }, [currentStage]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    contextRef.current = context;
    
    // Clear canvas when stage changes
    if (currentStage !== DrawingStage.ANALYSIS) {
      context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    }
  }, [currentStage]);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentStage === DrawingStage.ANALYSIS) return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentStage === DrawingStage.ANALYSIS) return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (currentStage === DrawingStage.ANALYSIS) return;
    
    contextRef.current?.closePath();
    setIsDrawing(false);
    
    // Save the drawing from canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const drawingDataUrl = canvas.toDataURL("image/png");
      setDrawings(prev => ({
        ...prev,
        [currentStage]: drawingDataUrl
      }));
    }
  };

  const clearCanvas = () => {
    if (currentStage === DrawingStage.ANALYSIS) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      // Remove the current drawing from state
      const updatedDrawings = { ...drawings };
      delete updatedDrawings[currentStage];
      setDrawings(updatedDrawings);
    }
  };

  const moveToNextStage = async () => {
    if (!drawings[currentStage]) {
      toast.warning("Please complete your drawing before continuing");
      return;
    }
    
    switch (currentStage) {
      case DrawingStage.HOUSE:
        setCurrentStage(DrawingStage.PERSON);
        break;
      case DrawingStage.PERSON:
        setCurrentStage(DrawingStage.TREE);
        break;
      case DrawingStage.TREE:
        setCurrentStage(DrawingStage.ANALYSIS);
        await analyzeDrawings();
        break;
    }
  };

  const analyzeDrawings = async () => {
    setIsAnalyzing(true);
    
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Save drawings to Supabase storage
      const drawingPaths = await Promise.all(
        Object.entries(drawings).map(async ([stage, dataUrl]) => {
          try {
            // Convert base64 data URL to blob
            const base64Response = await fetch(dataUrl);
            const blob = await base64Response.blob();
            
            const filePath = `${user.id}/${sessionId}/${stage}.png`;
            
            const { data, error } = await supabase.storage
              .from("htp-test-drawings")
              .upload(filePath, blob, { 
                contentType: 'image/png', 
                upsert: true 
              });
            
            if (error) {
              console.error(`Error uploading ${stage} drawing:`, error);
              throw error;
            }
            
            console.log(`Successfully uploaded ${stage} drawing:`, data);
            return { stage, path: data?.path || filePath };
          } catch (error) {
            console.error(`Error processing ${stage} drawing:`, error);
            // Fallback approach - store the data URL directly in the request
            return { stage, dataUrl };
          }
        })
      );

      console.log("Drawing Paths:", drawingPaths);

      // Send to API for analysis
      const response = await fetch("/api/analyze-hpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          sessionId,
          drawings: drawingPaths
        })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze drawings");
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      // Save results to database
      await supabase.from("hpt_test_results").insert({
        user_id: user.id,
        session_id: sessionId,
        house_analysis: result.house,
        person_analysis: result.person,
        tree_analysis: result.tree,
        overall_analysis: result.overall,
        emotional_stability_score: result.scores.emotionalStability,
        social_interaction_score: result.scores.socialInteraction,
        self_perception_score: result.scores.selfPerception,
        environmental_adaptation_score: result.scores.environmentalAdaptation
      });

    } catch (error) {
      console.error("Error analyzing drawings:", error);
      toast.error("Error analyzing drawings. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">
        House-Person-Tree Psychological Test
      </h1>
      
      <div className="mb-6 text-center">
        {currentStage === DrawingStage.ANALYSIS ? (
          <p className="text-lg text-green-600 dark:text-green-400">Analysis Complete</p>
        ) : (
          <p className="text-lg text-blue-600 dark:text-blue-400">
            Step {currentStage === DrawingStage.HOUSE ? "1/3" : currentStage === DrawingStage.PERSON ? "2/3" : "3/3"}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-300">{instructions}</p>
      </div>

      {currentStage !== DrawingStage.ANALYSIS ? (
        <>
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg mb-4">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-96 bg-white rounded-lg cursor-crosshair"
            />
            <div className="absolute top-2 left-2 flex space-x-2">
              {currentStage === DrawingStage.HOUSE && (
                <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                  <Home className="h-5 w-5 text-yellow-600 dark:text-yellow-200" />
                </div>
              )}
              {currentStage === DrawingStage.PERSON && (
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                </div>
              )}
              {currentStage === DrawingStage.TREE && (
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                  <Palmtree className="h-5 w-5 text-green-600 dark:text-green-200" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={clearCanvas}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={moveToNextStage}
              disabled={!drawings[currentStage]}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                drawings[currentStage]
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {currentStage === DrawingStage.TREE ? "Analyze" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p>Analyzing your drawings...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {Object.entries(drawings).map(([stage, dataUrl]) => (
                  <div key={stage} className="w-64">
                    <h3 className="text-center font-medium mb-2 capitalize">{stage}</h3>
                    <img 
                      src={dataUrl} 
                      alt={`${stage} drawing`} 
                      className="border border-gray-300 dark:border-gray-600 rounded" 
                    />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Home className="h-5 w-5 text-yellow-500" />
                    House Analysis
                  </h3>
                  <div 
                    className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(analysisResult.house) }}
                  />
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Person Analysis
                  </h3>
                  <div
                    className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(analysisResult.person) }}
                  />
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Palmtree className="h-5 w-5 text-green-500" />
                    Tree Analysis
                  </h3>
                  <div
                    className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(analysisResult.tree) }}
                  />
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2">Psychological Profile</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Emotional Stability</span>
                        <span>{analysisResult.scores.emotionalStability}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${analysisResult.scores.emotionalStability * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Social Interaction</span>
                        <span>{analysisResult.scores.socialInteraction}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${analysisResult.scores.socialInteraction * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Self Perception</span>
                        <span>{analysisResult.scores.selfPerception}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${analysisResult.scores.selfPerception * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Environmental Adaptation</span>
                        <span>{analysisResult.scores.environmentalAdaptation}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${analysisResult.scores.environmentalAdaptation * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
                <h3 className="font-bold text-xl mb-4">Overall Interpretation</h3>
                <div
                  className="text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(analysisResult.overall) }}
                />
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 my-6 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      <strong>Important Disclaimer:</strong> This analysis is generated by artificial intelligence and should not be considered a professional psychological assessment. The interpretations are speculative and should not be used for clinical or diagnostic purposes. For professional psychological evaluation, please consult with a licensed mental health professional.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => {
                    setCurrentStage(DrawingStage.HOUSE);
                    setDrawings({});
                    setAnalysisResult(null);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Start New Test
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p>Failed to generate analysis. Please try again.</p>
              <button 
                onClick={() => setCurrentStage(DrawingStage.HOUSE)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mt-4"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HousePersonTreeTest;