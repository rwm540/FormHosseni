
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MissionProvider } from './contexts/MissionContext';
import { UIProvider, useUI } from './contexts/UIContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { Role } from './types';
import UserManagement from './components/UserManagement';
import UserForm from './components/UserForm';
import DelegateMissionModal from './components/DelegateMissionModal';
import UserPerformancePage from './components/UserPerformancePage';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import ViewSingleReportModal from './components/ViewSingleReportModal';
import GlobalLoader from './components/ui/GlobalLoader';

const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    const { userForModal, currentView } = useUI();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700">در حال بارگذاری...</h2>
                    <p className="text-gray-500 mt-2">لطفا کمی صبر کنید</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    const renderContent = () => {
        switch (currentView) {
            case 'USER_MANAGEMENT':
                return <UserManagement />;
            case 'USER_PERFORMANCE':
                return <UserPerformancePage />;
            case 'DASHBOARD':
            case 'MY_MISSIONS':
            case 'CREATED_MISSIONS':
            case 'DELEGATIONS':
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900">
            <GlobalLoader />
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-6 py-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
            { user.role === Role.ADMIN && <UserForm userToEdit={userForModal} /> }
            <DelegateMissionModal />
            <ViewSingleReportModal />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MissionProvider>
                <UIProvider>
                    <ToastProvider>
                        <AppContent />
                        <ToastContainer />
                    </ToastProvider>
                </UIProvider>
            </MissionProvider>
        </AuthProvider>
    );
};

export default App;
