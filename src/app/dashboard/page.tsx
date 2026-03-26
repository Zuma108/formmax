"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  StopCircle,
  Play,
  Plus,
  X,
  Dumbbell,
  Flame,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface FormVideo {
  id: string;
  name: string;
  exercise: string;
  date: string;
  videoUrl?: string;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<FormVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("Squat");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const exercises = [
    "Squat",
    "Deadlift",
    "Bench Press",
    "Overhead Press",
    "Pull-ups",
    "Barbell Rows",
  ];

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

        setVideos((prev) => [newVideo, ...prev]);
        stream.getTracks().forEach((track) => track.stop());
        setShowRecordModal(false);
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

  const closeModal = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowRecordModal(false);
  };

  const stats = [
    {
      label: "Workouts",
      value: videos.length,
      icon: Dumbbell,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "This Week",
      value: videos.filter((v) => {
        const videoDate = new Date(v.date);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return videoDate >= weekAgo;
      }).length,
      icon: Calendar,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Streak",
      value: (() => {
        if (videos.length === 0) return 0;
        const uniqueDays = [
          ...new Set(videos.map((v) => v.date)),
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        let streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = new Date(uniqueDays[i - 1]);
          const curr = new Date(uniqueDays[i]);
          const diffMs = prev.getTime() - curr.getTime();
          if (diffMs <= 86400000) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      })(),
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Exercises",
      value: new Set(videos.map((v) => v.exercise)).size,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#0A0A0B] dark:to-[#1A1A1F] p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E1A24] dark:text-white mb-1">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your form and improve every rep
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm"
            >
              <div
                className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-[#1E1A24] dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Recordings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1E1A24] dark:text-white mb-4">
            Recent Recordings
          </h2>

          {videos.length > 0 ? (
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
          ) : (
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <Camera className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No recordings yet
              </h3>
              <p className="text-gray-400 dark:text-gray-500 mb-6 max-w-sm mx-auto">
                Tap the + button to record your first workout and get
                AI-powered form feedback
              </p>
              <button
                onClick={() => setShowRecordModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Record Workout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Plus Button */}
      <button
        onClick={() => setShowRecordModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-110 z-50"
        aria-label="Record workout"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Recording Modal */}
      <AnimatePresence>
        {showRecordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isRecording) closeModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-[#1A1A1F] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-[#1E1A24] dark:text-white">
                  Record Workout
                </h2>
                <button
                  onClick={closeModal}
                  disabled={isRecording}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Video Preview */}
                <div className="flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden h-64 mb-6">
                  {isRecording ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Camera className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm">
                        Camera preview will appear here
                      </p>
                    </div>
                  )}
                </div>

                {/* Exercise Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Select Exercise
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Make sure you&apos;re in a well-lit area and your form is
                  fully visible in the frame.
                </p>

                {/* Record Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] ${
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
