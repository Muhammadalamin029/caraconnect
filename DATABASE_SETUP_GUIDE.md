# CaraConnect Database Setup Guide

This guide will help you set up the database tables in your Supabase project.

## 🚀 Quick Setup

### **Step 1: Access Supabase SQL Editor**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Click "New Query"**

### **Step 2: Run the Database Setup Script**

1. **Copy the entire contents** of `database-setup.sql`
2. **Paste it into the SQL Editor**
3. **Click "Run"** (or press Ctrl+Enter)

### **Step 3: Verify Tables Were Created**

1. **Go to Table Editor** (in the left sidebar)
2. **You should see these tables:**
   - `users`
   - `tasks`
   - `wallets`
   - `transactions`
   - `messages`
   - `reviews`
   - `notifications`
   - `platform_settings`
   - `escrows`

## 📋 What the Script Creates

### **Tables**
- **users** - User profiles and authentication data
- **tasks** - Task management and lifecycle
- **wallets** - User wallet balances and escrow
- **transactions** - Payment history and records
- **messages** - Real-time chat between users
- **reviews** - User ratings and feedback
- **notifications** - Push notifications and alerts
- **platform_settings** - App configuration
- **escrows** - Payment escrow system

### **Indexes**
- Performance indexes on frequently queried columns
- Composite indexes for complex queries
- Full-text search indexes

### **Functions**
- `update_updated_at_column()` - Auto-update timestamps
- `create_user_wallet()` - Auto-create wallet for new users
- `update_user_task_stats()` - Update user statistics
- `send_notification()` - Send notifications
- `calculate_distance()` - Calculate distance between coordinates
- `handle_new_user()` - Handle new user signup

### **Triggers**
- Auto-update `updated_at` timestamps
- Auto-create wallet when user signs up
- Update user statistics when tasks are completed
- Handle new user creation

### **Row Level Security (RLS)**
- Users can only access their own data
- Task participants can view/edit their tasks
- Platform settings are publicly readable
- Admin-only access to sensitive operations

## 🔧 Manual Setup (Alternative)

If you prefer to set up tables manually:

### **1. Create Tables One by One**

```sql
-- Start with users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  -- ... (see full script for complete schema)
);
```

### **2. Add Indexes**

```sql
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_requester_id ON tasks(requester_id);
-- ... (see full script for all indexes)
```

### **3. Enable RLS**

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
```

### **4. Create Policies**

```sql
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
-- ... (see full script for all policies)
```

## 🧪 Testing the Setup

### **1. Test User Creation**

1. **Go to Authentication > Users**
2. **Click "Add user"**
3. **Create a test user**
4. **Check if wallet was created automatically**

### **2. Test Database Access**

1. **Go to Table Editor**
2. **Select the `users` table**
3. **Verify you can see the test user**
4. **Check if `wallets` table has a corresponding entry**

### **3. Test RLS Policies**

1. **Try to insert data** as different users
2. **Verify users can only see their own data**
3. **Test admin permissions**

## 🔍 Troubleshooting

### **Common Issues**

1. **"Permission denied"** - Check RLS policies
2. **"Table doesn't exist"** - Run the full script
3. **"Function doesn't exist"** - Check if all functions were created
4. **"Trigger failed"** - Check trigger functions

### **Debug Steps**

1. **Check Supabase logs** in the dashboard
2. **Verify all tables exist** in Table Editor
3. **Test individual functions** in SQL Editor
4. **Check RLS policies** in Authentication > Policies

## 📊 Sample Data (Optional)

To add sample data for testing:

```sql
-- Insert sample platform settings
INSERT INTO platform_settings (id, commission_percentage, minimum_task_amount, maximum_task_amount)
VALUES ('main', 10.00, 100.00, 50000.00);

-- Insert sample user (replace with your test user ID)
INSERT INTO users (id, email, full_name, is_runner, is_requester)
VALUES (
    'your-user-id-here',
    'test@example.com',
    'Test User',
    true,
    true
);
```

## 🚀 Next Steps

After setting up the database:

1. **Configure your environment variables** (`.env.local`)
2. **Test the application** with `npm run dev`
3. **Create your first user account**
4. **Test all functionality**

## 📚 Additional Resources

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Triggers](https://supabase.com/docs/guides/database/triggers)

Your CaraConnect database is now ready! 🎉
