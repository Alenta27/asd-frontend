import React, { useState } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "3074679378-fbmg47osjqajq7u4cv0qja7svo00pv3m.apps.googleusercontent.com";

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [licenseNumber, setLicenseNumber] = useState('');
  const [doctoraldegree, setDoctoraldegree] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const navigate = useNavigate();

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isStrongPassword = (val) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(val);

  // Enhanced email validation to catch fake domains and typos
  const getEmailSuggestion = (val) => {
    const match = val.match(/^[^\s@]+@([^\.\s@]+)\.([A-Za-z]{2,})$/);
    if (!match) return '';
    const domain = match[1].toLowerCase();
    const tld = match[2].toLowerCase();

    // List of legitimate email providers
    const legitimateProviders = [
      'gmail', 'yahoo', 'outlook', 'hotmail', 'live', 'icloud', 'ymail', 'protonmail',
      'aol', 'zoho', 'mail', 'yandex', 'tutanota', 'fastmail', 'hey', 'icloud',
      'company', 'business', 'org', 'edu', 'gov', 'mil', 'net', 'info', 'biz'
    ];

    // Common TLD typos mapped to likely intent
    const tldTypos = { con: 'com', c0m: 'com', cpm: 'com', cop: 'com', om: 'com' };

    // Check for obvious fake domains (contains numbers in provider name)
    if (domain.match(/\d/)) {
      // Try to suggest a real provider
      if (domain.includes('gmail') || domain.includes('gmil')) {
        return 'Did you mean gmail.com?';
      }
      if (domain.includes('yahoo')) {
        return 'Did you mean yahoo.com?';
      }
      if (domain.includes('outlook') || domain.includes('hotmail')) {
        return 'Did you mean outlook.com or hotmail.com?';
      }
      return 'Please use a legitimate email provider (gmail.com, yahoo.com, outlook.com, etc.)';
    }

    // Check for TLD typos
    if (tldTypos[tld]) {
      return `Did you mean .${tldTypos[tld]}?`;
    }

    // Check if domain looks suspicious (too short, contains unusual characters)
    if (domain.length < 3 || !legitimateProviders.some(provider => domain.includes(provider))) {
      return 'Please use a legitimate email provider (gmail.com, yahoo.com, outlook.com, etc.)';
    }

    return '';
  };

  const runValidation = () => {
    const suggestion = email.trim() && isValidEmail(email) ? getEmailSuggestion(email) : '';
    const nextErrors = {
      name: !name.trim() ? 'Full name is required.' : '',
      email: !email.trim()
        ? 'Email is required.'
        : !isValidEmail(email)
        ? 'Enter a valid email address.'
        : suggestion
        ? suggestion
        : '',
      password: !password ? 'Password is required.' : !isStrongPassword(password) ? 'Min 8 chars, include letter and number.' : '',
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    runValidation();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!runValidation()) {
      return;
    }

    if (role === 'therapist') {
      if (!licenseNumber.trim()) {
        setMessage('Professional License Number is required for therapist registration.');
        return;
      }
      if (!doctoraldegree) {
        setMessage('Doctoral Degree upload is required for therapist registration.');
        return;
      }
      if (!consentChecked) {
        setMessage('You must accept the pending approval terms to register as a therapist.');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('username', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      
      if (role === 'therapist') {
        formData.append('licenseNumber', licenseNumber);
        if (doctoraldegree) {
          formData.append('doctoraldegree', doctoraldegree);
        }
      }
      
      const res = await axios.post('http://localhost:5000/api/register', formData);
      
      localStorage.clear();
      localStorage.setItem('token', res.data.token);
      
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
      
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'researcher') {
        navigate('/research');
      } else if (role === 'therapist') {
        navigate('/therapist-pending-approval');
      } else if (role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error details:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Error registering';
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // --- THIS IS THE UPDATED GOOGLE HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const res = await axios.post('http://localhost:5000/api/auth/google', { token });
      
      if (res.data.isNewUser) {
        localStorage.clear();
      }
      
      localStorage.setItem('token', res.data.token);
      
      // Check the isNewUser signal from the backend
      if (res.data.isNewUser) {
        // If the user is new, go to the role selection page
        navigate('/select-role');
      } else {
        // If they are a returning user, decode the token and redirect
        const decodedToken = jwtDecode(res.data.token);
        const userRole = decodedToken.role;
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'researcher') {
          navigate('/research');
        } else if (userRole === 'therapist') {
          navigate('/therapist');
        } else if (userRole === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error with Google sign up');
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const eyeIcon = ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
  const eyeOffIcon = ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.91 4.24A9.97 9.97 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.94 4.06M2 2l20 20"></path></svg> );

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="min-h-screen md:flex font-sans">
        
        <div 
          className="relative hidden md:block md:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/register-bg.jpg)' }}
        >
          <div className="absolute inset-0 bg-black opacity-25"></div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Create Your Account
            </h2>
            <p className="text-gray-500 mb-8">
              Join our community to access screening tools and resources.
            </p>
          
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Register as:</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
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

            {role === 'therapist' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Professional License Number *</label>
                  <p className="text-xs text-gray-500 mb-2">Must match your professional credentials</p>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g., State Medical License #"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Upload Doctoral Degree or Medical Certification *</label>
                  <p className="text-xs text-gray-500 mb-2">Please upload a clear PDF, JPG, or PNG</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDoctoraldegree(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                    {doctoraldegree && (
                      <p className="mt-2 text-sm text-green-600">✓ {doctoraldegree.name} selected</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600">
                    I understand that my account will be <strong>Pending</strong> and inactive until my credentials are manually verified and approved by an administrator.
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg transition-all shadow-md ${submitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
            >
              {submitting ? 'Creating...' : 'Create Account'}
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
              onError={() => setMessage('Google Sign Up Failed')}
              width={350}
            />
          </div>

          {message && (
            <p className={`text-center text-sm mt-6 ${message.includes("successful") ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">
                Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  </GoogleOAuthProvider>
  );
}
