import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Input from './ui/Input';
import Button from './ui/Button';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(username, password);
            // On successful login, the AppContent component will automatically render the dashboard
        } catch (err) {
            let errorMessage = 'نام کاربری یا رمز عبور اشتباه است.'; // Default message
            if (err instanceof Error) {
                // A "Failed to fetch" error is often a sign of a network issue or a CORS problem.
                if (err.message.toLowerCase().includes('failed to fetch')) {
                    errorMessage = 'خطا در ارتباط با سرور. لطفا اتصال اینترنت خود را بررسی کرده و از صحیح بودن تنظیمات CORS در Supabase اطمینان حاصل کنید.';
                } else {
                    errorMessage = err.message;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">ورود به سیستم</h2>
                    <p className="mt-2 text-sm text-gray-600">برای دسترسی به پنل کاربری خود وارد شوید</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="username"
                        label="نام کاربری"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        id="password"
                        label="رمز عبور"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            ورود
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;