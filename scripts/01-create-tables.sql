-- 创建用户配置表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建工作记录表
CREATE TABLE IF NOT EXISTS work_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('日常审计', '项目进度', '其他', '本周遗留问题', '下周计划')),
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_work_items_user_id ON work_items(user_id);
CREATE INDEX IF NOT EXISTS idx_work_items_date ON work_items(date);
CREATE INDEX IF NOT EXISTS idx_work_items_category ON work_items(category);

-- 启用行级安全策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;

-- 用户配置表的安全策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 工作记录表的安全策略
CREATE POLICY "Users can view own work items" ON work_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work items" ON work_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work items" ON work_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work items" ON work_items
  FOR DELETE USING (auth.uid() = user_id);
