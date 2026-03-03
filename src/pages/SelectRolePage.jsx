import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { sanitizeUserObject } from '../utils/subscriptionUtils';

const SelectRolePage = () => {
    const [role, setRole] = useState('parent');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Get the current user's token from local storage
            const token = localStorage.getItem('token');
            
            // Send the token and the selected role to the new backend endpoint
            const res = await axios.put('http://localhost:5000/api/user/role', { token, role });

            // The backend sends back a new token with the updated role, so we save it
            localStorage.setItem('token', res.data.token);

            // Save the role-specific ID to localStorage
            if (res.data.user) {
                const roleIdField = {
                    parent: 'parentId',
                    therapist: 'therapistId',
                    teacher: 'teacherId',
                    researcher: 'researcherId',
                    admin: 'adminId'
                };
                
                const idField = roleIdField[role];
                if (idField && res.data.user[idField]) {
                    localStorage.setItem(idField, res.data.user[idField]);
                }
                localStorage.setItem('user', JSON.stringify(sanitizeUserObject(res.data.user)));
            }

            // Now, we can decode the new token and redirect to the correct dashboard
            const decodedToken = jwtDecode(res.data.token);
            const userRole = decodedToken.role;

            if (userRole === 'admin') {
                navigate('/admin');
            } else if (userRole === 'researcher') {
                navigate('/research');
            } else if (userRole === 'therapist') {
                navigate('/therapist');
            } else if (userRole === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/dashboard'); // Default for 'parent'
            }
        } catch (error) {
            console.error('Failed to set role:', error);
            // You could show an error message to the user here
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">One Last Step!</h2>
                <p className="text-gray-600 mb-6">To complete your profile, please select your primary role.</p>
                <form onSubmit={handleSubmit}>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white mb-6"
                    >
                        <option value="parent">Parent</option>
                        <option value="therapist">Therapist</option>
                        <option value="researcher">Researcher</option>
                        <option value="teacher">Teacher</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-all"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SelectRolePage;

