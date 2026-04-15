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
          회원가입
        </button>
      </header>

      {/* 🔵 히어로 */}
      <section className="px-12 py-14 pb-10 bg-gradient-to-r from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto flex items-center gap-12">
          {/* 텍스트 */}
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-5 leading-tight">
              AI 기반 면접 보조 도구
            </h2>

            <p className="text-gray-500 mb-8 text-base leading-relaxed">
              GitHub 저장소를 분석해 실제 코드와 아키텍처를 바탕으로
              맞춤형 면접 질문을 생성합니다.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl text-base font-semibold"
            >
              시작하기
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
            <h4 className="font-semibold text-base mb-2">🔍 GitHub 분석</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              저장소 구조, 커밋 히스토리, 코딩 패턴을 분석해
              지원자의 실제 개발 역량을 파악합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h4 className="font-semibold text-base mb-2">🧠 AI 질문 생성</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              이론 중심이 아니라 실제 코드 기반으로
              개인화된 기술 면접 질문을 생성합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
            <h4 className="font-semibold text-base mb-2">📊 팀 적합도 평가</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              우리 팀의 아키텍처, 기술 스택, 협업 방식에 맞춰
              지원자를 입체적으로 평가할 수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
