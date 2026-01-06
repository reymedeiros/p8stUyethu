'use client';

import { useEffect, useState } from 'react';
import { providerApi, ProviderType, ProviderConfig } from '@/lib/providerApi';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Settings,
  RefreshCw,
  Star,
  Loader2
} from 'lucide-react';

export function ProviderSettings() {
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [types, configs] = await Promise.all([
        providerApi.getProviderTypes(),
        providerApi.getProviderConfigs(),
      ]);
      setProviderTypes(types);
      setProviderConfigs(configs);
    } catch (error) {
      console.error('Failed to load provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = () => {
    setEditingConfig(null);
    setShowAddModal(true);
  };

  const handleEditProvider = (config: ProviderConfig) => {
    setEditingConfig(config);
    setShowAddModal(true);
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider configuration?')) {
      return;
    }

    try {
      await providerApi.deleteProviderConfig(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      alert('Failed to delete provider configuration');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result = await providerApi.testProviderConnection(id);
      setTestResults((prev) => ({ ...prev, [id]: { success: result.available, message: result.message } }));
    } catch (error: any) {
      setTestResults((prev) => ({ 
        ...prev, 
        [id]: { success: false, message: error.message || 'Test failed' } 
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await providerApi.setPrimaryProvider(id);
      await loadData();
    } catch (error) {
      console.error('Failed to set primary provider:', error);
      alert('Failed to set primary provider');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            LLM Providers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your AI providers and API keys
          </p>
        </div>
        <button
          onClick={handleAddProvider}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      {providerConfigs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Providers Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first AI provider to start building applications
            </p>
            <button
              onClick={handleAddProvider}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Add Provider
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {providerConfigs.map((config) => (
            <ProviderCard
              key={config.id}
              config={config}
              providerType={providerTypes.find(t => t.type === config.type)}
              onEdit={() => handleEditProvider(config)}
              onDelete={() => handleDeleteProvider(config.id)}
              onTest={() => handleTestConnection(config.id)}
              onSetPrimary={() => handleSetPrimary(config.id)}
              testing={testingId === config.id}
              testResult={testResults[config.id]}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <ProviderModal
          providerTypes={providerTypes}
          editingConfig={editingConfig}
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            setShowAddModal(false);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

interface ProviderCardProps {
  config: ProviderConfig;
  providerType?: ProviderType;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onSetPrimary: () => void;
  testing: boolean;
  testResult?: { success: boolean; message: string };
}

function ProviderCard({
  config,
  providerType,
  onEdit,
  onDelete,
  onTest,
  onSetPrimary,
  testing,
  testResult,
}: ProviderCardProps) {
  return (
    <div className="bg-secondary border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{config.name}</h3>
              {config.isPrimary && (
                <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-current" />
                  Primary
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{providerType?.name || config.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!config.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-2 hover:bg-accent rounded transition"
              title="Set as primary"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onTest}
            disabled={testing}
            className="p-2 hover:bg-accent rounded transition disabled:opacity-50"
            title="Test connection"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-accent rounded transition"
            title="Edit"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-destructive/20 rounded transition text-destructive"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Model:</span>
          <span className="ml-2 font-mono">{config.defaultModel}</span>
        </div>
        <div>
          <span className="text-muted-foreground">API Key:</span>
          <span className="ml-2 font-mono">{config.apiKey}</span>
        </div>
        {config.baseUrl && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Base URL:</span>
            <span className="ml-2 font-mono text-xs">{config.baseUrl}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Temperature:</span>
          <span className="ml-2">{config.parameters.temperature}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Max Tokens:</span>
          <span className="ml-2">{config.parameters.maxTokens}</span>
        </div>
      </div>

      {testResult && (
        <div className={`mt-3 p-2 rounded text-sm flex items-center gap-2 ${
          testResult.success 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {testResult.success ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {testResult.message}
        </div>
      )}
    </div>
  );
}

interface ProviderModalProps {
  providerTypes: ProviderType[];
  editingConfig: ProviderConfig | null;
  onClose: () => void;
  onSave: () => void;
}

function ProviderModal({ providerTypes, editingConfig, onClose, onSave }: ProviderModalProps) {
  const [selectedType, setSelectedType] = useState(editingConfig?.type || '');
  const [formData, setFormData] = useState({
    name: editingConfig?.name || '',
    apiKey: '',
    baseUrl: editingConfig?.baseUrl || '',
    defaultModel: editingConfig?.defaultModel || '',
    enabled: editingConfig?.enabled ?? true,
    temperature: editingConfig?.parameters.temperature ?? 0.7,
    maxTokens: editingConfig?.parameters.maxTokens ?? 2048,
    topP: editingConfig?.parameters.topP ?? 1,
    isPrimary: editingConfig?.isPrimary ?? false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProviderType = providerTypes.find(t => t.type === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const configData = {
        type: selectedType,
        name: formData.name,
        apiKey: formData.apiKey || editingConfig?.apiKey || '',
        baseUrl: formData.baseUrl || undefined,
        defaultModel: formData.defaultModel,
        enabled: formData.enabled,
        parameters: {
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          topP: formData.topP,
        },
        isPrimary: formData.isPrimary,
      };

      if (editingConfig) {
        await providerApi.updateProviderConfig(editingConfig.id, configData);
      } else {
        await providerApi.createProviderConfig(configData);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save provider:', error);
      alert('Failed to save provider configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingConfig ? 'Edit Provider' : 'Add Provider'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingConfig && (
              <div>
                <label className="block text-sm font-medium mb-2">Provider Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    const type = providerTypes.find(t => t.type === e.target.value);
                    if (type) {
                      setFormData({
                        ...formData,
                        defaultModel: type.defaultModels[0] || '',
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a provider...</option>
                  {providerTypes.map((type) => (
                    <option key={type.type} value={type.type}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProviderType && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`My ${selectedProviderType.name}`}
                    required
                  />
                </div>

                {selectedProviderType.requiresApiKey && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Key {editingConfig && '(leave empty to keep current)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                        placeholder="sk-..."
                        required={!editingConfig}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {selectedProviderType.supportsCustomUrl && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Base URL (optional)</label>
                    <input
                      type="url"
                      value={formData.baseUrl}
                      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="http://localhost:1234/v1"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    list="model-suggestions"
                    required
                  />
                  <datalist id="model-suggestions">
                    {selectedProviderType.defaultModels.map((model) => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Tokens</label>
                    <input
                      type="number"
                      step="256"
                      min="256"
                      max="32000"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Top P</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.topP}
                      onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Set as primary provider</span>
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={saving || !selectedType}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-muted rounded hover:bg-accent transition"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
