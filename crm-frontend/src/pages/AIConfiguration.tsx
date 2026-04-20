import { useState, useEffect } from 'react';
import {
  Settings,
  ChevronLeft,
  Save,
  RotateCcw,
  Zap,
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  Sliders
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../config/api';

interface AIConfig {
  id: string;
  model_name: string;
  model_version: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  timeout_ms: number;
  system_prompt: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  language: string;
  auto_response_enabled: boolean;
  auto_response_delay_ms: number;
  sentiment_analysis_enabled: boolean;
  auto_escalation_enabled: boolean;
  escalation_threshold: number;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  tone: string;
  temperature: number;
}

export default function AIConfiguration() {
  const navigate = useNavigate();
  const [globalConfig, setGlobalConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'presets' | 'advanced'>('global');

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (userRole !== 'ADMIN') {
      navigate('/unauthorized');
      return;
    }
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configRes, presetsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.AI_CONFIG.GLOBAL, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(API_ENDPOINTS.AI_CONFIG.PRESETS, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Convert numeric strings to numbers
      const config = configRes.data.data;
      if (config) {
        setGlobalConfig({
          ...config,
          temperature: parseFloat(config.temperature) || 0.7,
          max_tokens: parseInt(config.max_tokens) || 1000,
          top_p: parseFloat(config.top_p) || 0.9,
          timeout_ms: parseInt(config.timeout_ms) || 30000,
          auto_response_delay_ms: parseInt(config.auto_response_delay_ms) || 5000,
          escalation_threshold: parseFloat(config.escalation_threshold) || 0.3
        });
      }
      setPresets(presetsRes.data.data || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải cấu hình AI';
      setError(errorMsg);
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!globalConfig) return;

    try {
      setSaving(true);
      setError(null);

      await axios.put(
        API_ENDPOINTS.AI_CONFIG.GLOBAL,
        globalConfig,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Cấu hình AI đã được lưu thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi lưu cấu hình';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!selectedPreset) return;

    try {
      setSaving(true);
      setError(null);

      await axios.post(
        API_ENDPOINTS.AI_CONFIG.APPLY_PRESET,
        { preset_id: selectedPreset },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Preset được áp dụng thành công!');
      setShowPresetModal(false);
      setTimeout(() => fetchConfigs(), 500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi áp dụng preset';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfig = async () => {
    if (!window.confirm('Bạn chắc chắn muốn khôi phục cấu hình mặc định?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await axios.put(
        API_ENDPOINTS.AI_CONFIG.GLOBAL,
        {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          timeout_ms: 30000,
          system_prompt: 'Bạn là một hỗ trợ khách hàng chuyên nghiệp, lịch sự và hữu ích.',
          tone: 'professional',
          auto_response_enabled: false,
          sentiment_analysis_enabled: true,
          auto_escalation_enabled: true,
          escalation_threshold: 0.3
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Cấu hình đã được khôi phục mặc định!');
      setTimeout(() => fetchConfigs(), 500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi khôi phục cấu hình';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="text-slate-400 mt-4">Đang tải cấu hình AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Settings size={32} className="text-purple-400" />
            <h1 className="text-3xl font-bold">Cấu hình AI</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['global', 'presets', 'advanced'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tab === 'global' && ' Tổng Quan'}
              {tab === 'presets' && ' Preset'}
              {tab === 'advanced' && ' Nâng cao'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 m-6 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 m-6 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6 max-w-4xl">
        {globalConfig && (
          <>
            {/* Global Config Tab */}
            {activeTab === 'global' && (
              <div className="space-y-6">
                {/* Model Selection */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-400" />
                    Model AI
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={globalConfig.model_name}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, model_name: e.target.value })
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="gemini"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Model Version
                      </label>
                      <input
                        type="text"
                        value={globalConfig.model_version}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, model_version: e.target.value })
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="gemini-2.5-flash"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Parameters */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sliders size={20} className="text-blue-400" />
                    Tham số AI
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temperature */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Temperature
                        <span className="text-xs text-slate-400 ml-2">
                          (0=chính xác, 1=sáng tạo)
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={globalConfig.temperature}
                          onChange={(e) =>
                            setGlobalConfig({
                              ...globalConfig,
                              temperature: parseFloat(e.target.value)
                            })
                          }
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-semibold text-purple-400 min-w-[3rem]">
                          {typeof globalConfig.temperature === 'number' 
                            ? globalConfig.temperature.toFixed(1) 
                            : '0.7'}
                        </span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Max Tokens (độ dài response tối đa)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={globalConfig.max_tokens}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            max_tokens: parseInt(e.target.value)
                          })
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    {/* Top P */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Top P (diversity)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={globalConfig.top_p}
                          onChange={(e) =>
                            setGlobalConfig({
                              ...globalConfig,
                              top_p: parseFloat(e.target.value)
                            })
                          }
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-semibold text-purple-400 min-w-[3rem]">
                          {typeof globalConfig.top_p === 'number' 
                            ? globalConfig.top_p.toFixed(1) 
                            : '0.9'}
                        </span>
                      </div>
                    </div>

                    {/* Timeout */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        value={globalConfig.timeout_ms}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            timeout_ms: parseInt(e.target.value)
                          })
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Behavior */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Hành vi & Ngôn ngữ</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tone (Giọng điệu)
                      </label>
                      <select
                        value={globalConfig.tone}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            tone: e.target.value as any
                          })
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="professional">👔 Chuyên nghiệp</option>
                        <option value="friendly">😊 Thân thiện</option>
                        <option value="casual">😎 Thoải mái</option>
                        <option value="formal">🎩 Trang trọng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ngôn ngữ
                      </label>
                      <select
                        value={globalConfig.language}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            language: e.target.value
                          })
                        }
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      System Prompt (Hướng dẫn cho AI)
                    </label>
                    <textarea
                      value={globalConfig.system_prompt}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          system_prompt: e.target.value
                        })
                      }
                      rows={4}
                      className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                      placeholder="Mô tả hành vi mong muốn của AI..."
                    />
                  </div>
                </div>

                {/* Auto Features */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-green-400" />
                    Tính năng tự động
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalConfig.auto_response_enabled}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            auto_response_enabled: e.target.checked
                          })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-slate-300">
                        Bật Auto Response (Trả lời tự động)
                      </span>
                    </label>

                    {globalConfig.auto_response_enabled && (
                      <div className="ml-8">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Thời gian chờ (ms)
                        </label>
                        <input
                          type="number"
                          value={globalConfig.auto_response_delay_ms}
                          onChange={(e) =>
                            setGlobalConfig({
                              ...globalConfig,
                              auto_response_delay_ms: parseInt(e.target.value)
                            })
                          }
                          className="w-full max-w-xs bg-slate-700 text-white px-4 py-2 rounded-lg"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalConfig.sentiment_analysis_enabled}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            sentiment_analysis_enabled: e.target.checked
                          })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-slate-300">
                        Bật Sentiment Analysis (Phân tích cảm xúc)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalConfig.auto_escalation_enabled}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            auto_escalation_enabled: e.target.checked
                          })
                        }
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-slate-300">
                        Bật Auto Escalation (Chuyển lên staff)
                      </span>
                    </label>

                    {globalConfig.auto_escalation_enabled && (
                      <div className="ml-8">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Ngưỡng sentiment âm tính
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={globalConfig.escalation_threshold}
                            onChange={(e) =>
                              setGlobalConfig({
                                ...globalConfig,
                                escalation_threshold: parseFloat(e.target.value)
                              })
                            }
                            className="flex-1 max-w-xs h-2 bg-slate-700 rounded-lg"
                          />
                          <span className="text-lg font-semibold text-green-400">
                            {typeof globalConfig.escalation_threshold === 'number' 
                              ? globalConfig.escalation_threshold.toFixed(1) 
                              : '0.3'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateConfig}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>

                  <button
                    onClick={handleResetConfig}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    Khôi phục mặc định
                  </button>
                </div>
              </div>
            )}

            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <p className="text-slate-400 mb-4">
                  Chọn một preset để áp dụng nhanh cấu hình cho toàn bộ hệ thống
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition cursor-pointer"
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setShowPresetModal(true);
                      }}
                    >
                      <h3 className="text-lg font-bold text-white">{preset.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{preset.description}</p>
                      <div className="mt-3 flex gap-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                          {preset.tone}
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                          Temp: {preset.temperature}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preset Confirmation Modal */}
                {showPresetModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
                      <h2 className="text-xl font-bold mb-4">Áp dụng Preset?</h2>
                      <p className="text-slate-300 mb-6">
                        Điều này sẽ thay đổi toàn bộ cấu hình AI hiện tại. Bạn có chắc chắn?
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowPresetModal(false)}
                          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleApplyPreset}
                          disabled={saving}
                          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg disabled:opacity-50"
                        >
                          {saving ? 'Đang áp dụng...' : 'Áp dụng'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">⚙️ Cấu hình nâng cao</h2>

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    💡 Tại đây bạn có thể xem và quản lý chi tiết cấu hình AI, bao gồm:
                  </p>
                  <ul className="text-blue-300 text-sm mt-2 space-y-1 ml-4">
                    <li>• Lịch sử thay đổi (Audit Log)</li>
                    <li>• Cấu hình theo từng nhân viên</li>
                    <li>• Chi tiết API usage</li>
                  </ul>
                </div>

                <button
                  onClick={fetchConfigs}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <Users size={20} />
                  Xem cấu hình từng nhân viên
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
