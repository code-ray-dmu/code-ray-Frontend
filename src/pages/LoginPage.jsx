import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* 🔵 로그인 카드 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* 로고 */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Code-Ray"
            className="mx-auto h-14 w-auto"
          />
          <p className="text-gray-500 text-sm mt-2">
            Welcome back 👋
          </p>
        </div>

        {/* 입력 */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 로그인 버튼 */}
        <button
          className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold"
        >
          Sign In
        </button>

        {/* 하단 */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-500 cursor-pointer"
          >
            Sign up
          </span>
        </div>

        {/* 뒤로가기 */}
        <div className="text-center mt-2 text-xs text-gray-400">
          <span
            onClick={() => navigate("/")}
            className="cursor-pointer hover:underline"
          >
            ← Back to Home
          </span>
        </div>

      </div>
    </div>
  );
}
