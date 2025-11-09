import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "3074679378-fbmg47osjqajq7u4cv0qja7svo00pv3m.apps.googleusercontent.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStatus, setResetStatus] = useState({ type: "", text: "" });
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState('enterEmail'); // enterEmail, enterOtp, success
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem('token', token);
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    const getRoute = (role) => {
      const routes = {
        'admin': '/admin',
        'researcher': '/research',
        'therapist': '/therapist',
        'teacher': '/teacher',
        'parent': '/dashboard',
        'guest': '/select-role'
      };
      // Treat undefined/null role same as guest - needs role selection
      if (!role || role === 'undefined' || role === 'null') {
        return '/select-role';
      }
      return routes[role] || '/dashboard';
    };

    const route = getRoute(userRole);
    navigate(route);
    setTimeout(() => window.location.reload(), 100);
  };

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const runValidation = () => {
    const nextErrors = {
      email: !email.trim() ? 'Email is required.' : !isValidEmail(email) ? 'Enter a valid email address.' : '',
      password: !password ? 'Password is required.' : '',
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    runValidation();
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!runValidation()) return;
    try {
      setSubmitting(true);
      localStorage.clear();
      sessionStorage.clear();
      
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, role });
      
      const roleIdField = {
        parent: 'parentId',
        therapist: 'therapistId',
        teacher: 'teacherId',
        researcher: 'researcherId',
        admin: 'adminId'
      };
      
      if (res.data.user && roleIdField[role]) {
        localStorage.setItem(roleIdField[role], res.data.user[roleIdField[role]]);
      }
      
      handleLoginSuccess(res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      const token = credentialResponse.credential;
      const res = await axios.post('http://localhost:5000/api/auth/google', { token });
      
      console.log('🔍 Google Auth Response:', {
        isNewUser: res.data.isNewUser,
        userRole: res.data.user?.role,
        hasParentId: !!res.data.user?.parentId,
        hasTherapistId: !!res.data.user?.therapistId,
        hasTeacherId: !!res.data.user?.teacherId,
        hasResearcherId: !!res.data.user?.researcherId,
        hasAdminId: !!res.data.user?.adminId
      });
      
      if (res.data.user) {
        const roleIdField = {
          parent: 'parentId',
          therapist: 'therapistId',
          teacher: 'teacherId',
          researcher: 'researcherId',
          admin: 'adminId'
        };
        
        const idField = roleIdField[res.data.user.role];
        if (idField && res.data.user[idField]) {
          localStorage.setItem(idField, res.data.user[idField]);
        }
      }
      
      if (res.data.isNewUser) {
        console.log('➡️ New user detected, redirecting to /select-role');
        localStorage.setItem('token', res.data.token);
        navigate('/select-role');
        setTimeout(() => window.location.reload(), 100);
      } else {
        console.log('✅ Existing user, logging in with role:', res.data.user?.role);
        handleLoginSuccess(res.data.token);
      }
    } catch (err) {
      console.error('❌ Google sign in error:', err.response?.data || err.message);
      setMessage(err.response?.data?.message || 'Error with Google sign in');
    }
  };
 
  const handleOpenReset = () => {
    setResetOpen(true);
    setResetEmail(email);
    setResetStatus({ type: "", text: "" });
    setForgotPasswordStep('enterEmail');
    setOtp("");
    setNewPassword("");
  };

  const handleCloseReset = () => {
    setResetOpen(false);
    setResetSubmitting(false);
  };

  const handleSendOtp = async () => {
    if (!resetEmail.trim()) {
      setResetStatus({ type: "error", text: "Please enter your email address." });
      return;
    }
    setResetSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forget-password', { email: resetEmail });
      setResetStatus({ type: "success", text: "OTP sent to your email." });
      setForgotPasswordStep('enterOtp');
    } catch (err) {
      setResetStatus({ type: "error", text: err.response?.data?.message || "Failed to send OTP." });
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      setResetStatus({ type: "error", text: "Please enter OTP and new password." });
      return;
    }
    setResetSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', { email: resetEmail, otp });
      await axios.post('http://localhost:5000/api/auth/reset-password', { email: resetEmail, newPassword });
      setResetStatus({ type: "success", text: "Password reset successfully." });
      setForgotPasswordStep('success');
    } catch (err) {
      setResetStatus({ type: "error", text: err.response?.data?.message || "Failed to reset password." });
    } finally {
      setResetSubmitting(false);
    }
  };

  const eyeIcon = ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
  const eyeOffIcon = ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.91 4.24A9.97 9.97 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.94 4.06M2 2l20 20"></path></svg> );

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="min-h-screen md:flex font-sans">
        <div
          className="relative hidden md:block md:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/login-inspiration-bg.jpg)' }}
        >
          <div className="absolute inset-0 bg-black opacity-25"></div>
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome Back
            </h2>
            <p className="text-gray-500 mb-8">
              Please enter your details to sign in.
            </p>
            <form className="space-y-5" onSubmit={handleSignIn}>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Login as:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="parent">Parent</option>
                  <option value="therapist">Therapist</option>
                  <option value="researcher">Researcher</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    required
                  />
                  <span
                    className="absolute inset-y-0 right-4 flex items-center text-gray-500 cursor-pointer"
                    onClick={handleTogglePassword}
                  >
                    {showPassword ? eyeOffIcon : eyeIcon}
                  </span>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div className="flex items-center justify-end text-sm">
                <button type="button" onClick={handleOpenReset} className="font-medium text-indigo-600 hover:text-indigo-800">
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg transition-all shadow-md ${submitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-4 text-gray-400 text-sm">Or</span>
              <hr className="flex-grow border-gray-300" />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage('Google Login Failed')}
                width={350}
              />
            </div>
            {message && (
              <p className={`text-center text-sm mt-6 ${message.includes("successful") ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
            {resetOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset password</h3>
                  {forgotPasswordStep === 'enterEmail' && (
                    <>
                      <p className="text-sm text-gray-500 mb-4">Enter your account's email address. We will send you an OTP to reset your password.</p>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        placeholder="you@example.com"
                      />
                    </>
                  )}
                  {forgotPasswordStep === 'enterOtp' && (
                    <>
                      <p className="text-sm text-gray-500 mb-4">Enter the OTP sent to your email and your new password.</p>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        placeholder="OTP"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        placeholder="New Password"
                      />
                    </>
                  )}
                  {resetStatus.text && (
                    <div className={`text-sm mb-3 ${resetStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {resetStatus.text}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={handleCloseReset} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                    {forgotPasswordStep === 'enterEmail' && (
                      <button type="button" onClick={handleSendOtp} disabled={resetSubmitting} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                        {resetSubmitting ? 'Sending...' : 'Send OTP'}
                      </button>
                    )}
                    {forgotPasswordStep === 'enterOtp' && (
                      <button type="button" onClick={handleResetPassword} disabled={resetSubmitting} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                        {resetSubmitting ? 'Resetting...' : 'Reset Password'}
                      </button>
                    )}
                    {forgotPasswordStep === 'success' && (
                      <button type="button" onClick={handleCloseReset} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Close</button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <p className="text-center text-sm text-gray-500 mt-8">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-800">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
