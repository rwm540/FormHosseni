import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import { useUI } from '../contexts/UIContext';
import { Mission } from '../types';
import jalaali from 'jalaali-js';

const toPersianDigits = (str: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};
const formatPersianDate = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return ' - ';
    const date = new Date(isoString);
    const { jy, jm, jd } = jalaali.toJalaali(date);
    return toPersianDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
};

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);


const NotificationBell: React.FC = () => {
    const { user, findUserById } = useAuth();
    const { missions, markMissionsAsRead } = useMissions();
    const { openMissionModal } = useUI();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const newMissions = useMemo(() => {
        if (!user) return [];
        return missions
            .filter(m => m.assignedto === user.id && m.is_read === false)
            .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());
    }, [missions, user]);

    const newMissionsCount = newMissions.length;

    const handleToggle = () => {
        const shouldOpen = !isOpen;
        setIsOpen(shouldOpen);
        if (shouldOpen && newMissionsCount > 0) {
            const missionIds = newMissions.map(m => m.id);
            markMissionsAsRead(missionIds);
        }
    };
    
    const handleMissionClick = (mission: Mission) => {
        openMissionModal(mission, 'FULL');
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-500 hover:text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="اعلان‌ها"
            >
                <BellIcon />
                {newMissionsCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {toPersianDigits(newMissionsCount)}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-20 origin-top-left">
                    <div className="p-3 font-semibold border-b">
                        اعلان‌های جدید
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {newMissionsCount > 0 ? (
                            <ul>
                                {newMissions.map(mission => (
                                    <li key={mission.id}>
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handleMissionClick(mission); }}
                                            className="block p-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <p className="font-semibold text-sm text-gray-800">{mission.subject}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                ایجاد شده در: {formatPersianDate(mission.createdat)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                توسط: {findUserById(mission.createdby)?.fullName || 'ناشناس'}
                                            </p>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                اعلان جدیدی وجود ندارد.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;