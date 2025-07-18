import { useState, useEffect } from 'react';
import { apiBaseTour } from '../config';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 🔄 Load last user from cache
    useEffect(() => {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
            try {
                const parsed = JSON.parse(cachedUser);
                if (parsed.email) setEmail(parsed.email);
            } catch (err) {
                console.error('Failed to parse cached user:', err);
            }
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${apiBaseTour}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.id) {
                localStorage.setItem('userId', data.id);
                localStorage.setItem('user', JSON.stringify(data));
                navigate('/dashboard');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Server error. Please try again.');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <h2>Login to TourWise</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="error">{error}</p>}

                <button type="submit">Login</button>
            </form>
        </div>
    );
}
