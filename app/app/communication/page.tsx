"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
} from "lucide-react"

export default function CommunicationPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isInCall, setIsInCall] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const chats = [
    {
      id: "1",
      name: "John Doe",
      role: "Software Engineer",
      lastMessage: "Thanks for the update on the project",
      time: "2 min ago",
      unread: 2,
      online: true,
    },
    {
      id: "2",
      name: "HR Team",
      role: "Group Chat",
      lastMessage: "Meeting scheduled for tomorrow",
      time: "1 hour ago",
      unread: 0,
      online: false,
      isGroup: true,
    },
  ]

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Communication</h1>
          <p className="text-gray-600">Connect and collaborate with your team</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                    activeChat === chat.id ? "border-emerald-500 bg-emerald-50" : "border-transparent"
                  }`}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>
                          {chat.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {chat.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{chat.name}</p>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {activeChat ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">John Doe</h3>
                      <p className="text-sm text-gray-500">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={startVideoCall}>
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                <div className="h-96 overflow-y-auto mb-4 space-y-4">
                  {/* Sample messages */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Hey, how's the project coming along?</p>
                      <span className="text-xs text-gray-500">10:30 AM</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-emerald-500 text-white rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Going well! Should be done by end of week.</p>
                      <span className="text-xs text-emerald-100">10:32 AM</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Video Call Modal */}
      <Dialog open={isInCall} onOpenChange={setIsInCall}>
        <DialogContent className="max-w-4xl h-[600px]">
          <DialogHeader>
            <DialogTitle>Video Call with John Doe</DialogTitle>
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
    </div>
  )
}
