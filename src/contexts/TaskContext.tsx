import { createContext, useContext, useState, useEffect, useCallback, type FC, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getTasks, 
  getAllTasks,
  createTask, 
  updateTask, 
  getTask
} from '../firebase/database';
import type { Task } from '../firebase/schema';

interface TaskContextType {
  tasks: Task[];
  userTasks: Task[];
  loading: boolean;
  createNewTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  updateTaskStatus: (taskId: string, status: Task['status'], updates?: Partial<Task>) => Promise<void>;
  acceptTask: (taskId: string, runnerId: string) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string, reason?: string) => Promise<void>;
  getTaskById: (taskId: string) => Promise<Task | null>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial tasks
  useEffect(() => {
    loadTasks();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    // Load user's tasks
    const loadUserTasks = async () => {
      try {
        const requesterTasks = await getTasks({ requester_id: user.uid });
        const runnerTasks = await getTasks({ runner_id: user.uid });
        setUserTasks([...requesterTasks, ...runnerTasks]);
      } catch (error) {
        console.error('Error loading user tasks:', error);
      }
    };

    loadUserTasks();
  }, [user]);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      console.log('=== LOAD TASKS CONTEXT DEBUG ===');
      console.log('Loading all tasks...');
      
      const allTasks = await getAllTasks();
      console.log('All tasks loaded:', allTasks);
      
      // Filter for pending tasks in JavaScript
      const pendingTasks = allTasks.filter(task => task.status === 'pending');
      console.log('Filtered pending tasks:', pendingTasks);
      
      setTasks(pendingTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    console.log('=== CREATE NEW TASK DEBUG ===');
    console.log('User:', user);
    console.log('UserProfile:', userProfile);
    console.log('TaskData:', taskData);
    
    if (!user || !userProfile) {
      throw new Error('User must be authenticated to create tasks');
    }

    const { getPlatformSettings, getWallet } = await import('../firebase/database');
    console.log('Getting platform settings...');
    const settings = await getPlatformSettings();
    console.log('Platform settings:', settings);
    
    if (!settings) {
      throw new Error('Platform settings not found');
    }

    // Check if user has sufficient wallet balance
    console.log('Checking user wallet balance...');
    const userWallet = await getWallet(user.uid);
    if (!userWallet) {
      console.log('No wallet found, user needs to set up wallet');
      throw new Error('WALLET_SETUP_REQUIRED');
    }
    
    const totalAmount = taskData.reward_amount;
    if (userWallet.balance < totalAmount) {
      throw new Error(`Insufficient wallet balance. You need ₦${totalAmount.toLocaleString()} but only have ₦${userWallet.balance.toLocaleString()}. Please add funds to your wallet.`);
    }
    
    console.log('Wallet balance check passed:', {
      required: totalAmount,
      available: userWallet.balance,
      remaining: userWallet.balance - totalAmount
    });

    // Calculate commission
    const commissionAmount = (taskData.reward_amount * settings.commission_percentage) / 100;
    const runnerAmount = taskData.reward_amount - commissionAmount;

    console.log('Commission calculation:', {
      reward_amount: taskData.reward_amount,
      commission_percentage: settings.commission_percentage,
      commission_amount: commissionAmount,
      runner_amount: runnerAmount
    });

    const finalTaskData = {
      ...taskData,
      requester_id: user.uid,
      commission_amount: commissionAmount,
      runner_amount: runnerAmount,
    };
    
    console.log('Final task data:', finalTaskData);
    console.log('Creating task in database...');
    
    const newTask = await createTask(finalTaskData);
    console.log('Task created successfully:', newTask);

    // Deduct the amount from user's wallet and create escrow
    try {
      console.log('Deducting amount from wallet and creating escrow...');
      const { updateWallet, createTransaction, createEscrow } = await import('../firebase/database');
      
      // Deduct amount from wallet and move to escrow
      const newBalance = userWallet.balance - totalAmount;
      const newEscrowBalance = userWallet.escrow_balance + totalAmount;
      console.log('=== WALLET DEDUCTION DEBUG ===');
      console.log('Before deduction:', {
        walletId: userWallet.id,
        currentBalance: userWallet.balance,
        currentEscrowBalance: userWallet.escrow_balance,
        taskAmount: totalAmount,
        newBalance: newBalance,
        newEscrowBalance: newEscrowBalance
      });
      
      await updateWallet(userWallet.id, { 
        balance: newBalance,
        escrow_balance: newEscrowBalance,
        total_spent: userWallet.total_spent + totalAmount
      }, user.uid);
      
      // Verify the wallet was updated by fetching it again
      const { getWallet: verifyWallet } = await import('../firebase/database');
      const updatedWallet = await verifyWallet(user.uid);
      console.log('After deduction verification:', {
        walletId: userWallet.id,
        updatedBalance: updatedWallet?.balance,
        updatedEscrowBalance: updatedWallet?.escrow_balance,
        expectedBalance: newBalance,
        expectedEscrowBalance: newEscrowBalance,
        deductionSuccessful: updatedWallet?.balance === newBalance,
        escrowUpdateSuccessful: updatedWallet?.escrow_balance === newEscrowBalance
      });
      
      // Create transaction record
      await createTransaction({
        user_id: user.uid,
        type: 'task_payment',
        amount: totalAmount,
        description: `Payment for task: ${taskData.title}`,
        task_id: newTask.id,
        status: 'completed',
      });
      
      // Create escrow
      await createEscrow({
        task_id: newTask.id,
        requester_id: user.uid,
        runner_id: '', // Will be set when task is accepted
        amount: totalAmount,
        commission_amount: commissionAmount,
        status: 'active',
      });
      
      console.log('Wallet deduction and escrow creation completed');
      
      // Trigger wallet refresh by dispatching a custom event
      console.log('Dispatching wallet update event for user:', user.uid);
      window.dispatchEvent(new CustomEvent('walletUpdated', { 
        detail: { userId: user.uid, type: 'task_payment' } 
      }));
      console.log('Wallet update event dispatched');
      
      // Also try to refresh wallet context directly if possible
      try {
        // Force a small delay to ensure the wallet update has been processed
        setTimeout(() => {
          console.log('Triggering additional wallet refresh after delay');
          window.dispatchEvent(new CustomEvent('walletUpdated', { 
            detail: { userId: user.uid, type: 'task_payment_retry' } 
          }));
        }, 1000);
        
        // Also try immediate refresh
        setTimeout(() => {
          console.log('Triggering immediate wallet refresh');
          window.dispatchEvent(new CustomEvent('walletUpdated', { 
            detail: { userId: user.uid, type: 'task_payment_immediate' } 
          }));
        }, 100);
      } catch (error) {
        console.log('Could not trigger additional wallet refresh:', error);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      // If payment fails, we should ideally rollback the task creation
      // For now, we'll just log the error
      throw new Error('Task created but payment processing failed. Please contact support.');
    }

    return newTask;
  }, [user, userProfile]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status'], updates?: Partial<Task>) => {
    const updateData: Partial<Task> = {
      status,
      ...updates,
    };

    // Add timestamp based on status - Firestore will handle timestamps
    await updateTask(taskId, updateData);
  }, []);

  const acceptTask = useCallback(async (taskId: string, runnerId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to accept tasks');
    }

    // Update task with runner and status
    await updateTaskStatus(taskId, 'accepted', { runner_id: runnerId });

    // Get task details and update runner's escrow balance
    const { createEscrow, getWallet, updateWallet, createTransaction } = await import('../firebase/database');
    const task = await getTask(taskId);
    
    if (task) {
      // Create escrow record
      await createEscrow({
        task_id: taskId,
        requester_id: task.requester_id,
        runner_id: runnerId,
        amount: task.reward_amount,
        commission_amount: task.commission_amount,
        status: 'active',
      });

      // Update runner's escrow balance
      const runnerWallet = await getWallet(runnerId);
      if (runnerWallet) {
        const newEscrowBalance = runnerWallet.escrow_balance + task.runner_amount;
        await updateWallet(runnerWallet.id, { 
          escrow_balance: newEscrowBalance 
        }, runnerId);

        // Create transaction record for runner
        await createTransaction({
          user_id: runnerId,
          type: 'escrow_hold',
          amount: task.runner_amount,
          description: `Escrow held for accepted task: ${task.title}`,
          task_id: taskId,
          status: 'completed',
        });

        // Trigger wallet refresh for runner
        window.dispatchEvent(new CustomEvent('walletUpdated', { 
          detail: { userId: runnerId, type: 'escrow_hold' } 
        }));

        console.log('Runner escrow balance updated:', newEscrowBalance);
      }
    }
  }, [user, updateTaskStatus]);

  const startTask = useCallback(async (taskId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to start tasks');
    }

    // Get the task details first
    const task = await getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Verify the user is the runner
    if (task.runner_id !== user.uid) {
      throw new Error('Only the assigned runner can start this task');
    }

    // Update task status to in_progress
    await updateTaskStatus(taskId, 'in_progress', { 
      started_at: new Date() 
    });

    console.log('Task started successfully');
  }, [user, updateTaskStatus]);

  const completeTask = useCallback(async (taskId: string) => {
    console.log('=== COMPLETE TASK DEBUG ===');
    console.log('Task ID:', taskId);
    
    // Get the task details first
    const task = await getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    console.log('Task details:', task);
    console.log('Runner amount:', task.runner_amount);
    
    // Update task status
    await updateTaskStatus(taskId, 'completed');
    
    // Update both requester and runner wallets
    if (task.runner_id && task.runner_amount > 0) {
      console.log('Updating wallets with amount:', task.runner_amount);
      
      // Note: We can't use hooks here, so we'll call the database functions directly
      const { updateWallet, createTransaction, updateEscrow, createNotification, getWallet } = await import('../firebase/database');
      
      // Get both wallets
      const [requesterWallet, runnerWallet] = await Promise.all([
        getWallet(task.requester_id),
        getWallet(task.runner_id)
      ]);
      
      if (requesterWallet && runnerWallet) {
        // Release escrow from requester's wallet
        const requesterNewEscrowBalance = requesterWallet.escrow_balance - task.reward_amount;
        await updateWallet(requesterWallet.id, { 
          escrow_balance: requesterNewEscrowBalance 
        }, task.requester_id);
        
        // Update runner's wallet balance and release escrow
        const runnerNewBalance = runnerWallet.balance + task.runner_amount;
        const runnerNewEscrowBalance = runnerWallet.escrow_balance - task.runner_amount;
        await updateWallet(runnerWallet.id, { 
          balance: runnerNewBalance,
          escrow_balance: runnerNewEscrowBalance,
          total_earned: runnerWallet.total_earned + task.runner_amount
        }, task.runner_id);
        
        // Create transaction records for both users
        await Promise.all([
          // Runner earning transaction
          createTransaction({
            user_id: task.runner_id,
            type: 'task_earning',
            amount: task.runner_amount,
            description: `Earnings from task: ${task.title}`,
            task_id: taskId,
            status: 'completed',
          }),
          // Requester escrow release transaction
          createTransaction({
            user_id: task.requester_id,
            type: 'escrow_release',
            amount: task.reward_amount,
            description: `Escrow released for completed task: ${task.title}`,
            task_id: taskId,
            status: 'completed',
          })
        ]);
        
        console.log('Both wallets updated successfully');
        
        // Trigger wallet refresh events for both users
        window.dispatchEvent(new CustomEvent('walletUpdated', { 
          detail: { userId: task.runner_id, type: 'task_earning' } 
        }));
        window.dispatchEvent(new CustomEvent('walletUpdated', { 
          detail: { userId: task.requester_id, type: 'escrow_release' } 
        }));
        
        // Create notification for runner
        try {
          await createNotification({
            user_id: task.runner_id,
            type: 'task_completed',
            title: 'Task Completed Successfully!',
            message: `You've earned ₦${task.runner_amount.toLocaleString()} from completing "${task.title}"`,
            data: {
              task_id: taskId,
              amount: task.runner_amount
            },
            is_read: false,
          });
          console.log('Notification created for runner');
        } catch (error) {
          console.error('Error creating notification:', error);
        }
        
        // Update escrow status to completed
        try {
          const { getEscrowsByTaskId } = await import('../firebase/database');
          const escrows = await getEscrowsByTaskId(taskId);
          if (escrows.length > 0) {
            const escrow = escrows[0]; // Should be only one escrow per task
            await updateEscrow(escrow.id, { 
              status: 'released',
              released_at: new Date()
            });
            console.log('Escrow status updated to released');
          }
        } catch (error) {
          console.error('Error updating escrow status:', error);
        }

        // Create a default review for the runner (requester rates runner)
        try {
          const { createReview, updateUserRating } = await import('../firebase/database');
          await createReview({
            task_id: taskId,
            reviewer_id: task.requester_id,
            reviewee_id: task.runner_id,
            rating: 5, // Default 5-star rating for completed tasks
            comment: 'Task completed successfully!'
          });
          
          // Update runner's rating
          await updateUserRating(task.runner_id);
          console.log('Review created and rating updated for runner');
        } catch (error) {
          console.error('Error creating review:', error);
        }
      } else {
        console.error('Requester or runner wallet not found');
      }
    }
    
    console.log('Task completed successfully');
  }, [updateTaskStatus]);

  const cancelTask = useCallback(async (taskId: string, reason?: string) => {
    console.log('=== CANCEL TASK DEBUG ===');
    console.log('Task ID:', taskId);
    console.log('Cancellation reason:', reason);
    
    // Get the task details first
    const task = await getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    console.log('Task details:', task);
    
    // Update task status
    await updateTaskStatus(taskId, 'cancelled', { 
      cancellation_reason: reason 
    });
    
    // Handle refund logic if task was accepted and has escrow
    if (task.runner_id && task.status === 'accepted') {
      console.log('Processing refund for accepted task');
      
      try {
        const { getEscrowsByTaskId, updateEscrow, updateWallet, createTransaction, createNotification, getWallet } = await import('../firebase/database');
        
        // Get escrow for this task
        const escrows = await getEscrowsByTaskId(taskId);
        if (escrows.length > 0) {
          const escrow = escrows[0];
          console.log('Escrow found:', escrow);
          
          // Refund the full amount to requester and release escrow
          const requesterWallet = await getWallet(task.requester_id);
          if (requesterWallet) {
            const refundAmount = escrow.amount; // Full amount including commission
            const newBalance = requesterWallet.balance + refundAmount;
            const newEscrowBalance = requesterWallet.escrow_balance - refundAmount;
            
            // Update requester's wallet (refund + release escrow)
            await updateWallet(requesterWallet.id, { 
              balance: newBalance,
              escrow_balance: newEscrowBalance
            }, task.requester_id);
            
            // Create refund transaction
            await createTransaction({
              user_id: task.requester_id,
              type: 'refund',
              amount: refundAmount,
              description: `Refund for cancelled task: ${task.title}`,
              task_id: taskId,
              status: 'completed',
            });

            // If runner had accepted the task, release their escrow balance too
            if (task.runner_id) {
              const runnerWallet = await getWallet(task.runner_id);
              if (runnerWallet) {
                const runnerEscrowRelease = task.runner_amount;
                const runnerNewEscrowBalance = runnerWallet.escrow_balance - runnerEscrowRelease;
                
                await updateWallet(runnerWallet.id, { 
                  escrow_balance: runnerNewEscrowBalance 
                }, task.runner_id);

                // Create escrow release transaction for runner
                await createTransaction({
                  user_id: task.runner_id,
                  type: 'escrow_release',
                  amount: runnerEscrowRelease,
                  description: `Escrow released for cancelled task: ${task.title}`,
                  task_id: taskId,
                  status: 'completed',
                });

                // Trigger wallet refresh for runner
                window.dispatchEvent(new CustomEvent('walletUpdated', { 
                  detail: { userId: task.runner_id, type: 'escrow_release' } 
                }));
              }
            }
            
            // Update escrow status to refunded
            await updateEscrow(escrow.id, {
              status: 'refunded',
              refunded_at: new Date()
            });
            
            // Trigger wallet refresh for requester
            window.dispatchEvent(new CustomEvent('walletUpdated', { 
              detail: { userId: task.requester_id, type: 'refund' } 
            }));

            // Notify requester about refund
            await createNotification({
              user_id: task.requester_id,
              type: 'task_cancelled',
              title: 'Task Cancelled - Refund Processed',
              message: `You've been refunded ₦${refundAmount.toLocaleString()} for the cancelled task "${task.title}"`,
              data: {
                task_id: taskId,
                amount: refundAmount
              },
              is_read: false,
            });
            
            // Notify runner about cancellation
            await createNotification({
              user_id: task.runner_id,
              type: 'task_cancelled',
              title: 'Task Cancelled',
              message: `The task "${task.title}" has been cancelled. Reason: ${reason || 'No reason provided'}`,
              data: {
                task_id: taskId
              },
              is_read: false,
            });
            
            console.log('Refund processed successfully');
            
            // Trigger wallet refresh by dispatching a custom event
            window.dispatchEvent(new CustomEvent('walletUpdated', { 
              detail: { userId: task.requester_id, type: 'refund' } 
            }));
          } else {
            console.error('Requester wallet not found');
          }
        } else {
          console.log('No escrow found for this task');
          // If task was accepted but no escrow found, still need to handle runner's escrow
          if (task.runner_id) {
            const runnerWallet = await getWallet(task.runner_id);
            if (runnerWallet) {
              const runnerEscrowRelease = task.runner_amount;
              const runnerNewEscrowBalance = runnerWallet.escrow_balance - runnerEscrowRelease;
              
              await updateWallet(runnerWallet.id, { 
                escrow_balance: runnerNewEscrowBalance 
              }, task.runner_id);

              // Create escrow release transaction for runner
              await createTransaction({
                user_id: task.runner_id,
                type: 'escrow_release',
                amount: runnerEscrowRelease,
                description: `Escrow released for cancelled task: ${task.title}`,
                task_id: taskId,
                status: 'completed',
              });

              // Trigger wallet refresh for runner
              window.dispatchEvent(new CustomEvent('walletUpdated', { 
                detail: { userId: task.runner_id, type: 'escrow_release' } 
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing refund:', error);
        // Don't throw error here to avoid blocking task cancellation
      }
    } else {
      console.log('No refund needed - task was not accepted or no runner assigned');
    }
    
    console.log('Task cancelled successfully');
  }, [updateTaskStatus]);

  const getTaskById = useCallback(async (taskId: string): Promise<Task | null> => {
    console.log('=== GET TASK BY ID DEBUG ===');
    console.log('Task ID:', taskId);
    console.log('Calling getTask from database...');
    
    const task = await getTask(taskId);
    console.log('Task from database:', task);
    
    return task;
  }, []);


  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  const value: TaskContextType = {
    tasks,
    userTasks,
    loading,
    createNewTask,
    updateTaskStatus,
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    getTaskById,
    refreshTasks,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
