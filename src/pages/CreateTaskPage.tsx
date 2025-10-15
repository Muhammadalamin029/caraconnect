import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the proper task creation page
    navigate('/tasks/create', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
};

export default CreateTaskPage;
