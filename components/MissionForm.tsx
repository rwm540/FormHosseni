import React, { useState, useEffect } from 'react';
import { Mission, Role, MissionStatus, ChecklistItem, ChecklistState, MissionReport, ModalView } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { useToast } from '../contexts/ToastContext';
import ChecklistSelectionModal from './ChecklistSelectionModal';
import PersianDateTimePicker from './ui/PersianDateTimePicker';
import MissionChecklist from './MissionChecklist';
import MissionReportView from './MissionReportView';
import { useUI } from '../contexts/UIContext';
import jalaali from 'jalaali-js';
import DeviationReasonModal from './DeviationReasonModal';
import Tooltip from './ui/Tooltip';

const toPersianDigits = (str: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const formatReportDateTime = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return '-';
    const date = new Date(isoString);
    const { jy, jm, jd } = jalaali.toJalaali(date);
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const shamsiDate = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    return toPersianDigits(`${shamsiDate} ${time}`);
};


const initialCreateState = {
    subject: '',
    location: '',
    starttime: '',
    endtime: '',
    assignedto: '',
};

const initialReportState = {
    departureTime: '',
    returnTime: '',
    summary: '',
};

interface MissionFormProps {
    isOpen: boolean;
    onClose: () => void;
    mission: Mission | null;
    modalView: ModalView;
}

