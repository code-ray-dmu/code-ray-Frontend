import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCheckMessage, setEmailCheckMessage] = useState("");
  const [isEmailChecked, setIsEmailChecked] = useState(false);

  const takenEmails = ["admin@code-ray.com", "test@code-ray.com", "demo@code-ray.com"];

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setIsEmailChecked(false);
    setEmailCheckMessage("");
  };

  const handleEmailDuplicateCheck = () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setIsEmailChecked(false);
      setEmailCheckMessage("이메일을 먼저 입력해주세요.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setIsEmailChecked(false);
      setEmailCheckMessage("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (takenEmails.includes(trimmedEmail)) {
      setIsEmailChecked(false);
      setEmailCheckMessage("이미 사용 중인 이메일입니다.");
      return;
    }

    setIsEmailChecked(true);
    setEmailCheckMessage("사용 가능한 이메일입니다.");
  };

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* 🔵 회원가입 카드 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* 로고 */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Code-Ray"
            className="mx-auto h-14 w-auto"
          />
          <p className="text-gray-500 text-sm mt-2">
            Create your account 🚀
          </p>
        </div>

        {/* 입력 */}
        <div className="space-y-4">
          <div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                value={email}
                onChange={handleEmailChange}
              />
              <button
                type="button"
                onClick={handleEmailDuplicateCheck}
                className="shrink-0 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                중복 확인
              </button>
            </div>

            {emailCheckMessage ? (
              <p
                className={`mt-2 text-xs ${
                  isEmailChecked ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {emailCheckMessage}
              </p>
            ) : null}
          </div>

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {confirmPassword ? (
            <p className={`text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
              {passwordsMatch
                ? "비밀번호가 일치합니다."
                : "비밀번호가 일치하지 않습니다."}
            </p>
          ) : null}
        </div>

        {/* 회원가입 버튼 */}
        <button
          disabled={!isEmailChecked || !passwordsMatch}
          className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold"
        >
          Sign Up
        </button>

        {/* 하단 */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-500 cursor-pointer"
          >
            Sign in
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
