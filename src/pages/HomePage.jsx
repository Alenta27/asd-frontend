import React, { useState, useEffect } from "react";
import { 
  FaBrain, 
  FaHome, 
  FaUpload, 
  FaStethoscope, 
  FaFileAlt, 
  FaArrowUp 
} from "react-icons/fa";
import { BsPersonBadge } from "react-icons/bs";
import { Link } from "react-router-dom";

const Homepage = () => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaBrain className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                ASD Detection
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#home" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium flex items-center">
                <FaHome className="mr-1" /> Home
              </a>
              <Link to="/how-it-works" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                How It Works
              </Link>
              <Link to="/features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                Features
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium flex items-center">
                <BsPersonBadge className="mr-1" /> Register
              </Link>
              <Link to="/login">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="home">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            <div className="w-full md:w-1/2 relative flex">
              <img
                src="/images/hero-family.jpg"
                alt="Supportive family"
                className="w-full h-full object-cover rounded-lg shadow-xl"
              />
            </div>
            <div className="w-full md:w-1/2 space-y-8 flex flex-col justify-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  Autism Spectrum Disorder Detection Using CNN
                </h1>
                <p className="text-gray-600 text-lg">
                  Leveraging Convolutional Neural Networks to revolutionize early
                  autism detection.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-blue-50 rounded-lg shadow-md p-5">
                <img
                  src="/images/quote-child.jpg"
                  alt="Hopeful child"
                  className="w-24 h-24 object-cover rounded-full shadow mb-4 sm:mb-0"
                />
                <blockquote className="text-blue-700 italic text-lg font-semibold text-center sm:text-left">
                  “Every child is a different kind of flower, and all together, make this world a beautiful garden.”
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              A Simple Path to Early Insights
            </h2>
            <p className="text-lg text-gray-600 mb-12">
              Our screening process is designed to be simple, fast, and secure.
            </p>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full p-6 mb-4">
                  <FaUpload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Upload Image</h3>
                <p className="text-gray-600">
                  Securely upload a clear facial photograph of your child.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full p-6 mb-4">
                  <FaStethoscope className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. AI Analysis</h3>
                <p className="text-gray-600">
                  Our advanced CNN model analyzes the image for key indicators.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full p-6 mb-4">
                  <FaFileAlt className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. View Results</h3>
                <p className="text-gray-600">
                  Receive a confidential, easy-to-understand preliminary report.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Transparent & Explainable AI
                </h3>
                <p className="text-gray-600">
                  Our system uses Grad-CAM to visualize what parts of an image our AI
                  focused on, providing transparency and building trust for both parents
                  and clinicians.
                </p>
              </div>
              <div className="md:w-1/2">
                <img
                  src="/images/feature-ai-bg.jpg"
                  alt="AI Visualization"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Personalized Reports
                </h3>
                <p className="text-gray-600">
                  Results from the analysis are compiled into a clear, user-friendly
                  diagnostic summary suitable for parents and health professionals,
                  complete with actionable insights.
                </p>
              </div>
              <div className="md:w-1/2">
                <img
                  src="/images/feature-report-support.jpg"
                  alt="Support and care"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section 
          id="cta"
          className="py-20 bg-black relative bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/cta-background.jpg)' }}
        >
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Take the Next Step?
            </h2>
            <p className="text-lg text-gray-200 mb-8">
              Get a free, confidential screening today and gain valuable insights.
            </p>
            {/* CTA Buttons: Facial, Voice, and MRI Screening */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/screening">
                <button className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 text-lg w-full sm:w-auto">
                  Facial Screening
                </button>
              </Link>
              <Link to="/voice-screening">
                <button className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300 text-lg w-full sm:w-auto">
                  Voice Screening
                </button>
              </Link>
              <Link to="/mri-screening">
                <button className="bg-black text-white font-semibold py-3 px-8 rounded-lg hover:bg-gray-800 transition duration-300 text-lg w-full sm:w-auto">
                  MRI Screening
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Scroll to Top Button */}
      {showScroll && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
        >
          <FaArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Homepage;
