import { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'
import './App.css'

const PEER_PREFIX = 'p2p-pwa-'

function App() {
  const [mode, setMode] = useState('create')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [hostPeerId, setHostPeerId] = useState('')
  const [myPeerId, setMyPeerId] = useState('')
  const [participants, setParticipants] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const peerRef = useRef(null)
  const connectionsRef = useRef({})

  const generatePeerId = (code) => `${PEER_PREFIX}${code}`

  const createRoom = () => {
    if (!name.trim() || !roomCode.trim()) {
      alert('Please enter your name and a 4-digit room code')
      return
    }

    const code = roomCode.replace(/\D/g, '').slice(0, 4)
    if (code.length !== 4) {
      alert('Room code must be 4 digits')
      return
    }

    const id = `${generatePeerId(code)}-host-${Date.now()}`
    const peer = new Peer(id)

    peer.on('open', (id) => {
      setMyPeerId(id)
      setIsHost(true)
      setIsConnected(true)
      setParticipants([{ id: 'self', name: name, status: 'online', isSelf: true }])
      console.log('Room created with ID:', id)
    })

    peer.on('connection', handleConnection)

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      alert('Error creating room: ' + err.type)
    })

    peerRef.current = peer
  }

  const joinRoom = () => {
    if (!name.trim() || !roomCode.trim() || !hostPeerId.trim()) {
      alert('Please fill in all fields')
      return
    }

    const id = `${generatePeerId(roomCode)}-joiner-${Date.now()}`
    const peer = new Peer(id)

    peer.on('open', () => {
      setMyPeerId(id)
      setIsConnected(true)
      setParticipants([{ id: 'self', name: name, status: 'online', isSelf: true }])
      
      const conn = peer.connect(hostPeerId)
      if (conn) {
        setupConnection(conn)
      }
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      alert('Error joining room: ' + err.type)
    })

    peerRef.current = peer
  }

  const setupConnection = (conn) => {
    connectionsRef.current[conn.peer] = conn

    conn.on('open', () => {
      console.log('Connected to:', conn.peer)
      conn.send({ type: 'handshake', name: name })
      
      setParticipants(prev => {
        const exists = prev.find(p => p.id === conn.peer)
        if (exists) return prev
        return [...prev, { id: conn.peer, name: 'Peer', status: 'online' }]
      })
    })

    conn.on('data', (data) => {
      if (data.type === 'handshake') {
        setParticipants(prev => {
          const exists = prev.find(p => p.id === conn.peer)
          if (exists) {
            return prev.map(p => p.id === conn.peer ? { ...p, name: data.name, status: 'online' } : p)
          }
          return [...prev, { id: conn.peer, name: data.name, status: 'online' }]
        })
      }
      if (data.type === 'heartbeat') {
        setParticipants(prev => prev.map(p => 
          p.id === conn.peer ? { ...p, status: 'online', lastSeen: Date.now() } : p
        ))
      }
    })

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer)
      setParticipants(prev => prev.map(p => 
        p.id === conn.peer ? { ...p, status: 'offline' } : p
      ))
      delete connectionsRef.current[conn.peer]
    })

    conn.on('error', (err) => {
      console.error('Connection error:', err)
      setParticipants(prev => prev.map(p => 
        p.id === conn.peer ? { ...p, status: 'offline' } : p
      ))
    })
  }

  const handleConnection = (conn) => {
    setupConnection(conn)
  }

  const broadcastHeartbeat = () => {
    Object.values(connectionsRef.current as any).forEach((conn: any) => {
      if (conn.open) {
        conn.send({ type: 'heartbeat', name: name })
      }
    })
  }

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        broadcastHeartbeat()
        
        setParticipants(prev => prev.map(p => {
          if (p.isSelf) return p
          const timeout = Date.now() - (p.lastSeen || Date.now())
          if (timeout > 5000 && p.status === 'online') {
            return { ...p, status: 'offline' }
          }
          return p
        }))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isConnected, name])

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy()
      }
    }
  }, [])

  const resetApp = () => {
    if (peerRef.current) {
      peerRef.current.destroy()
    }
    setParticipants([])
    setIsConnected(false)
    setIsHost(false)
    setMyPeerId('')
    setHostPeerId('')
    setName('')
    setRoomCode('')
    setMode('create')
  }

  if (isConnected) {
    return (
      <div className="app">
        <h1>P2P PWA</h1>
        <button onClick={resetApp} className="back-btn">← New Room</button>
        <div className="room-info">
          <p>Room Code: <span className="code">{roomCode}</span></p>
          {isHost && <p>Your Peer ID: <span className="id">{myPeerId}</span></p>}
          <p>Participants: <span className="count">{participants.filter(p => p.status === 'online').length}</span></p>
        </div>
        <div className="participants">
          <h2>Participants</h2>
          {participants.map(p => (
            <div key={p.id} className={`participant ${p.status}`}>
              <span className="status-dot"></span>
              <span className="name">{p.name} {p.isSelf && '(You)'}</span>
              <span className="status-text">{p.status}</span>
            </div>
          ))}
        </div>
        {isHost && (
          <div className="share-info">
            <p>Share your Peer ID with others to join:</p>
            <code>{myPeerId}</code>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <h1>P2P PWA</h1>
      
      <div className="mode-tabs">
        <button 
          className={mode === 'create' ? 'active' : ''} 
          onClick={() => setMode('create')}
        >
          Create Room
        </button>
        <button 
          className={mode === 'join' ? 'active' : ''} 
          onClick={() => setMode('join')}
        >
          Join Room
        </button>
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Room code (4 digits)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          maxLength={4}
        />

        {mode === 'create' ? (
          <button 
            onClick={createRoom} 
            className="primary" 
            disabled={roomCode.length !== 4}
          >
            Create Room
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Host Peer ID (from host)"
              value={hostPeerId}
              onChange={(e) => setHostPeerId(e.target.value)}
            />
            <button 
              onClick={joinRoom} 
              className="primary"
              disabled={roomCode.length !== 4 || !hostPeerId.trim()}
            >
              Join Room
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default App
