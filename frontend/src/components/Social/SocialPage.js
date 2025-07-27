"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useSocket } from "../../contexts/SocketContext"
import { api } from "../../utils/api"

const SocialPage = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { onlineUsers } = useSocket()
  const [activeTab, setActiveTab] = useState("friends")
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [userCode, setUserCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      setLoading(true)
      const data = await api.getFriends()
      setFriends(data.friends || [])
      setPendingRequests(data.pendingRequests || [])
    } catch (error) {
      console.error("Error loading friends:", error)
      setError("Error al cargar amigos")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (searchTerm.length < 2) return

    try {
      const results = await api.searchUsers(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching users:", error)
      setError("Error al buscar usuarios")
    }
  }

  const handleSendFriendRequest = async () => {
    if (!userCode.trim()) return

    try {
      await api.sendFriendRequest(userCode)
      setSuccess("Solicitud de amistad enviada")
      setUserCode("")
      loadFriends()
    } catch (error) {
      console.error("Error sending friend request:", error)
      setError("Error al enviar solicitud de amistad")
    }
  }

  const handleFriendResponse = async (requestId, action) => {
    try {
      await api.respondToFriendRequest(requestId, action)
      setSuccess(`Solicitud ${action === "accept" ? "aceptada" : "rechazada"}`)
      loadFriends()
    } catch (error) {
      console.error("Error responding to friend request:", error)
      setError("Error al responder solicitud")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: theme.text }}>
            Social Learning
          </h1>
          <p className="mt-2 text-lg" style={{ color: theme.textSecondary }}>
            Connect with fellow learners and track your progress
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b" style={{ borderColor: theme.border }}>
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("friends")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "friends" ? "border-current" : "border-transparent hover:opacity-70"
                }`}
                style={{
                  color: activeTab === "friends" ? theme.primary : theme.textSecondary,
                  borderColor: activeTab === "friends" ? theme.primary : "transparent",
                }}
              >
                Friends
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "leaderboard" ? "border-current" : "border-transparent hover:opacity-70"
                }`}
                style={{
                  color: activeTab === "leaderboard" ? theme.primary : theme.textSecondary,
                  borderColor: activeTab === "leaderboard" ? theme.primary : "transparent",
                }}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab("online")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "online" ? "border-current" : "border-transparent hover:opacity-70"
                }`}
                style={{
                  color: activeTab === "online" ? theme.primary : theme.textSecondary,
                  borderColor: activeTab === "online" ? theme.primary : "transparent",
                }}
              >
                Online Now ({onlineUsers.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "friends" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="p-6 rounded-lg shadow-sm border"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {friend.name.charAt(0)}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                        friend.status === "online" ? "bg-green-400" : "bg-gray-400"
                      }`}
                      style={{ borderColor: theme.surface }}
                    ></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium" style={{ color: theme.text }}>
                      {friend.name}
                    </h3>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {friend.coursesCompleted} courses completed
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: friend.status === "online" ? "#10b981" : theme.textSecondary }}
                    >
                      {friend.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    className="flex-1 px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Message
                  </button>
                  <button
                    className="px-3 py-2 rounded-md text-sm font-medium border hover:opacity-80"
                    style={{
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div
            className="p-6 rounded-lg shadow-sm border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <h2 className="text-xl font-semibold mb-6" style={{ color: theme.text }}>
              Top Learners This Month
            </h2>
            <div className="space-y-4">{/* Leaderboard data will be fetched and displayed here */}</div>
          </div>
        )}

        {activeTab === "online" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((onlineUser) => (
                <div
                  key={onlineUser.id}
                  className="p-6 rounded-lg shadow-sm border"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {onlineUser.name?.charAt(0) || "U"}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2"
                        style={{ borderColor: theme.surface }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium" style={{ color: theme.text }}>
                        {onlineUser.name}
                      </h3>
                      <p className="text-sm text-green-600">Online now</p>
                    </div>
                  </div>
                  <button
                    className="mt-4 w-full px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Say Hello
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium mb-2" style={{ color: theme.text }}>
                  No one else is online right now
                </h3>
                <p style={{ color: theme.textSecondary }}>Check back later to see who's learning!</p>
              </div>
            )}
          </div>
        )}

        {/* Add Friends Section */}
        <div className="mt-8 rounded-lg shadow-md p-6" style={{ backgroundColor: theme.surface }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.text }}>
            Add Friends
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                User Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="Ej: USER123ABC"
                  className="flex-1 px-3 py-2 border rounded-md"
                  style={{
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                />
                <button
                  onClick={handleSendFriendRequest}
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: theme.primary }}
                >
                  Send
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                Search by name
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 px-3 py-2 border rounded-md"
                  style={{
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: theme.secondary }}
                >
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium" style={{ color: theme.text }}>
                  Search Results:
                </h3>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-md"
                    style={{ backgroundColor: theme.background }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: theme.text }}>
                        {user.username}
                      </p>
                      <p className="text-sm" style={{ color: theme.textSecondary }}>
                        {user.user_code}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUserCode(user.user_code)
                        handleSendFriendRequest()
                      }}
                      className="px-3 py-1 rounded-md text-sm text-white"
                      style={{ backgroundColor: theme.success }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <div className="mt-8 rounded-lg shadow-md p-6" style={{ backgroundColor: theme.surface }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: theme.text }}>
              Pending Requests ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <p style={{ color: theme.textSecondary }}>No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-md"
                    style={{ backgroundColor: theme.background }}
                  >
                    <div className="flex items-center space-x-3">
                      {request.friend_profile_pic && (
                        <img
                          src={`http://localhost:5000/${request.friend_profile_pic}`}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium" style={{ color: theme.text }}>
                          {request.friend_username}
                        </p>
                        <p className="text-sm" style={{ color: theme.textSecondary }}>
                          {request.request_type === "received" ? "Sent you a request" : "Request sent"}
                        </p>
                      </div>
                    </div>

                    {request.request_type === "received" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFriendResponse(request.id, "accept")}
                          className="px-3 py-1 rounded-md text-sm text-white"
                          style={{ backgroundColor: theme.success }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleFriendResponse(request.id, "reject")}
                          className="px-3 py-1 rounded-md text-sm text-white"
                          style={{ backgroundColor: theme.error }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div className="mt-8 rounded-lg shadow-md p-6" style={{ backgroundColor: theme.surface }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.text }}>
            My Friends ({friends.length})
          </h2>

          {friends.length === 0 ? (
            <p style={{ color: theme.textSecondary }}>You haven't added any friends yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center space-x-3 p-4 rounded-md"
                  style={{ backgroundColor: theme.background }}
                >
                  {friend.friend_profile_pic && (
                    <img
                      src={`http://localhost:5000/${friend.friend_profile_pic}`}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium" style={{ color: theme.text }}>
                      {friend.friend_username}
                    </p>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {friend.friend_user_code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md" style={{ backgroundColor: theme.error + "20" }}>
          <p style={{ color: theme.error }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-md" style={{ backgroundColor: theme.success + "20" }}>
          <p style={{ color: theme.success }}>{success}</p>
        </div>
      )}
    </div>
  )
}

export default SocialPage
