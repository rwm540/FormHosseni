import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { Department, User, NewUserData } from '../types';
import { DEPARTMENTS } from '../constants';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';

// --- Helper Functions for Credential Generation ---

const generateRandomCredential = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const RefreshIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696h4.992v.001M2.985 5.356v4.992m0 0h4.992m-4.993 0l3.181-3.183a8.25 8.25 0 0111.664 0l3.181 3.183" />
    </svg>
);


interface UserFormProps {
    userToEdit: User | null;
}

const initialFormState: NewUserData = {
    name: '',
    fullName: '',
    password: '',
    department: Department.SALES,
    phone: '',
};

const UserForm: React.FC<UserFormProps> = ({ userToEdit }) => {
    const { isUserModalOpen, closeUserModal, setGlobalLoading } = useUI();
    const { addUser, updateUser, user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<NewUserData>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!userToEdit;
    const isEditingSelf = isEditMode && userToEdit?.id === currentUser?.id;

    useEffect(() => {
        if (isUserModalOpen) {
            if (isEditMode && userToEdit) {
                setFormData({
                    name: userToEdit.name,
                    fullName: userToEdit.fullName,
                    password: userToEdit.password,
                    department: userToEdit.department,
                    phone: userToEdit.phone,
                });
            } else {
                setFormData({
                    ...initialFormState,
                    name: generateRandomCredential(),
                    password: generateRandomCredential(),
                });
            }
        }
    }, [isUserModalOpen, userToEdit, isEditMode]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as Department }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setGlobalLoading(true);
        try {
            if (isEditMode && userToEdit) {
                 const updatedUserData: Partial<NewUserData> = {
                    name: formData.name,
                    fullName: formData.fullName,
                    department: formData.department,
                    phone: formData.phone,
                    password: formData.password,
                };
                await updateUser(userToEdit.id, updatedUserData);
                addToast('اطلاعات کاربر با موفقیت به‌روزرسانی شد.', 'success');
            } else {
                await addUser(formData);
                addToast('کاربر جدید با موفقیت ثبت شد.', 'success');
            }
            handleClose();
        } catch (error) {
            addToast("خطا در ذخیره اطلاعات کاربر.", 'error');
        } finally {
            setIsSubmitting(false);
            setGlobalLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(initialFormState);
        closeUserModal();
    };
    
    const footer = (
         <div className="flex space-x-3 space-x-reverse">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                لغو
            </Button>
            <Button type="submit" form="user-form" isLoading={isSubmitting}>
                {isEditMode ? 'ذخیره تغییرات' : 'ثبت کاربر'}
            </Button>
        </div>
    );

    const modalTitle = isEditingSelf ? "اطلاعات من" : (isEditMode ? "ویرایش کاربر" : "ثبت کاربر جدید");

    return (
        <Modal isOpen={isUserModalOpen} onClose={handleClose} title={modalTitle} footer={footer}>
            <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label="نام کامل" 
                        id="fullName" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleChange} 
                        required 
                    />
                    <div className="flex items-end gap-2">
                         <div className="flex-grow">
                             <Input 
                                label="نام کاربری" 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                            />
                         </div>
                         {!isEditMode && (
                             <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setFormData(prev => ({ ...prev, name: generateRandomCredential() }))}
                                title="بازتولید نام کاربری"
                                className="px-2 py-2"
                            >
                                <RefreshIcon />
                                <span className="sr-only">بازتولید نام کاربری</span>
                            </Button>
                         )}
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Input 
                                label="رمز ورود کاربر" 
                                id="password" 
                                name="password"
                                type="text"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setFormData(prev => ({ ...prev, password: generateRandomCredential() }))}
                            title="بازتولید رمز عبور"
                            className="px-2 py-2"
                        >
                            <RefreshIcon />
                            <span className="sr-only">بازتولید رمز عبور</span>
                        </Button>
                    </div>
                     <Input 
                        label="شماره موبایل" 
                        id="phone" 
                        name="phone"
                        type="tel"
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                    />
                    <Select 
                        label="واحد" 
                        id="department" 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        required
                        disabled={isEditingSelf}
                    >
                        {isEditingSelf ? (
                            <option value={Department.MANAGEMENT}>{Department.MANAGEMENT}</option>
                        ) : (
                            DEPARTMENTS.filter(d => d !== Department.MANAGEMENT).map(dep => (
                                <option key={dep} value={dep}>{dep}</option>
                            ))
                        )}
                    </Select>
                </div>
            </form>
        </Modal>
    );
};

export default UserForm;