-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('work-images', 'work-images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储策略
CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'work-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'work-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'work-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
