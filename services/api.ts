import { createClient } from '@supabase/supabase-js';
import { Mission, User, NewUserData, ChecklistItem, DelegationStatus, MissionStatus } from '../types';

const CURRENT_USER_KEY = 'currentUser';

// --- Supabase Configuration ---
// IMPORTANT: Replace with your actual Supabase project URL and anon key.
// You can find these in your Supabase project dashboard under Settings > API.
//
// CORS NOTE: For this application to connect to Supabase from the browser,
// you MUST add your application's domain to the CORS allowed origins list
// in your Supabase project dashboard under:
// Project Settings > API > CORS configuration
const supabaseUrl = 'https://xqypcmddvgzossnybhzq.supabase.co'; // e.g., 'https://xyz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeXBjbWRkdmd6b3NzbnliaHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM4ODgsImV4cCI6MjA3MzkyOTg4OH0.c0HxU3yvf50Z9eFhO7uJkY6mBtOEKvDYQ6HfRfufAGw'; // e.g., 'ey...'

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to handle Supabase responses
const handleSupabaseError = (error: any) => {
    if (!error) return;

    // Log the full error for debugging, which is more useful than [object Object]
    console.error('Supabase API Error:', JSON.stringify(error, null, 2));

    let errorMessage = error.message || 'خطای غیرمنتظره‌ای در ارتباط با پایگاه داده رخ داد.';
    
    // Supabase errors often have details and hints that are useful for the user.
    if (error.details) {
        errorMessage += ` (${error.details})`;
    }
    if (error.hint) {
        errorMessage += ` - ${error.hint}`;
    }

    throw new Error(errorMessage);
};


// --- Auth API ---
// This replicates the insecure server logic. In a real application,
// you should use Supabase Auth with email/password and Row Level Security.
const login = async (username: string, pass: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', username)
        .limit(1);

    handleSupabaseError(error);
    
    const user = data?.[0];

    if (!user) {
        throw new Error("نام کاربری نامعتبر است.");
    }

    if (user.password !== pass) {
        throw new Error("رمز عبور نامعتبر است.");
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
};

const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    try {
        return JSON.parse(userJson) as User;
    } catch (e) {
        return null;
    }
};

// --- User API ---
const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    handleSupabaseError(error);
    return data || [];
};

const addUser = async (userData: User) => {
    const { error } = await supabase.from('users').insert(userData);
    handleSupabaseError(error);
};

const updateUser = async (userId: string, updatedData: Partial<NewUserData>) => {
    const { error } = await supabase.from('users').update(updatedData).eq('id', userId);
    handleSupabaseError(error);

    const currentUser = getCurrentUser();
    if (currentUser?.id === userId) {
        const { data: refreshedUser, error: userError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        handleSupabaseError(userError);
        if (refreshedUser) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(refreshedUser));
        }
    }
};

const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    handleSupabaseError(error);
};

// --- Mission API ---
const getMissions = async (): Promise<Mission[]> => {
    const { data, error } = await supabase.from('missions').select('*');
    handleSupabaseError(error);
    return data || [];
};

type AddMissionPayload = {
    subject: string;
    location: string;
    starttime: string;
    endtime: string;
    assignedto: string;
    checklist: ChecklistItem[];
    createdby: string;
};

const addMission = async (missionPayload: AddMissionPayload) => {
    const { checklist } = missionPayload;
    const checkliststate: { [key: string]: { [key: string]: boolean } } = {};
    if (checklist && Array.isArray(checklist)) {
        checklist.forEach(categoryItem => {
            if (categoryItem.category && categoryItem.steps && Array.isArray(categoryItem.steps)) {
                checkliststate[categoryItem.category] = {};
                categoryItem.steps.forEach(step => {
                    checkliststate[categoryItem.category][step] = false;
                });
            }
        });
    }

    const missionToInsert = {
        ...missionPayload,
        id: `M${Date.now()}`,
        status: MissionStatus.NEW,
        createdat: new Date().toISOString(),
        checkliststate: checkliststate,
        reports: [],
        delegated_by: null,
        delegation_target: null,
        delegation_reason: null,
        delegation_status: null,
        // is_read: false, // WORKAROUND: Temporarily removed to prevent app crash if the column doesn't exist.
        // The proper fix is to add an `is_read` (boolean, default false) column to the 'missions' table in Supabase.
    };

    const { error } = await supabase.from('missions').insert(missionToInsert);
    handleSupabaseError(error);
};