const MissionForm: React.FC<MissionFormProps> = ({ isOpen, onClose, mission, modalView }) => {
    const { user: currentUser, users, findUserById } = useAuth();
    const { addMission, updateMission } = useMissions();
    const { addToast } = useToast();
    const { openViewSingleReportModal, setGlobalLoading } = useUI();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [createData, setCreateData] = useState(initialCreateState);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem[]>([]);
    
    const [reportData, setReportData] = useState(initialReportState);
    const [checklistState, setChecklistState] = useState<ChecklistState>({});
    const [reportStatus, setReportStatus] = useState<MissionStatus>(MissionStatus.ONGOING);
    const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);


    const employeeUsers = users.filter(u => u.role === Role.EMPLOYEE);

    useEffect(() => {
        if (isOpen) {
            if (modalView === 'CREATE') {
                setCreateData(initialCreateState);
                setSelectedChecklist([]);
            } else if (mission) {
                 const existingReport = mission.reports?.[0];

                if (existingReport) {
                    setReportData({
                        departureTime: existingReport.departureTime,
                        returnTime: existingReport.returnTime,
                        summary: existingReport.summary,
                    });
                     // Load checklist state from the main mission object as it's the single source of truth.
                    setChecklistState(mission.checkliststate || {});
                } else {
                    // No existing report, start fresh
                    setReportData(initialReportState);
                    setChecklistState({});
                }
                
                // Set the status dropdown based on the mission's current status.
                // If it's NEW, default to ONGOING for the first report.
                setReportStatus(mission.status === MissionStatus.COMPLETED ? MissionStatus.COMPLETED : MissionStatus.ONGOING);
            }
        } else {
            // Reset state on close
            setCreateData(initialCreateState);
            setSelectedChecklist([]);
            setReportData(initialReportState);
            setChecklistState({});
            setReportStatus(MissionStatus.ONGOING);
        }
    }, [isOpen, modalView, mission, currentUser]);


    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCreateData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleChecklistSave = (selected: Record<string, string[]>) => {
        const newChecklist: ChecklistItem[] = Object.entries(selected)
            .filter(([, steps]) => steps.length > 0)
            .map(([category, steps]) => ({ category, steps }));
        setSelectedChecklist(newChecklist);
        setIsChecklistModalOpen(false);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setGlobalLoading(true);
        try {
            await addMission({
                ...createData,
                checklist: selectedChecklist,
            });
            addToast('ماموریت جدید با موفقیت ثبت شد.', 'success');
            handleClose();
        } catch (error) {
            addToast('خطا در ثبت ماموریت.', 'error');
        } finally {
            setIsSubmitting(false);
            setGlobalLoading(false);
        }
    };
    
    const processAndSubmitReport = async (deviationReason?: string, isDraft: boolean = false) => {
        if (!mission || !currentUser) return;

        setIsSubmitting(true);
        setGlobalLoading(true);
        try {
            const isDelegatedToCurrentUser = mission.delegated_by && currentUser?.id === mission.assignedto;

            // --- Logic to UPDATE a single report for a non-delegated mission ---
            const existingReport = mission.reports?.[0];
            let newOrUpdatedReport: MissionReport;

            const reportPayload = {
                departureTime: reportData.departureTime,
                // If it's a draft, explicitly set returnTime to empty. Otherwise, use form data.
                returnTime: isDraft ? '' : reportData.returnTime,
                summary: reportData.summary,
                checklistSnapshot: checklistState,
                // Only add deviation reason if it exists (for final reports)
                ...(deviationReason && { deviation_reason: deviationReason }),
            };

            if (existingReport) {
                newOrUpdatedReport = { ...existingReport, ...reportPayload };
            } else {
                newOrUpdatedReport = { 
                    id: `R${Date.now()}`, 
                    reporterId: currentUser.id, 
                    createdAt: new Date().toISOString(), 
                    ...reportPayload 
                };
            }

            const updatedMission: Mission = {
                ...mission,
                status: isDraft ? MissionStatus.ONGOING : MissionStatus.COMPLETED,
                reports: [newOrUpdatedReport],
                checkliststate: checklistState,
            };

            await updateMission(updatedMission);
            
            if (isDraft) {
                addToast('پیش‌نویس گزارش با موفقیت ذخیره شد.', 'success');
            } else if (deviationReason) {
                addToast('گزارش نهایی همراه با توضیح انحراف زمانی ثبت شد.', 'success');
            } else {
                addToast('گزارش نهایی شما ثبت شد.', 'success');
            }
            handleClose();
        } catch (error) {
            addToast('خطا در ثبت گزارش.', 'error');
        } finally {
            setIsSubmitting(false);
            setGlobalLoading(false);
        }
    };

    const handleReportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mission) return;

        // If status is ONGOING, we are saving a draft.
        if (reportStatus === MissionStatus.ONGOING) {
            processAndSubmitReport(undefined, true);
            return;
        }

        // --- Logic for FINAL submission when status is COMPLETED ---
        if (!reportData.departureTime || !reportData.returnTime) {
            addToast("لطفا زمان خروج و برگشت را مشخص کنید.", "error");
            return;
        }

        const missionStart = new Date(mission.starttime);
        const reportedEnd = new Date(reportData.returnTime);
        const missionEnd = new Date(mission.endtime);
        const now = new Date();

        if (isNaN(reportedEnd.getTime())) {
            addToast("فرمت زمان وارد شده نامعتبر است.", "error");
            return;
        }

        // Rule A: No pre-emptive reporting
        if (now < missionStart) {
            addToast("هنوز زمان مأموریت فرا نرسیده است؛ اجازه ثبت گزارش وجود ندارد.", "error");
            return;
        }
        
        // Rule B: Late end check
        const isLateEnd = reportedEnd > missionEnd;

        if (isLateEnd) {
            setIsDeviationModalOpen(true);
        } else {
            // Rule C: Valid report
            processAndSubmitReport();
        }
    };

    const handleDeviationSubmit = (reason: string) => {
        processAndSubmitReport(reason, false);
        setIsDeviationModalOpen(false);
    };

    const handleClose = () => {
        onClose();
    };

    const renderCreateForm = () => (
         <form id="mission-create-form" onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="موضوع ماموریت" name="subject" value={createData.subject} onChange={handleCreateChange} required />
                <Input label="محل ماموریت" name="location" value={createData.location} onChange={handleCreateChange} required />
                <PersianDateTimePicker label="زمان شروع" value={createData.starttime} onChange={(val) => setCreateData(p => ({...p, starttime: val}))} required />
                <PersianDateTimePicker label="زمان پایان" value={createData.endtime} onChange={(val) => setCreateData(p => ({...p, endtime: val}))} required />
                <Select label="مسئول انجام" name="assignedto" value={createData.assignedto} onChange={handleCreateChange} required>
                    <option value="" disabled>یک کارمند را انتخاب کنید</option>
                    {employeeUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </Select>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">چک‌لیست (اختیاری)</label>
                     <Button type="button" variant="secondary" onClick={() => setIsChecklistModalOpen(true)}>
                         انتخاب مراحل چک‌لیست ({selectedChecklist.length} دسته)
                     </Button>
                </div>
            </div>
        </form>
    );

    const renderFullView = () => {
        if (!mission) return null;
        const isMissionAssignedToCurrentUser = currentUser?.id === mission.assignedto;
        const isReturnTimeDisabled = reportStatus === MissionStatus.ONGOING;
        
        return (
             <div className="space-y-6">
                <MissionReportView mission={mission} />
                
                {isMissionAssignedToCurrentUser && mission.delegated_by && (
                     <fieldset className="px-4 pt-2 pb-4 border rounded-md">
                        <legend className="text-lg font-semibold px-2 text-gray-700">گزارش‌های قبلی</legend>
                        {mission.reports.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">گزارشی برای این ماموریت ثبت نشده است.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                               {mission.reports.map((report, index) => (
                                   <li key={report.id} className="py-3 flex justify-between items-center">
                                       <div>
                                           <p className="font-semibold text-gray-800">
                                                گزارش شماره {toPersianDigits(index + 1)}
                                                <span className="text-sm font-normal text-gray-500 mr-2">
                                                    (ثبت توسط: {findUserById(report.reporterId)?.fullName || 'ناشناس'})
                                                </span>
                                           </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                ثبت شده در: {formatReportDateTime(report.createdAt)}
                                            </p>
                                       </div>
                                        <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => openViewSingleReportModal(mission, report)}>
                                            مشاهده جزئیات
                                        </Button>
                                   </li>
                               ))}
                            </ul>
                        )}
                    </fieldset>
                )}

                {isMissionAssignedToCurrentUser && (
                     <form id="mission-report-form" onSubmit={handleReportSubmit} className="space-y-6">
                         <fieldset className="px-4 pt-2 pb-4 border rounded-md">
                            <legend className="text-lg font-semibold px-2 text-gray-700">ثبت و ویرایش گزارش</legend>
                            <div className="space-y-6 mt-4">
                                <div>
                                    <Select 
                                        label="وضعیت ماموریت" 
                                        id="reportStatus"
                                        value={reportStatus}
                                        onChange={(e) => setReportStatus(e.target.value as MissionStatus)}
                                        required
                                     >
                                         <option value={MissionStatus.ONGOING}>در حال انجام</option>
                                         <option value={MissionStatus.COMPLETED}>تکمیل شده</option>
                                     </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PersianDateTimePicker label="زمان خروج" value={reportData.departureTime} onChange={(val) => setReportData(p => ({...p, departureTime: val}))} required />
                                    <Tooltip
                                        disabled={!isReturnTimeDisabled}
                                        content="تا زمانی که مأموریت در وضعیت «در حال انجام» است، امکان ثبت تاریخ بازگشت وجود ندارد. پس از تغییر وضعیت به «تکمیل شده» می‌توانید گزارش نهایی را ثبت کنید."
                                    >
                                        <PersianDateTimePicker 
                                            label="زمان برگشت" 
                                            value={reportData.returnTime} 
                                            onChange={(val) => setReportData(p => ({...p, returnTime: val}))} 
                                            required={!isReturnTimeDisabled}
                                            disabled={isReturnTimeDisabled}
                                        />
                                    </Tooltip>
                                </div>
                                {mission.checklist.length > 0 && (
                                     <fieldset className="px-4 pt-2 pb-4 border rounded-md bg-white">
                                        <legend className="text-md font-semibold px-2 text-gray-600">چک‌لیست انجام کار</legend>
                                        <MissionChecklist
                                            checklist={mission.checklist}
                                            checklistState={checklistState}
                                            onStateChange={setChecklistState}
                                            isReadOnly={false}
                                        />
                                    </fieldset>
                                )}
                                <div>
                                    <Textarea 
                                        id="summary" 
                                        label="شرح گزارش" 
                                        value={reportData.summary} 
                                        onChange={(e) => setReportData(p => ({...p, summary: e.target.value}))} 
                                        required 
                                    />
                                </div>
                            </div>
                        </fieldset>
                    </form>
                )}
            </div>
        );
    };
    
    const renderReportView = () => {
         if (!mission) return null;
         return (
             <div className="space-y-6">
                <MissionReportView mission={mission} />
                <fieldset className="px-4 pt-2 pb-4 border rounded-md">
                    <legend className="text-lg font-semibold px-2 text-gray-700">گزارش‌های ثبت شده</legend>
                    {mission.reports.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">گزارشی برای این ماموریت ثبت نشده است.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                           {mission.reports.map((report, index) => (
                               <li key={report.id} className="py-3 flex justify-between items-center">
                                   <div>
                                       <p className="font-semibold text-gray-800">
                                            گزارش شماره {toPersianDigits(index + 1)}
                                            <span className="text-sm font-normal text-gray-500 mr-2">
                                                (ثبت توسط: {findUserById(report.reporterId)?.fullName || 'ناشناس'})
                                            </span>
                                       </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            ثبت شده در: {formatReportDateTime(report.createdAt)}
                                        </p>
                                   </div>
                                    <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => openViewSingleReportModal(mission, report)}>
                                        مشاهده جزئیات
                                    </Button>
                               </li>
                           ))}
                        </ul>
                    )}
                </fieldset>
            </div>
         );
    };

    let title, content, footer;
    const isReportFormVisible = modalView === 'FULL' && currentUser?.id === mission?.assignedto;
    const submitButtonText = reportStatus === MissionStatus.ONGOING ? 'ذخیره پیش‌نویس' : 'ثبت گزارش نهایی';

    switch (modalView) {
        case 'CREATE':
            title = 'ثبت ماموریت جدید';
            content = renderCreateForm();
            footer = (
                <div className="flex space-x-3 space-x-reverse">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>لغو</Button>
                    <Button type="submit" form="mission-create-form" isLoading={isSubmitting}>
                        ثبت ماموریت
                    </Button>
                </div>
            );
            break;
        case 'FULL':
            title = 'مشاهده و ثبت گزارش ماموریت';
            content = renderFullView();
            footer = (
                <div className="flex space-x-3 space-x-reverse">
                    <Button type="button" variant="secondary" onClick={handleClose}>بستن</Button>
                    {isReportFormVisible && (
                        <Button type="submit" form="mission-report-form" isLoading={isSubmitting}>
                            {submitButtonText}
                        </Button>
                    )}
                </div>
            );
            break;
        case 'VIEW_REPORT':
            title = 'مشاهده گزارش ماموریت';
            content = renderReportView();
            footer = (
                 <div className="flex justify-center w-full">
                    <Button type="button" variant="secondary" onClick={handleClose}>بستن</Button>
                 </div>
            );
            break;
        default:
            title = '';
            content = null;
            footer = null;
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} title={title} footer={footer}>
                {content}
            </Modal>
            {modalView === 'CREATE' && (
                <ChecklistSelectionModal 
                    isOpen={isChecklistModalOpen}
                    onClose={() => setIsChecklistModalOpen(false)}
                    onSave={handleChecklistSave}
                    initialSelected={
                        selectedChecklist.reduce((acc, item) => {
                            acc[item.category] = item.steps;
                            return acc;
                        }, {} as Record<string, string[]>)
                    }
                />
            )}
            <DeviationReasonModal
                isOpen={isDeviationModalOpen}
                onClose={() => setIsDeviationModalOpen(false)}
                onSubmit={handleDeviationSubmit}
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default MissionForm;