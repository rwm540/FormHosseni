import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Mission, User, Role, MissionReport, ModalView } from '../types';
import { useAuth } from './AuthContext';

// Define a separate View type for clarity within the UI context
type View = 'DASHBOARD' | 'MY_MISSIONS' | 'USER_MANAGEMENT' | 'CREATED_MISSIONS' | 'USER_PERFORMANCE' | 'DELEGATIONS';

export interface UIContextType {
    isMissionModalOpen: boolean;
    missionForModal: Mission | null;
    modalView: ModalView;
    openMissionModal: (mission: Mission | null, view: ModalView) => void;
    closeMissionModal: () => void;
    currentView: View;
    setCurrentView: (view: View) => void;
    isUserModalOpen: boolean;
    userForModal: User | null;
    openUserModal: (user?: User | null) => void;
    closeUserModal: () => void;
    isDelegateModalOpen: boolean;
    missionToDelegate: Mission | null;
    openDelegateModal: (mission: Mission) => void;
    closeDelegateModal: () => void;
    performanceUser: User | null;
    openPerformancePage: (user: User) => void;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    isViewSingleReportModalOpen: boolean;
    reportForModal: { mission: Mission; report: MissionReport } | null;
    openViewSingleReportModal: (mission: Mission, report: MissionReport) => void;
    closeViewSingleReportModal: () => void;
    isGlobalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
    const [missionForModal, setMissionForModal] = useState<Mission | null>(null);
    const [modalView, setModalView] = useState<ModalView>('CREATE');
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForModal, setUserForModal] = useState<User | null>(null);
    const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
    const [missionToDelegate, setMissionToDelegate] = useState<Mission | null>(null);
    const [performanceUser, setPerformanceUser] = useState<User | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isViewSingleReportModalOpen, setIsViewSingleReportModalOpen] = useState(false);
    const [reportForModal, setReportForModal] = useState<{ mission: Mission; report: MissionReport } | null>(null);
    const [isGlobalLoading, setGlobalLoading] = useState(false);


    useEffect(() => {
        if (user) {
            if (user.role === Role.EMPLOYEE) {
                setCurrentView('MY_MISSIONS');
            } else {
                setCurrentView('DASHBOARD');
            }
        }
    }, [user]);


    const openMissionModal = (mission: Mission | null, view: ModalView) => {
        setMissionForModal(mission);
        setModalView(view);
        setIsMissionModalOpen(true);
    };

    const closeMissionModal = () => {
        setIsMissionModalOpen(false);
        setMissionForModal(null);
    };

    const openUserModal = (user: User | null = null) => {
        setUserForModal(user);
        setIsUserModalOpen(true);
    };
    const closeUserModal = () => {
        setIsUserModalOpen(false);
        setUserForModal(null);
    };

    const openDelegateModal = (mission: Mission) => {
        setMissionToDelegate(mission);
        setIsDelegateModalOpen(true);
    };

    const closeDelegateModal = () => {
        setMissionToDelegate(null);
        setIsDelegateModalOpen(false);
    };

    const openPerformancePage = (user: User) => {
        setPerformanceUser(user);
        setCurrentView('USER_PERFORMANCE');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const openViewSingleReportModal = (mission: Mission, report: MissionReport) => {
        setReportForModal({ mission, report });
        setIsViewSingleReportModalOpen(true);
    };
    const closeViewSingleReportModal = () => {
        setIsViewSingleReportModalOpen(false);
        setReportForModal(null);
    };


    return (
        <UIContext.Provider value={{
            isMissionModalOpen,
            missionForModal,
            modalView,
            openMissionModal,
            closeMissionModal,
            currentView,
            setCurrentView,
            isUserModalOpen,
            userForModal,
            openUserModal,
            closeUserModal,
            isDelegateModalOpen,
            missionToDelegate,
            openDelegateModal,
            closeDelegateModal,
            performanceUser,
            openPerformancePage,
            isMobileMenuOpen,
            toggleMobileMenu,
            isViewSingleReportModalOpen,
            reportForModal,
            openViewSingleReportModal,
            closeViewSingleReportModal,
            isGlobalLoading,
            setGlobalLoading,
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