const updateMission = async (updatedMission: Mission) => {
    const updateData = { ...updatedMission };
    // @ts-ignore
    delete updateData.id;
    const { error } = await supabase.from('missions').update(updateData).eq('id', updatedMission.id);
    handleSupabaseError(error);
};

const deleteMissionsByUserId = async (userId: string) => {
    const { error } = await supabase.from('missions').delete().eq('assignedto', userId);
    handleSupabaseError(error);
};

// --- Delegation API ---
const delegateMissionRequest = async (missionId: string, targetUserId: string, reason: string, initiatorId: string) => {
    const { data: mission, error } = await supabase.from('missions').select('*').eq('id', missionId).maybeSingle();
    handleSupabaseError(error);
    if (!mission) throw new Error('ماموریت یافت نشد.');
    if (mission.assignedto !== initiatorId) throw new Error('شما مسئول این ماموریت نیستید.');

    const updateData = {
        delegated_by: initiatorId,
        delegation_target: targetUserId,
        delegation_reason: reason,
        delegation_status: DelegationStatus.PENDING,
    };
    const { error: updateError } = await supabase.from('missions').update(updateData).eq('id', missionId);
    handleSupabaseError(updateError);
};

const acceptDelegation = async (missionId: string, userId: string) => {
    const { data: mission, error } = await supabase.from('missions').select('*').eq('id', missionId).maybeSingle();
    handleSupabaseError(error);
    if (!mission) throw new Error('ماموریت یافت نشد.');
    if (mission.delegation_target !== userId) throw new Error('این ماموریت به شما ارجاع داده نشده است.');

    const updateData = {
        assignedto: userId,
        delegation_status: DelegationStatus.ACCEPTED,
    };
    const { error: updateError } = await supabase.from('missions').update(updateData).eq('id', missionId);
    handleSupabaseError(updateError);
};

const rejectDelegation = async (missionId: string, userId: string) => {
    const { data: mission, error } = await supabase.from('missions').select('*').eq('id', missionId).maybeSingle();
    handleSupabaseError(error);
    if (!mission) throw new Error('ماموریت یافت نشد.');
    if (mission.delegation_target !== userId) throw new Error('این ماموریت به شما ارجاع داده نشده است.');

    const updateData = {
        delegation_status: DelegationStatus.REJECTED,
    };
    const { error: updateError } = await supabase.from('missions').update(updateData).eq('id', missionId);
    handleSupabaseError(updateError);
};

const clearDelegation = async (missionId: string, userId: string) => {
    const { data: mission, error } = await supabase.from('missions').select('*').eq('id', missionId).maybeSingle();
    handleSupabaseError(error);
    if (!mission) throw new Error('ماموریت یافت نشد.');
    if (mission.delegated_by !== userId) throw new Error('فقط ارجاع دهنده میتواند وضعیت را پاک کند.');

    const updateData = {
        delegated_by: null,
        delegation_target: null,
        delegation_reason: null,
        delegation_status: null,
    };
    const { error: updateError } = await supabase.from('missions').update(updateData).eq('id', missionId);
    handleSupabaseError(updateError);
};

const markMissionsAsRead = async (missionIds: string[], userId: string) => {
    if (missionIds.length === 0) return;
    
    // WORKAROUND: The following code is commented out to prevent a crash if the `is_read` column
    // does not exist in the 'missions' table. This means notifications will not be marked as read.
    // THE PERMANENT FIX: Add an `is_read` boolean column with a default of `false` to your
    // 'missions' table in the Supabase dashboard. Then, uncomment this code.
    /*
    const { error } = await supabase
        .from('missions')
        .update({ is_read: true })
        .in('id', missionIds)
        .eq('assignedto', userId);
    handleSupabaseError(error);
    */
};

export const api = {
    login,
    logout,
    getCurrentUser,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getMissions,
    addMission,
    updateMission,
    deleteMissionsByUserId,
    delegateMissionRequest,
    acceptDelegation,
    rejectDelegation,
    clearDelegation,
    markMissionsAsRead,
};