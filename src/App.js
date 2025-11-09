import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import TherapistRegistrationPage from './pages/TherapistRegistrationPage';
import ScreeningPage from './pages/ScreeningPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import SelectRolePage from './pages/SelectRolePage';
import ScreeningTools from './pages/ScreeningTools';
import Reports from './pages/Reports';
import LearningHub from './pages/LearningHub';
import ResearchDashboard from './pages/ResearchDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import TherapistApprovalsPage from './pages/TherapistApprovalsPage';
import TherapistPendingApprovalPage from './pages/TherapistPendingApprovalPage';
import AdminScreeningsPage from './pages/AdminScreeningsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminTherapistRequestsPage from './pages/AdminTherapistRequestsPage';
import AdminChildrenRegistrationPage from './pages/AdminChildrenRegistrationPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import TeacherScreeningsPage from './pages/TeacherScreeningsPage';
import TeacherReportsPage from './pages/TeacherReportsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import TherapistPatientsPage from './pages/TherapistPatientsPage';
import TherapistQuestionnairesPage from './pages/TherapistQuestionnairesPage';
import TherapistSlotManagement from './pages/TherapistSlotManagement';
import TherapistAppointmentsPage from './pages/TherapistAppointmentsPage';
import ResearchUsersPage from './pages/ResearchUsersPage';
import ResearchDatasetPage from './pages/ResearchDatasetPage';
import LearnMorePage from './pages/LearnMorePage';
import VoiceScreeningPage from './pages/VoiceScreeningPage';
import MRIScreeningPage from './pages/MRIScreeningPage';
import QuestionnairePage from './pages/QuestionnairePage';
import HowItWorksPage from './pages/HowItWorksPage';
import FeaturesPage from './pages/FeaturesPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import ParentAppointmentsPage from './pages/ParentAppointmentsPage';
import SocialResponseGame from './pages/SocialResponseGame';
import ParentScreeningResultsPage from './pages/ParentScreeningResultsPage';
import ParentProgressReportsPage from './pages/ParentProgressReportsPage';
import ParentCareTeamPage from './pages/ParentCareTeamPage';
import ParentResourcesPage from './pages/ParentResourcesPage';
import ParentSettingsPage from './pages/ParentSettingsPage';
import PaymentPage from './pages/PaymentPage';

function App() {
  const googleClientId = "3074679378-fbmg47osjqajq7u4cv0qja7svo00pv3m.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-therapist" element={<TherapistRegistrationPage />} />
          <Route path="/therapist-pending-approval" element={<TherapistPendingApprovalPage />} />
          <Route path="/screening" element={<ScreeningPage />} />
          <Route path="/select-role" element={<SelectRolePage />} />

          {/* Public Screening & Info Routes */}
          <Route path="/voice-screening" element={<VoiceScreeningPage />} />
          <Route path="/mri-screening" element={<MRIScreeningPage />} />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/book-appointment" element={<BookAppointmentPage />} />

          {/* Parent Modules */}
          <Route path="/screening-tools" element={<ScreeningTools />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/learning" element={<LearningHub />} />

          {/* Parent Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/parent/appointments" element={<ParentAppointmentsPage />} />
          <Route path="/parent/payment" element={<PaymentPage />} />
          <Route path="/parent/screening-results" element={<ParentScreeningResultsPage />} />
          <Route path="/parent/progress-reports" element={<ParentProgressReportsPage />} />
          <Route path="/parent/care-team" element={<ParentCareTeamPage />} />
          <Route path="/parent/resources" element={<ParentResourcesPage />} />
          <Route path="/parent/settings" element={<ParentSettingsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/therapist-approvals" element={<TherapistApprovalsPage />} />
          <Route path="/admin/therapist-requests" element={<AdminTherapistRequestsPage />} />
          <Route path="/admin/children-data" element={<AdminChildrenRegistrationPage />} />
          <Route path="/admin/screenings" element={<AdminScreeningsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route path="/admin/trends" element={<AdminDashboard />} />
          <Route path="/therapist" element={<TherapistDashboard />} />
          <Route path="/therapist/patients" element={<TherapistPatientsPage />} />
          <Route path="/therapist/appointments" element={<TherapistAppointmentsPage />} />
          <Route path="/therapist/questionnaires" element={<TherapistQuestionnairesPage />} />
          <Route path="/therapist/slots" element={<TherapistSlotManagement />} />
          <Route path="/therapist/ai-analysis" element={<TherapistDashboard />} />
          <Route path="/therapist/insights" element={<TherapistDashboard />} />
          <Route path="/therapist/session-notes" element={<TherapistDashboard />} />
          <Route path="/therapist/notifications" element={<TherapistDashboard />} />
          <Route path="/therapist/settings" element={<TherapistDashboard />} />
          <Route path="/research" element={<ResearchDashboard />} />
          <Route path="/research/users" element={<ResearchUsersPage />} />
          <Route path="/research/screenings" element={<ResearchDashboard />} />
          <Route path="/research/reports" element={<ResearchDashboard />} />
          <Route path="/research/dataset" element={<ResearchDatasetPage />} />
          <Route path="/research/feedback" element={<ResearchDashboard />} />
          <Route path="/research/settings" element={<ResearchDashboard />} />
          <Route path="/research/analytics" element={<ResearchDashboard />} />
          <Route path="/research/trends" element={<ResearchDashboard />} />
          <Route path="/research/gender" element={<ResearchDashboard />} />
          <Route path="/research/regional" element={<ResearchDashboard />} />
          <Route path="/research/articles" element={<ResearchDashboard />} />
          <Route path="/research/models" element={<ResearchDashboard />} />
          <Route path="/research/model-performance" element={<ResearchDashboard />} />
          <Route path="/research/system-health" element={<ResearchDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/students" element={<TeacherStudentsPage />} />
          <Route path="/teacher/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/teacher/students/:studentId/social-game" element={<SocialResponseGame />} />
          <Route path="/teacher/screenings" element={<TeacherScreeningsPage />} />
          <Route path="/teacher/reports" element={<TeacherReportsPage />} />
          <Route path="/teacher/insights" element={<TeacherDashboard />} />
          <Route path="/teacher/feedback" element={<TeacherDashboard />} />
          <Route path="/teacher/settings" element={<TeacherDashboard />} />
          <Route path="/teacher/calendar" element={<TeacherDashboard />} />

          {/* Fallback route */}
          <Route path="*" element={<h1 className="text-center mt-20 text-2xl">404 - Page Not Found</h1>} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;