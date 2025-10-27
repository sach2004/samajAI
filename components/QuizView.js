"use client";

import { BookOpen, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function QuizView({ transcript, language, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setQuizStarted(true);
    } catch (error) {
      console.error("Quiz error:", error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (!quizStarted && !loading) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-600" />
        <h2 className="text-2xl font-bold mb-4">Test Your Knowledge</h2>
        <p className="text-gray-600 mb-6">
          Ready to take a 5-question quiz based on this video?
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={startQuiz}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Start Quiz
          </Button>
          <Button onClick={onClose} variant="outline" size="lg">
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-600" />
        <h3 className="text-xl font-semibold">Generating Quiz Questions...</h3>
        <p className="text-gray-600 mt-2">This will take a few seconds</p>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;

    return (
      <Card className="p-8">
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-bold mb-4 ${
              percentage >= 80
                ? "text-green-600"
                : percentage >= 60
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {score}/{questions.length}
          </div>
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-gray-600">You scored {percentage.toFixed(0)}%</p>
        </div>

        <div className="space-y-4 mb-6">
          {questions.map((q, index) => {
            const userAnswer = selectedAnswers[index];
            const isCorrect = userAnswer === q.correctAnswer;

            return (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Q{index + 1}.</span>
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    </div>
                    <p className="text-gray-900 mb-2">{q.question}</p>
                    <p className="text-sm text-gray-600">
                      Your answer: <strong>{userAnswer}</strong>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600 mt-1">
                        Correct answer: <strong>{q.correctAnswer}</strong>
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button onClick={onClose} className="w-full" size="lg">
          Close Quiz
        </Button>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <Card className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
          <Badge variant="outline">{currentQ.difficulty}</Badge>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <h3 className="text-xl font-semibold mb-6">{currentQ.question}</h3>

        <div className="space-y-3 mb-6">
          {Object.entries(currentQ.options).map(([key, value]) => {
            const isSelected = selectedAnswers[currentQuestion] === key;
            return (
              <button
                key={key}
                onClick={() => handleAnswerSelect(currentQuestion, key)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                }`}
              >
                <span className="font-semibold mr-3">{key}.</span>
                {value}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {Object.keys(selectedAnswers).length}/{questions.length} answered
          </div>

          {currentQuestion < questions.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={
                Object.keys(selectedAnswers).length !== questions.length
              }
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
