import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchTask = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/tasks/${id}`);
      setTask(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to fetch task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/tasks/${id}`,
        formData
      );
      setTask(response.data);
      setEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/tasks/${id}/status`,
        { status: newStatus }
      );
      setTask(response.data);
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!task) {
    return <div className="text-center py-12">Task not found</div>;
  }

  const canEdit = isAdmin || isManager || task.assigned_to === user?.id;

  return (
    <div>
      <button
        onClick={() => navigate('/tasks')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Tasks
      </button>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            {editing ? (
              <input
                type="text"
                className="text-2xl font-bold border rounded-md px-3 py-2 w-full"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            )}
            
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="4"
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.due_date?.slice(0, 16) || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700">{task.description || 'No description provided.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={task.status === 'completed' || task.status === 'cancelled'}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                        (task.status === 'completed' || task.status === 'cancelled') ? 'bg-gray-100' : ''
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <p className="mt-1 text-gray-900 capitalize">{task.priority}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                  <p className="mt-1 text-gray-900">{task.assigned_user?.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Team</h3>
                  <p className="mt-1 text-gray-900">{task.team?.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                  <p className="mt-1 text-gray-900">{task.creator?.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className="mt-1 text-gray-900">
                    {task.due_date ? new Date(task.due_date).toLocaleString() : 'Not set'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {task.histories && task.histories.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Task History</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {task.histories.map((history) => (
              <div key={history.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{history.user?.name}</span> {history.action}
                    </p>
                    {history.changes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {JSON.stringify(history.changes)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(history.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;