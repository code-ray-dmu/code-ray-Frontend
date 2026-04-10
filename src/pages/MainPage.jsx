import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🔵 헤더 */}
      <header className="flex justify-between items-center px-12 py-6 bg-white shadow-sm">
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <img src="/logo.png" alt="Code-Ray" className="h-16 w-auto" />
        </div>

        <button
          onClick={() => navigate("/signup")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Sign Up
        </button>
      </header>

      {/* 🔵 히어로 */}
      <section className="px-12 py-14 pb-10 bg-gradient-to-r from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto flex items-center gap-12">
          {/* 텍스트 */}
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-5 leading-tight">
              AI-Powered Interview Assistant
            </h2>

            <p className="text-gray-500 mb-8 text-base leading-relaxed">
              Analyze GitHub repositories and generate tailored interview questions
              based on real code and architecture.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl text-base font-semibold"
            >
              Get Started
            </button>
          </div>

          {/* 이미지 */}
          <div className="flex-1 flex justify-center">
            <img
              src="/hero.png"
              alt="AI Interview"
              className="w-full max-w-md object-contain"
            />
          </div>
        </div>
      </section>

      {/* 🔵 기능 카드 */}
      <section className="px-12 mt-8 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h4 className="font-semibold text-base mb-2">🔍 GitHub Analysis</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Analyze repository structure, commit history, and coding patterns
              to understand the candidate’s real development skills.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h4 className="font-semibold text-base mb-2">🧠 AI Question Generation</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Generate personalized technical interview questions based on actual code,
              not just theoretical knowledge.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h4 className="font-semibold text-base mb-2">📊 Team Fit Evaluation</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              Evaluate candidates based on your team’s architecture, tech stack,
              and collaboration style.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}