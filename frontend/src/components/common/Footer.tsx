import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Footer = () => {
    const { user } = useAuth();

    return (
        <footer className="bg-paddock-dark border-t border-paddock-lightgray py-8 mt-12 mb-0">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-paddock-red flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 3h14l-1 14H4L3 3z" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold tracking-wider">
                                <span className="text-white">PADDOCK</span>
                                <span className="text-paddock-red">PULSE</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Paddock Pulse</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Link to="/dashboard" className="text-gray-400 hover:text-white transition text-sm">Dashboard</Link>
                        <Link to="/compare-tips" className="text-gray-400 hover:text-white transition text-sm">Compare Tips</Link>
                        <Link to="/season-predictions" className="text-gray-400 hover:text-white transition text-sm">Season Predictions</Link>
                        <Link to="/leaderboard" className="text-gray-400 hover:text-white transition text-sm">Leaderboard</Link>
                        <Link to="/validations" className="text-gray-400 hover:text-white transition text-sm">Validations</Link>
                        {user?.is_admin && (
                            <Link to="/admin" className="text-paddock-coral hover:text-paddock-red transition text-sm font-bold">Admin</Link>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
};
