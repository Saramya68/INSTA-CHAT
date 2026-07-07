import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";


const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [isChecked, setIsChecked] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
  event.preventDefault();

  if (!isChecked) {
    alert("Please agree to the Terms of Use & Privacy Policy.");
    return;
  }

  if (currState === "Sign up" && !isDataSubmitted) {
    setIsDataSubmitted(true);
    return;
  }

  login(currState === "Sign up" ? "signup" : "login", {
    fullName,
    email,
    password,
    bio,
  });
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-sky-700 flex items-center justify-center gap-16 px-6 py-10 sm:justify-evenly max-sm:flex-col">
      <div className="flex flex-col items-center">
  <img
    src={assets.logo_big}
    alt="Logo"
    className="w-[min(30vw,260px)] aspect-square rounded-full object-cover border-4 border-sky-300 shadow-2xl"
  />

  <h1 className="mt-6 text-5xl font-extrabold text-white tracking-wide">
    Insta-Chat
  </h1>

  <p className="mt-2 text-blue-100 text-lg">
    Connect • Chat • Share
  </p>
</div>
      {/* Right Side */}
      <form
        onSubmit={onSubmitHandler}
        className="w-[420px] bg-white rounded-3xl border border-blue-100 shadow-2xl p-8 flex flex-col gap-6"
      >
        <h2 className="text-3xl font-bold flex justify-between items-center text-slate-800">
          {currState}

          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className="w-6 cursor-pointer hover:scale-110 transition duration-300"
            />
          )}
        </h2>

        {/* Full Name */}
        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            placeholder="Full Name"
            required
            className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
          />
        )}

        {/* Email & Password */}
        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            />

            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password"
              required
              className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            />
          </>
        )}

        {/* Bio */}
        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            placeholder="Provide a short bio..."
            required
            className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none"
          />
        )}

        {/* Button */}
        <button
  type="submit"
  disabled={!isChecked}
  className={`py-3 rounded-xl text-white font-semibold text-lg transition-all duration-300 ${
    isChecked
      ? "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 cursor-pointer"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  {currState === "Sign up" ? "Create Account" : "Login Now"}
</button>
        {/* Terms */}
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <input
  type="checkbox"
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
  className="accent-blue-600 w-4 h-4 cursor-pointer"
/>

          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-2">
          {currState === "Sign up" ? (
            <p className="text-sm text-slate-600 text-center">
              Already have an account?{" "}
              <span
                className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition"
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-600 text-center">
              Create an account{" "}
              <span
                className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition"
                onClick={() => {
                  setCurrState("Sign up");
                  setIsDataSubmitted(false);
                }}
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;