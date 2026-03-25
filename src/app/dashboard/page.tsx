"use client";

import { useState } from "react";
import { useRef } from "react";
import { Camera, StopCircle, Upload, Play } from "lucide-react";

interface FormVideo {
  id: string;
  name: string;
  exercise: string;
  date: string;
  videoUrl?: string;
  thumbnail?: string;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<FormVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("Squat");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const exercises = ["Squat", "Deadlift", "Bench Press", "Overhead Press", "Pull-ups", "Barbell Rows"];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        const newVideo: FormVideo = {
          id: Date.now().toString(),
          name: `${selectedExercise} - ${new Date().toLocaleTimeString()}`,
          exercise: selectedExercise,
          date: new Date().toLocaleDateString(),
          videoUrl: url,
        };

        setVideos([newVideo, ...videos]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#0A0A0B] dark:to-[#1A1A1F] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1E1A24] dark:text-white mb-2">
            Form Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Record your lifting form and get AI-powered feedback
          </p>
        </div>

        {/* Recording Section */}
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <div className="flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden h-80">
              {isRecording ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Camera className="w-12 h-12 mb-4 opacity-50" />
                  <p>Camera preview will appear here</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1E1A24] dark:text-white mb-6">
                  Start Recording
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Select Exercise
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {exercises.map((exercise) => (
                      <button
                        key={exercise}
                        onClick={() => setSelectedExercise(exercise)}
                        disabled={isRecording}
                        className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                          selectedExercise === exercise
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {exercise}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Make sure you're in a well-lit area and your form is fully visible in the frame.
                </p>
              </div>

              {/* Record Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isRecording ? (
                  <>
                    <StopCircle className="w-6 h-6" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    Start Recording
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Videos List */}
        {videos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#1E1A24] dark:text-white mb-6">
              Your Recordings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white dark:bg-[#1A1A1F] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-black h-40 flex items-center justify-center relative group cursor-pointer">
                    {video.videoUrl && (
                      <>
                        <video
                          src={video.videoUrl}
                          className="w-full h-full object-cover opacity-40"
                        />
                        <Play className="w-12 h-12 text-white absolute group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1E1A24] dark:text-white mb-1">
                      {video.exercise}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {video.date}
                    </p>
                    <button className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm">
                      View Analysis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {videos.length === 0 && (
          <div className="text-center py-12">
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No recordings yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Start recording your form and the AI will provide detailed feedback
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
