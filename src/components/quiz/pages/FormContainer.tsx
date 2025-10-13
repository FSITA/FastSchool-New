"use client";

import { useFormStore } from "@/states/quiz/form";
import Form from "./Form";
import Loading from "@/components/quiz/shared/Loading";
import { useState } from "react";
import { useQuizStore } from "@/states/quiz/quiz";
import FormField from "./FormField";
import QuizDisplay from "./QuizDisplay";
import QuizForm from "./QuizForm";

export default function FormContainer() {
  const { status, setStatus, universalFormData, setUniversalFormData } = useFormStore();
  const { quizzes, addQuiz, reset } = useQuizStore();
  const [formStep, setFormStep] = useState(0);

  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUniversalFormData(formData);
    setFormStep(1);
  }

  async function generateQuiz(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("streaming");
    reset(); // clear old quizzes
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    if (universalFormData) {
      universalFormData.forEach((value, key) => {
        formData.append(key, value);
      });
    }
    
    const step = formData.get("step");

    if (step === "0") {
      formData.delete("files");
      formData.delete("youtubeUrl");
      formData.delete("wikipediaLink");
    } else if (step === "1") {
      formData.delete("notes");
      formData.delete("youtubeUrl");
      formData.delete("wikipediaLink");
    } else if (step === "2") {
      formData.delete("notes");
      formData.delete("files");
      formData.delete("wikipediaLink");
    } else if (step === "3") {
      formData.delete("notes");
      formData.delete("files");
      formData.delete("youtubeUrl");
    }

    try {
      console.log("Sending request to generate quiz");
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }

      if (!res.body) {
        setStatus("done");
        return;
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // If stream closed without done event, mark done.
          setStatus("done");
          break;
        }

        buffer += value;

        // SSE events are separated by a blank line (\n\n)
        const events = buffer.split("\n\n");
        // keep the last partial event in buffer
        buffer = events.pop() || "";

        for (const eventText of events) {
          const lines = eventText.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) continue;

          // Check for 'event:' lines (e.g., event: done)
          const eventLine = lines.find((l) => l.startsWith("event:"));
          if (eventLine) {
            const evt = eventLine.replace(/^event:\s*/, "").trim();
            if (evt === "done") {
              // optional data line after event: done may contain final summary
              setStatus("done");
              continue;
            }
          }

          // Collect data: lines (there might be multiple, concatenate with \n)
          const dataLines = lines.filter((l) => l.startsWith("data:"));
          if (dataLines.length === 0) continue;

          const combinedData = dataLines
            .map((l) => l.replace(/^data:\s*/, ""))
            .join("\n")
            .trim();

          if (!combinedData) continue;

          try {
            const parsed = JSON.parse(combinedData);
            // parsed has shape { type: 'quiz'|'chunk_error'|'error', payload? }
            if (parsed.type === "quiz" && parsed.payload) {
              addQuiz(parsed.payload);
            } else if (parsed.type === "chunk_error") {
              console.warn("Server chunk error:", parsed.message);
              // Optionally you can show a small non-fatal UI notice
            } else if (parsed.type === "error") {
              console.error("Server error:", parsed.message);
              setErrorMessage(parsed.message || "Server returned an error.");
              reset();
              setStatus("idle");
              return;
            } else {
              // Unknown type - ignore or log
              console.warn("Unknown event type received:", parsed);
            }
          } catch (err) {
            console.error("Chunk parse error:", err, combinedData);
            // skip and continue streaming
          }
        }
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      setErrorMessage(
        error instanceof Error
          ? `Error generating quizzes: ${error.message}`
          : "Error generating quizzes, try again!"
      );
      reset();
      setStatus("idle");
    }
  }

  return (
    <section>
      {status === "idle" && formStep === 0 && <Form onSubmit={handleNext} />}
      {status === "idle" && formStep === 1 && <QuizForm onSubmit={generateQuiz} />}

      {(status === "streaming" || status === "done") && (
        <FormField>
          <h2 className="text-xl font-bold text-center mb-8">
            {status === "streaming" && quizzes.length === 0 ? "Generating Quiz..." : "Generated Quizzes"}
          </h2>
          <QuizDisplay />
          {status === "streaming" && <Loading />}
        </FormField>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
          <p className="mt-2 text-sm">
            <a href="/api/quiz/debug" target="_blank" className="underline">
              Check API configuration
            </a>{" "}
            or
            <a
              href="/api/quiz/test-gemini"
              target="_blank"
              className="underline ml-1"
            >
              Test Gemini API
            </a>
          </p>
        </div>
      )}

      {status === "done" && (
        <div className="flex justify-center mt-8 mb-16">
          <button
            onClick={() => {
              setStatus("idle");
              setFormStep(0);
            }}
            className="font-geistmono font-semibold tracking-widest bg-gray-900 hover:bg-gray-800 duration-200 text-white rounded-full px-6 py-3"
          >
            Generate New Quiz
          </button>
        </div>
      )}
    </section>
  );

}
