"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Send,
  Phone,
  Video,
  Users,
  Plus,
  Search,
  Settings,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  CreditCard as Record,
  StopCircle,
  Hash,
  Star,
  MoreVertical,
  Smile,
  Paperclip,
  AtSign,
  Clock,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  MessageCircle,
  Reply,
  ThumbsUp,
  Heart,
  Laugh,
  Angry,
  Sad,
  Surprised,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Edit,
  Pin,
  Archive,
  VolumeX,
  Bell,
  BellOff,
  UserPlus,
  Shield,
  Lock,
  Globe,
  Zap,
  TrendingUp,
  Calendar,
  MapPin,
  Link,
  Code,
  Bold,
  Italic,
  List,
  Quote,
  AlignLeft
} from "lucide-react"

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  timestamp: Date
  isRead: boolean
  readBy: string[]
  reactions: Reaction[]
  thread?: {
    id: string
    count: number
  }
  isEdited?: boolean
  editedAt?: Date
  attachments?: Attachment[]
  isPinned?: boolean
  replyTo?: string
}

interface Reaction {
  emoji: string
  users: string[]
  count: number
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
}

interface Channel {
  id: string
  name: string
  type: 'public' | 'private' | 'direct'
  description?: string
  members: number
  unread: number
  lastMessage?: {
    content: string
    timestamp: Date
    sender: string
  }
  isStarred?: boolean
  isMuted?: boolean
}

interface User {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen?: Date
  role: string
  department: string
}

