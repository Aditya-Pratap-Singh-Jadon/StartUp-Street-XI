import { jwtDecode } from 'jwt-decode';

/**
 * Checks if the provided email belongs to the vitstudent domain.
 * @param {string} email 
 * @returns {boolean}
 */
export const isVitStudent = (email) => {
    if (!email || typeof email !== 'string') return false;
    return email.toLowerCase().endsWith('@vitstudent.ac.in');
};

/**
 * Validates a Google JWT credential to ensure it belongs to a vitstudent.
 * @param {string} credential 
 * @returns {boolean}
 */
export const validateGoogleCredential = (credential) => {
    try {
        const decoded = jwtDecode(credential);
        return isVitStudent(decoded.email);
    } catch (e) {
        return false;
    }
};
