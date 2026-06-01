import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'sending' | 'closing'
type PacketType = 'SYN' | 'SYN-ACK' | 'ACK' | 'DATA' | 'FIN' | 'FIN-ACK'
type Direction = 'c2s' | 's2c'
type Phase = 'handshake' | 'data' | 'closing' | 'system'

interface AnimatedPacket {
  id: string
  type: PacketType
  direction: Direction
  label: string
  tooltip: string
  startTime: number
  duration: number
}

interface LogEntry {
  id: string
  timestamp: string
  message: string
  explanation: string
  type: PacketType | 'info'
  phase: Phase
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PACKET_DURATION = 1100
const STEP_DELAY = 1350

const PACKET_CONFIG: Record<PacketType, { bg: string; border: string; text: string }> = {
  'SYN':     { bg: 'bg-sky-500',     border: 'border-sky-300',    text: 'text-white' },
  'SYN-ACK': { bg: 'bg-indigo-500',  border: 'border-indigo-300', text: 'text-white' },
  'ACK':     { bg: 'bg-emerald-500', border: 'border-emerald-300',text: 'text-white' },
  'DATA':    { bg: 'bg-amber-500',   border: 'border-amber-300',  text: 'text-black' },
  'FIN':     { bg: 'bg-rose-500',    border: 'border-rose-300',   text: 'text-white' },
  'FIN-ACK': { bg: 'bg-pink-500',    border: 'border-pink-300',   text: 'text-white' },
}

const TOOLTIPS: Record<PacketType, string> = {
  'SYN':     'Synchronize — O cliente pede para abrir a conexão. "Posso me conectar a você?"',
  'SYN-ACK': 'Synchronize-Acknowledge — O servidor aceita e também pede confirmação de volta.',
  'ACK':     'Acknowledge — "Recebi sua mensagem." Confirma que o pacote anterior chegou.',
  'DATA':    'Dados do usuário empacotados em um segmento TCP com número de sequência e checksum.',
  'FIN':     'Finish — "Não tenho mais dados." Inicia o encerramento ordenado da conexão.',
  'FIN-ACK': 'Finish-Acknowledge — O servidor confirma o encerramento e também encerra seu lado.',
}

const PHASE_LABELS: Record<Phase, string> = {
  handshake: 'FASE 1 — Three-Way Handshake',
  data:      'FASE 2 — Transferência de Dados',
  closing:   'FASE 3 — Encerramento',
  system:    'SISTEMA',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))
