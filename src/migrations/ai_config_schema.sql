-- ============================================================
-- AI Configuration Schema Migration
-- ============================================================

-- 1. Global AI Configuration Table
CREATE TABLE IF NOT EXISTS ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(50) NOT NULL DEFAULT 'gemini',
  model_version VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash',
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
  top_p DECIMAL(3,2) DEFAULT 0.9 CHECK (top_p >= 0 AND top_p <= 1),
  timeout_ms INTEGER DEFAULT 30000 CHECK (timeout_ms > 0),
  system_prompt TEXT NOT NULL DEFAULT 'Bạn là một hỗ trợ khách hàng chuyên nghiệp, lịch sự và hữu ích.',
  tone VARCHAR(50) DEFAULT 'professional', -- professional, friendly, casual, formal
  language VARCHAR(10) DEFAULT 'vi', -- vi, en
  auto_response_enabled BOOLEAN DEFAULT false,
  auto_response_delay_ms INTEGER DEFAULT 5000,
  sentiment_analysis_enabled BOOLEAN DEFAULT true,
  auto_escalation_enabled BOOLEAN DEFAULT true,
  escalation_threshold DECIMAL(3,2) DEFAULT 0.3, -- negative sentiment threshold
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Per-Staff AI Configuration (Override global settings)
CREATE TABLE IF NOT EXISTS staff_ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_name VARCHAR(50),
  model_version VARCHAR(50),
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  top_p DECIMAL(3,2),
  timeout_ms INTEGER,
  system_prompt TEXT,
  tone VARCHAR(50),
  language VARCHAR(10),
  auto_response_enabled BOOLEAN,
  auto_response_delay_ms INTEGER,
  sentiment_analysis_enabled BOOLEAN,
  auto_escalation_enabled BOOLEAN,
  escalation_threshold DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(staff_id)
);

-- 3. AI Config Presets (Templates)
CREATE TABLE IF NOT EXISTS ai_config_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  top_p DECIMAL(3,2) DEFAULT 0.9,
  timeout_ms INTEGER DEFAULT 30000,
  system_prompt TEXT NOT NULL,
  tone VARCHAR(50) DEFAULT 'professional',
  language VARCHAR(10) DEFAULT 'vi',
  auto_response_enabled BOOLEAN DEFAULT false,
  auto_response_delay_ms INTEGER DEFAULT 5000,
  sentiment_analysis_enabled BOOLEAN DEFAULT true,
  auto_escalation_enabled BOOLEAN DEFAULT true,
  escalation_threshold DECIMAL(3,2) DEFAULT 0.3,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. AI Config Audit Log (Track changes)
CREATE TABLE IF NOT EXISTS ai_config_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type VARCHAR(20) NOT NULL, -- 'global', 'staff', 'preset'
  config_id UUID NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  old_values JSONB,
  new_values JSONB,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Default AI Config Presets
INSERT INTO ai_config_presets (name, description, temperature, system_prompt, tone) VALUES
  ('Chuyên nghiệp', 'Cấu hình chuyên nghiệp, chính xác, lịch sự', 0.5, 'Bạn là một hỗ trợ khách hàng chuyên nghiệp. Trả lời ngắn gọn, chính xác và lịch sự.', 'professional'),
  ('Thân thiện', 'Cấu hình thân thiện, chu đáo, nhiệt tình', 0.8, 'Bạn là một hỗ trợ khách hàng thân thiện và chu đáo. Hãy giúp đỡ một cách nhiệt tình.', 'friendly'),
  ('Chính xác', 'Cấu hình tập trung vào tính chính xác, ít sáng tạo', 0.3, 'Bạn là một chuyên gia hỗ trợ. Chỉ trả lời dựa trên dữ liệu chính xác, tránh suy đoán.', 'formal'),
  ('Sáng tạo', 'Cấu hình sáng tạo, linh hoạt, mở rộng', 0.9, 'Bạn là một hỗ trợ khách hàng sáng tạo. Hãy cung cấp giải pháp sáng tạo và linh hoạt.', 'casual')
ON CONFLICT (name) DO NOTHING;

-- 6. Initialize Global AI Config (if not exists)
INSERT INTO ai_configs (model_name, temperature, system_prompt)
SELECT 'gemini', 0.7, 'Bạn là một hỗ trợ khách hàng chuyên nghiệp, lịch sự và hữu ích.'
WHERE NOT EXISTS (SELECT 1 FROM ai_configs);

-- 7. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_ai_configs_staff_id ON staff_ai_configs(staff_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_audit_logs_config_id ON ai_config_audit_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_audit_logs_created_at ON ai_config_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_config_presets_is_default ON ai_config_presets(is_default);
