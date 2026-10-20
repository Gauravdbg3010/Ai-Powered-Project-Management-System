import { useState, useEffect, useRef, FormEvent } from 'react'
import { Sparkles, Send, Bot, User as UserIcon, FolderKanban, ShieldCheck, Key, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import { aiApi, AiConfig } from '../../api/ai'
import { projectsApi } from '../../api/projects'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import type { Project, ChatMessage } from '../../types'

export function AiPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined)
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configKey, setConfigKey] = useState('')
  const [configProvider, setConfigProvider] = useState<'gemini' | 'openai'>('gemini')
  const [configModel, setConfigModel] = useState('gemini-1.5-flash')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMessage, setConfigMessage] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your TaskFlow AI assistant. I have direct, authorized access to your projects, deadlines, and task statuses. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    projectsApi.list({ size: 50 }).then(res => {
      if (res.success && res.data.content.length > 0) {
        setProjects(res.data.content)
      }
    })
    loadConfig()
  }, [])

  const loadConfig = () => {
    aiApi.getConfig().then(res => {
      if (res.success) {
        setAiConfig(res.data)
        if (res.data.provider) setConfigProvider(res.data.provider as 'gemini' | 'openai')
        if (res.data.model) setConfigModel(res.data.model)
      }
    }).catch(() => {})
  }

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault()
    if (!configKey.trim()) return
    setSavingConfig(true)
    setConfigMessage(null)
    try {
      const res = await aiApi.updateConfig({
        apiKey: configKey.trim(),
        provider: configProvider,
        model: configModel,
      })
      if (res.success) {
        setAiConfig(res.data)
        setConfigMessage('AI Provider connected successfully!')
        setTimeout(() => {
          setShowConfigModal(false)
          setConfigMessage(null)
          setConfigKey('')
        }, 1500)
      }
    } catch (err: any) {
      setConfigMessage(err?.response?.data?.message || 'Failed to connect with the provided API key.')
    } finally {
      setSavingConfig(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await aiApi.chat({
        message: userText,
        projectId: selectedProjectId,
      })
      if (res.success) {
        const botMsg: ChatMessage = {
          role: 'assistant',
          content: res.data.response,
          contextSummary: res.data.contextSummary,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, botMsg])
      }
    } catch (err: unknown) {
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: 'I encountered an error querying project data. Please verify your connection or try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, botMsg])
    } finally {
      setLoading(false)
    }
  }

  const promptSuggestions = [
    'What tasks are currently blocked or at risk?',
    'Summarize our upcoming deadlines for the next 7 days.',
    'Give me a status breakdown of completed versus pending work.',
    'Which tasks require immediate attention or dependency unblocking?',
  ]

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Assistant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">AI Project Assistant</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Strictly queries authorized backend records — zero external data hallucination.
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* AI Mode / Provider Pill */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
              aiConfig?.configured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Click to configure live Google Gemini or OpenAI API Key"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                aiConfig?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {aiConfig?.configured
                ? `${aiConfig.provider === 'openai' ? 'OpenAI' : 'Gemini'} Live (${aiConfig.model})`
                : 'Heuristic Mode · Connect Gemini'}
            </span>
            <Key className="w-3 h-3 ml-0.5 opacity-60" />
          </button>

          {/* Project Context Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5" /> Scope:
            </span>
            <select
              className="input py-1 text-xs w-48"
              value={selectedProjectId ?? ''}
              onChange={e => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">All My Assigned Tasks</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 card p-5 overflow-y-auto space-y-4 bg-surface-muted/30">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-border text-primary-700 shadow-sm'
              }`}
            >
              {m.role === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className="space-y-1">
              <div
                className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-white border border-border text-gray-800 shadow-sm rounded-tl-none whitespace-pre-wrap font-sans'
                }`}
              >
                {m.content}
              </div>

              {m.contextSummary && (
                <div className="flex items-center gap-1 text-[10px] text-gray-400 pl-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{m.contextSummary}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-primary-700">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-white border border-border rounded-lg shadow-sm flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              <span>Analyzing authorized project database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pills */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto py-1">
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInput(prompt)}
            className="text-[11px] font-medium text-gray-600 bg-white hover:bg-primary-50 hover:text-primary-700 border border-border rounded-full px-3 py-1 whitespace-nowrap transition-colors shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="shrink-0 flex gap-2">
        <input
          type="text"
          className="input py-2.5 text-xs flex-1"
          placeholder="Ask anything about your tasks, deadlines, dependencies, or project health..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={!input.trim() || loading} className="gap-1.5 px-4">
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </Button>
      </form>

      {/* Configuration Modal */}
      <Modal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="AI Provider Settings"
        size="md"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <p className="text-xs text-gray-600">
            Connect your <strong>Google Gemini API Key</strong> to unlock live generative responses, natural conversation, and real-time sprint intelligence.
          </p>

          {configMessage && (
            <div
              className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                configMessage.includes('successfully')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {configMessage.includes('successfully') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{configMessage}</span>
            </div>
          )}

          <div>
            <label className="label">AI Provider</label>
            <select
              className="input text-xs"
              value={configProvider}
              onChange={e => {
                const p = e.target.value as 'gemini' | 'openai'
                setConfigProvider(p)
                setConfigModel(p === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini')
              }}
            >
              <option value="gemini">Google Gemini (Recommended — fast, low latency)</option>
              <option value="openai">OpenAI (gpt-4o-mini / gpt-4o)</option>
            </select>
          </div>

          <div>
            <label className="label">
              {configProvider === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
            </label>
            <Input
              type="password"
              placeholder={configProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              value={configKey}
              onChange={e => setConfigKey(e.target.value)}
              className="font-mono text-xs"
            />
            {configProvider === 'gemini' && (
              <p className="text-[11px] text-gray-400 mt-1">
                Get a free Gemini API key at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 underline font-medium"
                >
                  Google AI Studio
                </a>.
              </p>
            )}
          </div>

          <div>
            <label className="label">Model</label>
            <Input
              value={configModel}
              onChange={e => setConfigModel(e.target.value)}
              placeholder={configProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowConfigModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!configKey.trim() || savingConfig}>
              {savingConfig ? 'Connecting...' : 'Save & Connect'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