const uid   = () => Math.random().toString(36).slice(2, 9)
const nowTs = () => new Date().toLocaleTimeString('pt-BR', { hour12: false })

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [connState, setConnState] = useState<ConnectionState>('disconnected')
  const [packets, setPackets]     = useState<AnimatedPacket[]>([])
  const [log, setLog]             = useState<LogEntry[]>([])
  const [message, setMessage]     = useState('')
  const [rafTime, setRafTime]     = useState(0)
  const logRef                    = useRef<HTMLDivElement>(null)
  const rafRef                    = useRef<number>(0)

  // Smooth animation loop
  useEffect(() => {
    const tick = (ts: number) => {
      setRafTime(ts)
      setPackets(prev => prev.filter(p => ts - p.startTime < p.duration + 400))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const addLog = useCallback((
    message: string,
    explanation: string,
    type: PacketType | 'info',
    phase: Phase
  ) => {
    setLog(prev => [...prev, { id: uid(), timestamp: nowTs(), message, explanation, type, phase }])
  }, [])

  const launch = useCallback((type: PacketType, direction: Direction, label?: string) => {
    setPackets(prev => [...prev, {
      id: uid(),
      type,
      direction,
      label: label ?? type,
      tooltip: TOOLTIPS[type],
      startTime: performance.now(),
      duration: PACKET_DURATION,
    }])
  }, [])

  // ─── Simulation flows ────────────────────────────────────────────────────

  const handleConnect = async () => {
    if (connState !== 'disconnected') return
    setConnState('connecting')
    addLog('── Iniciando Three-Way Handshake ──',
      'O TCP usa um "aperto de mão triplo" para sincronizar os dois lados antes de trocar dados.', 'info', 'handshake')
    await sleep(300)

    launch('SYN', 'c2s')
    addLog('→ Cliente  →  SYN',
      'O cliente pede para se conectar. SYN = "Synchronize" — como dizer: "Posso me conectar? Meu número inicial é X."', 'SYN', 'handshake')
    await sleep(STEP_DELAY)

    launch('SYN-ACK', 's2c')
    addLog('← Servidor  ←  SYN-ACK',
      'O servidor diz "sim!" e também envia seu próprio número inicial. É uma confirmação dupla.', 'SYN-ACK', 'handshake')
    await sleep(STEP_DELAY)

    launch('ACK', 'c2s')
    addLog('→ Cliente  →  ACK',
      '"Recebi o seu SYN-ACK, obrigado!" O handshake está completo. Conexão estabelecida.', 'ACK', 'handshake')
    await sleep(STEP_DELAY)

    addLog('✓ Conexão TCP estabelecida',
      'Os dois lados sincronizaram números de sequência. Dados enviados serão confirmados e entregues em ordem.', 'info', 'handshake')
    setConnState('connected')
  }

  const handleSend = async () => {
    if (connState !== 'connected' || !message.trim()) return
    const msg = message.trim()
    setMessage('')
    setConnState('sending')
    addLog('── Enviando dados ──',
      'Cada segmento enviado precisa ser confirmado pelo receptor. Se não vier ACK, o remetente reenvia automaticamente.', 'info', 'data')
    await sleep(300)

    const shortLabel = msg.length > 16 ? msg.slice(0, 14) + '…' : msg
    launch('DATA', 'c2s', `DATA: "${shortLabel}"`)
    addLog(`→ Cliente  →  DATA: "${msg}"`,
      'O dado é encapsulado num segmento TCP com: número de sequência, checksum de integridade e porta de destino.', 'DATA', 'data')
    await sleep(STEP_DELAY)

    launch('ACK', 's2c')
    addLog('← Servidor  ←  ACK',
      'O servidor confirmou que recebeu os dados corretamente! Sem esse ACK, o cliente reenviaria automaticamente.', 'ACK', 'data')
    await sleep(STEP_DELAY)

    addLog('✓ Mensagem entregue com confiabilidade',
      'Essa é a grande vantagem do TCP sobre UDP: garante entrega, ordem correta e integridade dos dados.', 'info', 'data')
    setConnState('connected')
  }

  const handleClose = async () => {
    if (connState !== 'connected') return
    setConnState('closing')
    addLog('── Iniciando encerramento ordenado ──',
      'O TCP fecha a conexão em etapas para garantir que todos os dados pendentes foram entregues.', 'info', 'closing')
    await sleep(300)

    launch('FIN', 'c2s')
    addLog('→ Cliente  →  FIN',
      '"Não tenho mais dados para enviar." FIN = Finish. O cliente encerra sua metade da conexão.', 'FIN', 'closing')
    await sleep(STEP_DELAY)

    launch('FIN-ACK', 's2c')
    addLog('← Servidor  ←  FIN-ACK',
      '"Entendido, e eu também encerro minha parte." O servidor confirma e fecha seu lado.', 'FIN-ACK', 'closing')
    await sleep(STEP_DELAY)

    launch('ACK', 'c2s')
    addLog('→ Cliente  →  ACK (final)',
      '"Confirmado, pode fechar!" O cliente entra em TIME_WAIT por 2 MSL para garantir que o ACK chegou.', 'ACK', 'closing')
    await sleep(STEP_DELAY)

    addLog('✓ Conexão encerrada — soquete liberado',
      'Todos os recursos de memória e porta foram liberados. Para trocar dados novamente, um novo handshake é necessário.', 'info', 'closing')
    setConnState('disconnected')
  }

  const handleReset = () => {
    setConnState('disconnected')
    setPackets([])
    setLog([])
    setMessage('')
  }

  // ─── Derived visuals ─────────────────────────────────────────────────────

  const isBusy = ['connecting', 'sending', 'closing'].includes(connState)

  const clientRing = connState === 'disconnected' ? 'ring-gray-700 bg-gray-800/60'
    : isBusy ? 'ring-amber-500 bg-amber-950/60'
    : 'ring-sky-500 bg-sky-950/60'

  const serverRing = connState === 'disconnected' ? 'ring-gray-700 bg-gray-800/60'
    : isBusy ? 'ring-amber-500 bg-amber-950/60'
    : connState === 'connected' ? 'ring-emerald-500 bg-emerald-950/60'
    : 'ring-gray-700 bg-gray-800/60'

  const dotColor = connState === 'disconnected' ? 'bg-gray-600'
    : isBusy ? 'bg-amber-400 animate-pulse'
    : 'bg-emerald-400'

  const badgeMap: Record<ConnectionState, { label: string; cls: string }> = {
    disconnected: { label: 'Desconectado',  cls: 'bg-gray-800 text-gray-400 ring-gray-700' },
    connecting:   { label: 'Conectando…',   cls: 'bg-amber-900/80 text-amber-300 ring-amber-700' },
    connected:    { label: 'Conectado',      cls: 'bg-emerald-900/80 text-emerald-300 ring-emerald-700' },
    sending:      { label: 'Enviando…',      cls: 'bg-amber-900/80 text-amber-300 ring-amber-700' },
    closing:      { label: 'Encerrando…',    cls: 'bg-rose-900/80 text-rose-300 ring-rose-800' },
  }
  const badge = badgeMap[connState]

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-mono p-4 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-cyan-400 tracking-tight">TCP/IP Simulator</h1>
          <p className="text-[11px] text-gray-600 mt-0.5">protocolo de comunicação que alimenta a internet</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 transition-all duration-500 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Network Canvas */}
      <div className="relative bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden select-none"
           style={{ height: '148px' }}>

        {/* Client */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10">
          <div className={`w-16 h-16 rounded-xl ring-2 flex items-center justify-center text-3xl transition-all duration-500 ${clientRing}`}>
            💻
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${dotColor}`} />
            <span className="text-[11px] text-gray-500">Cliente</span>
          </div>
        </div>

        {/* Server */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10">
          <div className={`w-16 h-16 rounded-xl ring-2 flex items-center justify-center text-3xl transition-all duration-500 ${serverRing}`}>
            🖥️
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${dotColor}`} />
            <span className="text-[11px] text-gray-500">Servidor</span>
          </div>
        </div>

        {/* Lane 1: client → server */}
        <div className="absolute left-[92px] right-[92px]" style={{ top: 'calc(50% - 18px)' }}>
          <div className="h-px w-full" style={{ background: 'repeating-linear-gradient(90deg, #374151 0, #374151 6px, transparent 6px, transparent 12px)' }} />
          <span className="absolute right-0 -top-4 text-[9px] text-gray-700">→</span>
        </div>

        {/* Lane 2: server → client */}
        <div className="absolute left-[92px] right-[92px]" style={{ top: 'calc(50% + 16px)' }}>
          <div className="h-px w-full" style={{ background: 'repeating-linear-gradient(90deg, #374151 0, #374151 6px, transparent 6px, transparent 12px)' }} />
          <span className="absolute left-0 -top-4 text-[9px] text-gray-700">←</span>
        </div>

        {/* Center label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <span className="text-[10px] text-gray-700 bg-[#161b22] px-2">TCP/IP</span>
        </div>

        {/* Animated packets */}
        {packets.map(packet => {
          const elapsed  = rafTime - packet.startTime
          const progress = Math.max(0, Math.min(elapsed / packet.duration, 1))
          const isC2S    = packet.direction === 'c2s'
          const cfg      = PACKET_CONFIG[packet.type]

          // 14% = just after client, 86% = just before server
          const pct = isC2S ? 14 + progress * 72 : 86 - progress * 72
          const yPx = isC2S ? 'calc(50% - 18px)' : 'calc(50% + 16px)'

          return (
            <div
              key={packet.id}
              className={`absolute z-20 px-2 py-0.5 rounded border text-[11px] font-bold
                          shadow-lg cursor-help whitespace-nowrap pointer-events-auto
                          ${cfg.bg} ${cfg.border} ${cfg.text}`}
              style={{
                left: `${pct}%`,
                top: yPx,
                transform: 'translate(-50%, -50%)',
              }}
              title={packet.tooltip}
            >
              {packet.label}
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex gap-4">

        {/* Controls */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-3">
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Controles</p>

            <button
              onClick={handleConnect}
              disabled={connState !== 'disconnected'}
              className="w-full px-3 py-2 rounded text-sm font-semibold text-left flex items-center gap-2
                         bg-sky-800 hover:bg-sky-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                         transition-colors"
            >
              <span>🔗</span>
              <span>Conectar</span>
              <span className="ml-auto text-[10px] opacity-50 font-normal">SYN</span>
            </button>

            <div className="pt-2 border-t border-gray-800 space-y-1.5">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Digite uma mensagem…"
                maxLength={60}
                disabled={connState !== 'connected'}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm
                           disabled:opacity-40 disabled:cursor-not-allowed
                           focus:outline-none focus:border-amber-500 placeholder-gray-700 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={connState !== 'connected' || !message.trim()}
                className="w-full px-3 py-2 rounded text-sm font-semibold text-left flex items-center gap-2
                           bg-amber-700 hover:bg-amber-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                           transition-colors"
              >
                <span>📤</span>
                <span>Enviar Mensagem</span>
              </button>
            </div>

            <button
              onClick={handleClose}
              disabled={connState !== 'connected'}
              className="w-full px-3 py-2 rounded text-sm font-semibold text-left flex items-center gap-2
                         bg-rose-800 hover:bg-rose-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                         transition-colors"
            >
              <span>✕</span>
              <span>Encerrar Conexão</span>
              <span className="ml-auto text-[10px] opacity-50 font-normal">FIN</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isBusy}
              className="w-full px-3 py-2 rounded text-sm font-medium text-left flex items-center gap-2
                         bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed
                         text-gray-400 transition-colors"
            >
              <span>↺</span>
              <span>Reiniciar</span>
            </button>
          </div>

          {/* Packet legend */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Tipos de Pacote</p>
            <div className="space-y-2">
              {(Object.keys(PACKET_CONFIG) as PacketType[]).map(type => {
                const cfg = PACKET_CONFIG[type]
                return (
                  <div key={type} className="flex items-start gap-2 group cursor-help" title={TOOLTIPS[type]}>
                    <span className={`mt-0.5 px-1.5 py-px rounded text-[10px] font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {type}
                    </span>
                    <span className="text-[11px] text-gray-600 leading-tight group-hover:text-gray-300 transition-colors">
                      {TOOLTIPS[type].split(' — ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Event log */}
        <div className="flex-1 bg-[#161b22] border border-gray-800 rounded-lg p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Log de Eventos</p>
            <span className="text-[10px] text-gray-700 tabular-nums">{log.length} eventos</span>
          </div>

          <div
            ref={logRef}
            className="overflow-y-auto space-y-1.5 pr-1 flex-1"
            style={{ maxHeight: '340px' }}
          >
            {log.length === 0 && (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">📡</div>
                <p className="text-sm text-gray-600">Clique em <span className="text-gray-400 font-semibold">Conectar</span> para começar</p>
                <p className="text-[11px] text-gray-700 mt-1">e veja o TCP em ação, passo a passo</p>
              </div>
            )}

            {log.map(entry => {
              const isHeader  = entry.type === 'info' && entry.message.startsWith('──')
              const isSuccess = entry.type === 'info' && entry.message.startsWith('✓')
              const pCfg      = entry.type !== 'info' ? PACKET_CONFIG[entry.type as PacketType] : null

              if (isHeader) {
                const phaseColors: Record<Phase, string> = {
                  handshake: 'text-sky-500 border-sky-900',
                  data:      'text-amber-500 border-amber-900',
                  closing:   'text-rose-500 border-rose-900',
                  system:    'text-gray-500 border-gray-800',
                }
                return (
                  <div key={entry.id} className={`mt-3 mb-1 pt-2 border-t text-[11px] font-bold tracking-wide ${phaseColors[entry.phase]}`}>
                    {PHASE_LABELS[entry.phase]}
                    <span className="ml-2 text-[10px] font-normal opacity-60">{entry.explanation.slice(0, 48)}…</span>
                  </div>
                )
              }

              const borderColor = isSuccess
                ? 'border-emerald-700'
                : entry.phase === 'handshake' ? 'border-sky-800'
                : entry.phase === 'data'      ? 'border-amber-800'
                : entry.phase === 'closing'   ? 'border-rose-800'
                : 'border-gray-700'

              return (
                <div
                  key={entry.id}
                  className={`rounded p-2 border-l-2 text-xs bg-gray-900/40 ${borderColor}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-gray-600 text-[10px] tabular-nums flex-shrink-0">{entry.timestamp}</span>
                    {pCfg && (
                      <span className={`px-1 py-px rounded text-[9px] font-bold flex-shrink-0 ${pCfg.bg} ${pCfg.text}`}>
                        {entry.type}
                      </span>
                    )}
                    <span className={`font-semibold leading-tight ${isSuccess ? 'text-emerald-400' : 'text-gray-200'}`}>
                      {entry.message}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-snug">
                    {entry.explanation}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-700">
        Passe o mouse nos pacotes animados para ver o que significam · Enter envia a mensagem
      </p>
    </div>
  )
}
