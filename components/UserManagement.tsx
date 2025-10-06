import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import { Role, User } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useUI } from '../contexts/UIContext';
import { useToast } from '../contexts/ToastContext';

const UserManagement: React.FC = () => {
    const { users, deleteUser, isUsersLoading } = useAuth();
    const { openUserModal, openPerformancePage, setGlobalLoading } = useUI();
    const { deleteMissionsByUserId } = useMissions();
    const { addToast } = useToast();
    const [userToDelete, setUserToDelete] = useState<{ id: string; fullName: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const employeeUsers = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            setIsDeleting(true);
            setGlobalLoading(true);
            try {
                await deleteMissionsByUserId(userToDelete.id);
                await deleteUser(userToDelete.id);
                addToast(`کاربر "${userToDelete.fullName}" با موفقیت حذف شد.`, 'success');
                setUserToDelete(null); 
            } catch (error) {
                addToast((error as Error).message, 'error');
            } finally {
                setIsDeleting(false);
                setGlobalLoading(false);
            }
        }
    };
    
    const handleCancelDelete = () => {
        setUserToDelete(null);
    };

    const handleEditUser = (user: User) => {
        openUserModal(user);
    };

    const handleShowPerformance = (user: User) => {
        openPerformancePage(user);
    };
    
    const deleteModalFooter = (
         <div className="flex space-x-3 space-x-reverse">
            <Button type="button" variant="secondary" onClick={handleCancelDelete} disabled={isDeleting}>
                خیر
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmDelete} isLoading={isDeleting}>
                بله
            </Button>
        </div>
    );

    const renderContent = () => {
        if (isUsersLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-center">
                        <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h3 className="text-xl font-semibold tracking-tight text-gray-700 mt-4">در حال بارگزاری کاربران</h3>
                        <p className="text-gray-500 mt-2">لطفا کمی صبر کنید...</p>
                    </div>
                </div>
            );
        }

        if (employeeUsers.length === 0) {
            return <p className="text-center p-6 text-gray-500">کاربری برای نمایش وجود ندارد.</p>;
        }

        return (
            <>
                {/* Desktop: Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام کامل</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بخش</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره تماس</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employeeUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" >{user.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2 space-x-reverse">
                                        <Button variant="secondary" onClick={() => handleShowPerformance(user)} className="px-3 py-1 text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 focus:ring-sky-300">عملکرد</Button>
                                        <Button variant="secondary" onClick={() => handleEditUser(user)} className="px-3 py-1 text-xs">ویرایش</Button>
                                        <Button variant="danger" onClick={() => setUserToDelete({ id: user.id, fullName: user.fullName })} className="px-3 py-1 text-xs">حذف</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile: Card View */}
                <div className="md:hidden space-y-4">
                    {employeeUsers.map(user => (
                        <div key={user.id} className="p-4 bg-gray-50 border rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{user.fullName}</p>
                                    <p className="text-sm text-gray-600">{user.department}</p>
                                </div>
                                <p className="text-sm text-gray-600 shrink-0 mt-2">{user.phone}</p>
                            </div>
                            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-3 mt-3 border-t">
                                <Button variant="secondary" onClick={() => handleShowPerformance(user)} className="px-3 py-1 text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 focus:ring-sky-300">عملکرد</Button>
                                <Button variant="secondary" onClick={() => handleEditUser(user)} className="px-3 py-1 text-xs">ویرایش</Button>
                                <Button variant="danger" onClick={() => setUserToDelete({ id: user.id, fullName: user.fullName })} className="px-3 py-1 text-xs">حذف</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">لیست کاربران</h2>
                 </div>
                 {renderContent()}
            </div>
            
            <Modal
                isOpen={!!userToDelete}
                onClose={handleCancelDelete}
                title="حذف کاربر"
                footer={deleteModalFooter}
            >
                <p className="text-gray-700 text-lg">
                    آیا از حذف کاربر "{userToDelete?.fullName}" مطمئن هستید؟
                </p>
                 <p className="text-sm text-gray-500 mt-2">توجه: تمام ماموریت‌های تخصیص‌داده‌شده به این کاربر نیز حذف خواهند شد.</p>
            </Modal>
        </>
    );
};

export default UserManagement;