export default function CommunicationPage() {
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isInCall, setIsInCall] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("channels")
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data - in real app, this would come from API
  const channels: Channel[] = [
    {
      id: "general",
      name: "general",
      type: "public",
      description: "General discussion for the team",
      members: 12,
      unread: 3,
      lastMessage: {
        content: "Welcome to the team! 🎉",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        sender: "Sarah Johnson"
      },
      isStarred: true
    },
    {
      id: "random",
      name: "random",
      type: "public",
      description: "Random discussions and water cooler chat",
      members: 8,
      unread: 0,
      lastMessage: {
        content: "Anyone up for lunch?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        sender: "Mike Chen"
      }
    },
    {
      id: "dev-team",
      name: "dev-team",
      type: "private",
      description: "Development team discussions",
      members: 5,
      unread: 1,
      lastMessage: {
        content: "The new feature is ready for testing",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        sender: "Alex Rodriguez"
      },
      isStarred: true
    },
    {
      id: "john-doe",
      name: "John Doe",
      type: "direct",
      members: 2,
      unread: 2,
      lastMessage: {
        content: "Thanks for the update!",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        sender: "John Doe"
      }
    }
  ]

  const users: User[] = [
    {
      id: "1",
      name: "John Doe",
      role: "Software Engineer",
      department: "Engineering",
      status: "online",
      lastSeen: new Date()
    },
    {
      id: "2",
      name: "Sarah Johnson",
      role: "Product Manager",
      department: "Product",
      status: "away",
      lastSeen: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
      id: "3",
      name: "Mike Chen",
      role: "Designer",
      department: "Design",
      status: "online",
      lastSeen: new Date()
    },
    {
      id: "4",
      name: "Alex Rodriguez",
      role: "Senior Developer",
      department: "Engineering",
      status: "busy",
      lastSeen: new Date(Date.now() - 1000 * 60 * 5)
    }
  ]

  const messages: Message[] = [
    {
      id: "1",
      content: "Hey team! How's everyone doing?",
      sender: {
        id: "2",
        name: "Sarah Johnson",
        role: "Product Manager"
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: true,
      readBy: ["1", "3", "4"],
      reactions: [
        { emoji: "👍", users: ["1", "3"], count: 2 },
        { emoji: "❤️", users: ["4"], count: 1 }
      ],
      thread: { id: "thread-1", count: 3 }
    },
    {
      id: "2",
      content: "Great! Working on the new feature. Should be ready by EOD.",
      sender: {
        id: "1",
        name: "John Doe",
        role: "Software Engineer"
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      isRead: true,
      readBy: ["2", "3", "4"],
      reactions: [
        { emoji: "🚀", users: ["2", "3"], count: 2 }
      ]
    },
    {
      id: "3",
      content: "Perfect! I'll prepare the testing environment.",
      sender: {
        id: "4",
        name: "Alex Rodriguez",
        role: "Senior Developer"
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      isRead: true,
      readBy: ["1", "2", "3"],
      reactions: []
    },
    {
      id: "4",
      content: "Thanks for the update on the project! The design mockups are ready for review.",
      sender: {
        id: "3",
        name: "Mike Chen",
        role: "Designer"
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      isRead: false,
      readBy: ["3"],
      reactions: [],
      attachments: [
        {
          id: "att-1",
          name: "design-mockups-v2.fig",
          type: "figma",
          size: 2048000,
          url: "#",
          thumbnail: "/placeholder-design.png"
        }
      ]
    }
  ]

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🚀", "💯", "🔥", "✨", "👏"]

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsInCall(true)
    } catch (error) {
      console.error("Error accessing media devices:", error)
    }
  }

  const endCall = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setIsInCall(false)
    setIsRecording(false)
  }

  const sendMessage = () => {
    if (message.trim()) {
      // In real app, this would send to API
      console.log("Sending message:", message)
      setMessage("")
      setTypingUsers([])
    }
  }

  const addReaction = (messageId: string, emoji: string) => {
    // In real app, this would update via API
    console.log("Adding reaction:", emoji, "to message:", messageId)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'direct') return '@'
    return '#'
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Akwaaba Chat</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateChannel(true)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="direct">Direct Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="flex-1 overflow-hidden">
            <div className="p-4 space-y-1 overflow-y-auto">
              {/* Starred Channels */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Starred
                </h3>
                {filteredChannels.filter(c => c.isStarred).map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      activeChannel === channel.id ? "bg-emerald-50 text-emerald-700" : ""
                    }`}
                    onClick={() => setActiveChannel(channel.id)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-gray-500 font-mono text-sm">
                        {getChannelIcon(channel)}
                      </span>
                      <span className="font-medium truncate">{channel.name}</span>
                      {channel.unread > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {channel.unread}
                        </Badge>
                      )}
                    </div>
                    {channel.isMuted && <VolumeX className="w-4 h-4 text-gray-400" />}
                  </div>
                ))}
              </div>

              {/* All Channels */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Channels
                </h3>
                {filteredChannels.filter(c => !c.isStarred && c.type !== 'direct').map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      activeChannel === channel.id ? "bg-emerald-50 text-emerald-700" : ""
                    }`}
                    onClick={() => setActiveChannel(channel.id)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-gray-500 font-mono text-sm">
                        {getChannelIcon(channel)}
                      </span>
                      <span className="font-medium truncate">{channel.name}</span>
                      {channel.unread > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {channel.unread}
                        </Badge>
                      )}
                    </div>
                    {channel.isMuted && <VolumeX className="w-4 h-4 text-gray-400" />}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="direct" className="flex-1 overflow-hidden">
            <div className="p-4 space-y-1 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Direct Messages
              </h3>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    activeChannel === user.id ? "bg-emerald-50 text-emerald-700" : ""
                  }`}
                  onClick={() => {
                    setActiveChannel(user.id)
                    setSelectedUser(user)
                  }}
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      {user.lastSeen && (
                        <span className="text-xs text-gray-500">
                          {formatLastSeen(user.lastSeen)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 font-mono text-lg">
                      {getChannelIcon(channels.find(c => c.id === activeChannel) || channels[0])}
                    </span>
                    <h2 className="font-semibold text-gray-900">
                      {channels.find(c => c.id === activeChannel)?.name || "Channel"}
                    </h2>
                    {channels.find(c => c.id === activeChannel)?.type === 'private' && (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{channels.find(c => c.id === activeChannel)?.members || 0} members</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowUserProfile(true)}>
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={startVideoCall}>
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex space-x-3 group hover:bg-gray-50 p-2 rounded-lg">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {msg.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{msg.sender.name}</span>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                      {msg.isEdited && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                      {msg.isPinned && (
                        <Pin className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-900 mb-2">
                      {msg.content}
                    </div>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {msg.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{attachment.name}</span>
                            <span className="text-xs text-gray-500">
                              {(attachment.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                            <Button variant="ghost" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {msg.reactions.map((reaction, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => addReaction(msg.id, reaction.emoji)}
                          >
                            <span className="mr-1">{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Thread indicator */}
                    {msg.thread && (
                      <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {msg.thread.count} replies
                      </Button>
                    )}

                    {/* Message actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Reply className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Smile className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="min-h-[40px] max-h-32 resize-none"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFileUpload(true)}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={sendMessage} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                  <div className="grid grid-cols-6 gap-2">
                    {emojis.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => {
                          setMessage(message + emoji)
                          setShowEmojiPicker(false)
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Akwaaba Chat</h3>
              <p className="text-gray-500">Select a channel or start a conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Call Modal */}
      <Dialog open={isInCall} onOpenChange={setIsInCall}>
        <DialogContent className="max-w-4xl h-[600px]">
          <DialogHeader>
            <DialogTitle>Video Call</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-gray-900 rounded-lg relative overflow-hidden">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <Button variant={isMuted ? "destructive" : "secondary"} size="sm" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="sm"
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? <StopCircle className="w-4 h-4" /> : <Record className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={endCall}>
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm">Recording</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input id="channel-name" placeholder="e.g. marketing" />
            </div>
            <div>
              <Label htmlFor="channel-description">Description (optional)</Label>
              <Input id="channel-description" placeholder="What's this channel about?" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="private" />
              <Label htmlFor="private">Make private</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Create Channel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback>
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.role}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedUser.status)}`} />
                    <span className="text-sm text-gray-500 capitalize">{selectedUser.status}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <Label>Department</Label>
                  <p className="text-sm text-gray-600">{selectedUser.department}</p>
                </div>
                <div>
                  <Label>Last Seen</Label>
                  <p className="text-sm text-gray-600">
                    {selectedUser.lastSeen ? formatLastSeen(selectedUser.lastSeen) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}