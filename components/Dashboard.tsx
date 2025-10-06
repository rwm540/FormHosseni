

import React, { useMemo, useEffect, useState } from 'react';
import { useMissions } from '../contexts/MissionContext';
import { Mission, MissionStatus, Role, DelegationStatus } from '../types';
import Button from './ui/Button';
import MissionCard from './MissionCard';
import MissionForm from './MissionForm';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { missions, isLoading: isMissionsLoading } = useMissions();
    const { user: currentUser } = useAuth();
    const { 
        isMissionModalOpen, 
        missionForModal,
        modalView,
        openMissionModal,
        closeMissionModal,
        currentView,
        openDelegateModal,
    } = useUI();
    const [statusFilter, setStatusFilter] = useState<MissionStatus | 'ALL'>('ALL');


    useEffect(() => {
        setStatusFilter('ALL');
    }, [currentView]);

    const filteredMissions = useMemo(() => {
        if (!currentUser) return [];
        
        let baseMissions: Mission[] = [];

        if (currentView === 'DELEGATIONS') {
            return missions.filter(m => m.delegation_target === currentUser.id && m.delegation_status === DelegationStatus.PENDING);
        } else if (currentView === 'CREATED_MISSIONS') {
            baseMissions = missions.filter(m => m.createdby === currentUser.id);
        } else if (currentUser.role === Role.ADMIN && currentView === 'DASHBOARD') {
            baseMissions = missions;
        } else { // MY_MISSIONS
            baseMissions = missions.filter(m => m.assignedto === currentUser.id);
        }
        
        if (statusFilter === 'ALL') {
            return baseMissions;
        }
        
        return baseMissions.filter(m => m.status === statusFilter);

    }, [missions, currentView, currentUser, statusFilter]);
    
    const handleEditMission = (mission: Mission) => {
        openMissionModal(mission, 'FULL');
    };

    const handleViewReport = (mission: Mission) => {
        openMissionModal(mission, 'VIEW_REPORT');
    };

    const handleDelegate = (mission: Mission) => {
        openDelegateModal(mission);
    };

    const pageTitle = useMemo(() => {
        if (currentView === 'CREATED_MISSIONS') {
            return "ماموریت‌های ثبت شده";
        }
        if (currentView === 'DELEGATIONS') {
            return "درخواست‌های ارجاع شده به شما";
        }
        if (currentUser?.role === Role.ADMIN && currentView === 'DASHBOARD') {
            return "همه ماموریت‌ها";
        }
        return "ماموریت‌های من";
    }, [currentView, currentUser]);

    const filterOptions: { label: string; value: MissionStatus | 'ALL' }[] = [
        { label: 'همه', value: 'ALL' },
        { label: 'جدید', value: MissionStatus.NEW },
        { label: 'در حال انجام', value: MissionStatus.ONGOING },
        { label: 'تکمیل شده', value: MissionStatus.COMPLETED },
    ];

    const renderContent = () => {
        if (isMissionsLoading) {
            return (
                <div className="flex flex-col items-center justify-center bg-white rounded-lg border h-64">
                    <div className="text-center">
                        <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h3 className="text-xl font-semibold tracking-tight text-gray-700 mt-4">در حال بارگزاری ماموریت‌ها</h3>
                        <p className="text-gray-500 mt-2">لطفا کمی صبر کنید...</p>
                    </div>
                </div>
            );
        }

        if (filteredMissions.length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-dashed h-64">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold tracking-tight text-gray-700">ماموریتی یافت نشد</h3>
                        <p className="text-gray-500 mt-2">
                             {statusFilter === 'ALL' && currentView !== 'DELEGATIONS'
                                ? 'هیچ ماموریتی برای نمایش وجود ندارد.'
                                : currentView === 'DELEGATIONS'
                                ? 'هیچ درخواست ارجاع جدیدی برای شما وجود ندارد.'
                                : `هیچ ماموریتی با وضعیت "${statusFilter}" یافت نشد.`
                            }
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMissions.map(mission => (
                    <MissionCard 
                      key={mission.id} 
                      mission={mission} 
                      onEdit={handleEditMission}
                      onViewReport={handleViewReport}
                      onDelegate={handleDelegate}
                    />
                ))}
            </div>
        );
    }


    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">{pageTitle}</h3>
                <Button onClick={() => openMissionModal(null, 'CREATE')}>
                    ثبت ماموریت جدید
                </Button>
            </div>
            
            {currentView !== 'DELEGATIONS' && (
                <div className="mb-6 bg-white p-3 rounded-md shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                        <span className="text-sm font-medium text-gray-600 shrink-0">فیلتر وضعیت:</span>
                        <div className="flex gap-1 overflow-x-auto p-2">
                            {filterOptions.map(option => (
                                <Button
                                    key={option.value}
                                    variant={statusFilter === option.value ? 'primary' : 'secondary'}
                                    onClick={() => setStatusFilter(option.value)}
                                    className="text-sm px-3 py-1 whitespace-nowrap"
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {renderContent()}

            <MissionForm 
                isOpen={isMissionModalOpen}
                onClose={closeMissionModal}
                mission={missionForModal}
                modalView={modalView}
            />
        </>
    );
};

export default Dashboard;