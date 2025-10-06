import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

interface DeviationReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isSubmitting: boolean;
}

const DeviationReasonModal: React.FC<DeviationReasonModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim()) {
            onSubmit(reason);
        }
    };

    const handleClose = () => {
        onClose();
    };

    const footer = (
        <div className="flex space-x-3 space-x-reverse">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                لغو
            </Button>
            <Button type="submit" form="deviation-form" disabled={!reason.trim()} isLoading={isSubmitting}>
                ثبت گزارش نهایی
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="توضیح انحراف زمانی"
            footer={footer}
        >
            <form id="deviation-form" onSubmit={handleSubmit}>
                <p className="text-gray-700 leading-relaxed mb-4">
                    زمان پایان گزارش شما از بازه مجاز مأموریت تجاوز کرده است.
                    <br />
                    لطفاً علت این تأخیر را بنویسید (اجباری):
                </p>
                <Textarea
                    id="deviationReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="علت را اینجا بنویسید..."
                    rows={5}
                    autoFocus
                />
            </form>
        </Modal>
    );
};

export default DeviationReasonModal;