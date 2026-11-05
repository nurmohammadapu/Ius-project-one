import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter } from "../navigation/navigationShim";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import {
  getAllDoubts,
  getDoubtDetails,
  createDoubt,
  addComment,
  toggleResolveDoubt,
  deleteDoubt,
} from "../services/operations/doubtAPI";

export default function DoubtForumScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const { user } = useSelector((state: any) => state.profile);
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Ask Doubt Modal State
  const [isAskModalVisible, setIsAskModalVisible] = useState(false);
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtDesc, setDoubtDesc] = useState("");
  const [doubtMediaUrl, setDoubtMediaUrl] = useState("");
  const [submittingDoubt, setSubmittingDoubt] = useState(false);

  // Discussion / Detail Modal State
  const [activeDoubt, setActiveDoubt] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentMediaUrl, setCommentMediaUrl] = useState("");
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fullscreen Image Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const commentsScrollRef = useRef<ScrollView>(null);
  const currentUserId = user?.id || user?._id;
  const isInstructorOrAdmin =
    user?.accountType === "Instructor" || user?.accountType === "Admin";

  // Helpers for Author Info
  const getAuthorName = (item: any) => {
    if (item?.author?.firstName) {
      return `${item.author.firstName} ${item.author.lastName || ""}`.trim();
    }
    if (item?.firstName) {
      return `${item.firstName} ${item.lastName || ""}`.trim();
    }
    return "User";
  };

  const getAuthorImage = (item: any) => {
    return (
      item?.author?.image ||
      item?.image ||
      `https://api.dicebear.com/5.x/initials/svg?seed=${getAuthorName(item)}`
    );
  };

  const getAuthorAccountType = (item: any) => {
    return item?.author?.accountType || item?.accountType || "";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // 1. Fetch Doubts List
  const fetchDoubts = async () => {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== "ALL") filters.status = statusFilter;
    if (searchQuery.trim()) filters.search = searchQuery.trim();

    const data = await getAllDoubts(filters, token);
    if (data) {
      setDoubts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchDoubts();
    }
  }, [token, statusFilter]);

  const handleSearchSubmit = () => {
    fetchDoubts();
  };

  // 2. Open Discussion Detail (Smooth Loading)
  const handleOpenDiscussion = async (doubt: any) => {
    setActiveDoubt(doubt);
    setComments([]);
    setLoadingComments(true);
    const details = await getDoubtDetails(doubt.id, token);
    if (details) {
      setActiveDoubt(details.post || doubt);
      setComments(details.comments || []);
    }
    setLoadingComments(false);
  };

  // 3. Submit New Doubt
  const handlePostDoubt = async () => {
    if (!doubtTitle.trim() || !doubtDesc.trim()) {
      Alert.alert("Missing fields", "Please enter both a title and description for your doubt.");
      return;
    }

    setSubmittingDoubt(true);
    const res = await createDoubt(
      {
        title: doubtTitle.trim(),
        description: doubtDesc.trim(),
        mediaUrl: doubtMediaUrl.trim() || undefined,
      },
      token
    );
    setSubmittingDoubt(false);

    if (res?.success) {
      setDoubtTitle("");
      setDoubtDesc("");
      setDoubtMediaUrl("");
      setIsAskModalVisible(false);
      fetchDoubts();
    }
  };

  // 4. Submit Comment / Solution (Instant update like Web)
  const handleAddComment = async () => {
    if (!newComment.trim() || !activeDoubt) return;

    setSubmittingComment(true);
    const res = await addComment(
      {
        postId: activeDoubt.id,
        commentText: newComment.trim(),
        mediaUrl: commentMediaUrl.trim() || undefined,
      },
      token
    );
    setSubmittingComment(false);

    if (res?.success) {
      setNewComment("");
      setCommentMediaUrl("");
      setShowAttachInput(false);

      // Refresh discussion from server
      const details = await getDoubtDetails(activeDoubt.id, token);
      if (details) {
        setComments(details.comments || []);
        setTimeout(() => {
          commentsScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      // Update feed count
      setDoubts((prev) =>
        prev.map((d) =>
          d.id === activeDoubt.id
            ? { ...d, commentsCount: (d.commentsCount || 0) + 1 }
            : d
        )
      );
    }
  };

  // 5. Toggle Resolve
  const handleToggleResolve = async (postId: string) => {
    const newStatus = await toggleResolveDoubt(postId, token);
    if (newStatus) {
      setDoubts((prev) =>
        prev.map((d) => (d.id === postId ? { ...d, status: newStatus } : d))
      );
      if (activeDoubt && activeDoubt.id === postId) {
        setActiveDoubt((prev: any) => ({ ...prev, status: newStatus }));
      }
    }
  };

  // 6. Delete Doubt
  const handleDeleteDoubt = (postId: string) => {
    Alert.alert(
      "Delete Doubt",
      "Are you sure you want to delete this doubt post? All discussion replies will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteDoubt(postId, token);
            if (success) {
              setDoubts((prev) => prev.filter((d) => d.id !== postId));
              if (activeDoubt && activeDoubt.id === postId) {
                setActiveDoubt(null);
              }
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 bg-white dark:bg-richblack-900">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5">
              Doubt Forum
            </Text>
            <Text className="text-xxs text-richblack-400">
              Ask questions & share peer solutions
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsAskModalVisible(true)}
          className="bg-yellow-50 px-3.5 py-2 rounded-xl flex-row items-center shadow-sm"
        >
          <Ionicons name="add" size={16} color="#000814" />
          <Text className="text-richblack-900 font-bold text-xs ml-1">Ask Doubt</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View className="p-4 bg-white dark:bg-richblack-850 border-b border-pure-greys-25 dark:border-richblack-800">
        {/* Search input */}
        <View className="flex-row items-center bg-pure-greys-5 dark:bg-richblack-800 border border-pure-greys-50 dark:border-richblack-700 rounded-xl px-3 py-2 mb-3">
          <Ionicons name="search" size={18} color="#838894" />
          <TextInput
            placeholder="Search questions or keywords..."
            placeholderTextColor="#838894"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            className="flex-1 text-xs text-richblack-900 dark:text-richblack-5 ml-2"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                const filters: any = {};
                if (statusFilter !== "ALL") filters.status = statusFilter;
                getAllDoubts(filters, token).then((res) => res && setDoubts(res));
              }}
            >
              <Ionicons name="close-circle" size={16} color="#838894" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Tabs */}
        <View className="flex-row space-x-2">
          {(["ALL", "OPEN", "RESOLVED"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg mr-2 ${
                statusFilter === tab
                  ? "bg-yellow-50 shadow-sm"
                  : "bg-pure-greys-5 dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  statusFilter === tab
                    ? "text-richblack-900 font-bold"
                    : "text-richblack-400 dark:text-richblack-300"
                }`}
              >
                {tab === "ALL" ? "All Doubts" : tab === "OPEN" ? "Open ❓" : "Resolved ✅"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Doubt List Feed */}
      {loading ? (
        <View className="flex-1 justify-center items-center py-10">
          <ActivityIndicator size="large" color="#FFD60A" />
          <Text className="text-richblack-400 text-xs mt-3">Loading community doubts...</Text>
        </View>
      ) : doubts.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="chatbubbles-outline" size={56} color="#838894" />
          <Text className="text-richblack-900 dark:text-richblack-5 font-bold text-base mt-3">
            No doubts found
          </Text>
          <Text className="text-richblack-400 text-xs text-center mt-1 px-4">
            Be the first to ask a question! Your peers and instructors are here to help.
          </Text>
          <TouchableOpacity
            onPress={() => setIsAskModalVisible(true)}
            className="mt-4 bg-yellow-50 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={16} color="#000" />
            <Text className="text-richblack-900 font-bold text-xs ml-1">Ask a Doubt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
          {doubts.map((doubt) => {
            const isAuthor =
              currentUserId &&
              (String(doubt.userId) === String(currentUserId) ||
                (doubt.author && String(doubt.author.id) === String(currentUserId)));
            const canManage = isAuthor || isInstructorOrAdmin;
            const isOpen = doubt.status === "OPEN";
            const authorName = getAuthorName(doubt);
            const role = getAuthorAccountType(doubt);

            return (
              <View
                key={doubt.id}
                className="bg-white dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700 rounded-2xl p-4 mb-3.5 shadow-sm"
              >
                {/* Header: Author + Status */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image
                      source={{ uri: getAuthorImage(doubt) }}
                      className="w-8 h-8 rounded-full mr-2 bg-pure-greys-50 dark:bg-richblack-700"
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className="text-xs font-bold text-richblack-900 dark:text-richblack-5"
                          numberOfLines={1}
                        >
                          {authorName}
                        </Text>
                        {isAuthor && (
                          <Text className="text-[10px] text-yellow-50 font-bold ml-1 bg-yellow-50/10 px-1 rounded">
                            (You)
                          </Text>
                        )}
                        {role === "Instructor" && !isAuthor && (
                          <Text className="text-[10px] text-yellow-50 font-semibold ml-1 bg-yellow-50/10 px-1 rounded">
                            Instructor
                          </Text>
                        )}
                      </View>
                      <Text className="text-xxs text-richblack-400">
                        {formatDate(doubt.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`px-2 py-0.5 rounded-full flex-row items-center ${
                      isOpen
                        ? "bg-yellow-500/10 border border-yellow-50/30"
                        : "bg-caribbeangreen-900/30 border border-caribbeangreen-500/30"
                    }`}
                  >
                    <Ionicons
                      name={isOpen ? "help-circle-outline" : "checkmark-circle"}
                      size={12}
                      color={isOpen ? "#FFD60A" : "#06D6A0"}
                    />
                    <Text
                      className={`text-xxs font-bold ml-1 ${
                        isOpen ? "text-yellow-50" : "text-caribbeangreen-200"
                      }`}
                    >
                      {doubt.status}
                    </Text>
                  </View>
                </View>

                {/* Course Tag if exists */}
                {doubt.courseName && (
                  <View className="bg-pure-greys-5 dark:bg-richblack-900 px-2 py-1 rounded-md self-start mb-2 border border-pure-greys-25 dark:border-richblack-700">
                    <Text className="text-xxs text-yellow-100 font-semibold">
                      📘 {doubt.courseName}
                    </Text>
                  </View>
                )}

                {/* Title & Desc */}
                <TouchableOpacity onPress={() => handleOpenDiscussion(doubt)}>
                  <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-1">
                    {doubt.title}
                  </Text>
                  <Text
                    className="text-xs text-richblack-600 dark:text-richblack-300 mb-2 leading-relaxed"
                    numberOfLines={3}
                  >
                    {doubt.description}
                  </Text>
                </TouchableOpacity>

                {/* Attached Screenshot Image */}
                {doubt.mediaUrl ? (
                  <TouchableOpacity
                    onPress={() => setPreviewImage(doubt.mediaUrl)}
                    className="mb-3 rounded-xl overflow-hidden border border-pure-greys-25 dark:border-richblack-700 bg-pure-greys-5 dark:bg-richblack-900"
                  >
                    <Image
                      source={{ uri: doubt.mediaUrl }}
                      className="w-full h-36"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : null}

                {/* Actions Row */}
                <View className="flex-row items-center justify-between pt-2.5 border-t border-pure-greys-25 dark:border-richblack-700/60">
                  <TouchableOpacity
                    onPress={() => handleOpenDiscussion(doubt)}
                    className="flex-row items-center py-1"
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color="#FFD60A" />
                    <Text className="text-xs text-yellow-50 font-bold ml-1.5">
                      {doubt.commentsCount || 0} Solutions / Comments
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center space-x-2">
                    {canManage && (
                      <TouchableOpacity
                        onPress={() => handleToggleResolve(doubt.id)}
                        className={`px-2.5 py-1 rounded-lg border mr-1.5 ${
                          isOpen
                            ? "bg-caribbeangreen-900/20 border-caribbeangreen-500/40"
                            : "bg-pure-greys-5 dark:bg-richblack-900 border-pure-greys-25 dark:border-richblack-700"
                        }`}
                      >
                        <Text
                          className={`text-xxs font-bold ${
                            isOpen ? "text-caribbeangreen-200" : "text-richblack-300"
                          }`}
                        >
                          {isOpen ? "Mark Resolved ✅" : "Reopen 🔄"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(isAuthor || user?.accountType === "Admin") && (
                      <TouchableOpacity
                        onPress={() => handleDeleteDoubt(doubt.id)}
                        className="p-1.5 bg-pink-900/10 border border-pink-500/30 rounded-lg"
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF476F" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Ask Doubt Modal */}
      <Modal visible={isAskModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/80 justify-center items-center px-4"
        >
          <View className="w-full bg-white dark:bg-richblack-800 p-5 rounded-2xl border border-pure-greys-25 dark:border-richblack-700 max-h-[85%]">
            <View className="flex-row justify-between items-center pb-3 border-b border-pure-greys-25 dark:border-richblack-700 mb-4">
              <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5">
                Ask a Doubt ❓
              </Text>
              <TouchableOpacity onPress={() => setIsAskModalVisible(false)} className="p-1">
                <Ionicons name="close" size={22} color={isDark ? "#F1F2FF" : "#000814"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-200 mb-1.5">
                Question Title *
              </Text>
              <TextInput
                placeholder="e.g. How does relational database indexing work?"
                placeholderTextColor="#838894"
                value={doubtTitle}
                onChangeText={setDoubtTitle}
                className="w-full bg-pure-greys-5 text-richblack-900 p-3 rounded-xl border border-pure-greys-50 dark:bg-richblack-900 dark:text-richblack-5 dark:border-richblack-700 text-xs mb-3"
              />

              <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-200 mb-1.5">
                Problem Description *
              </Text>
              <TextInput
                placeholder="Provide detailed description of your issue, code snippets or lecture context..."
                placeholderTextColor="#838894"
                value={doubtDesc}
                onChangeText={setDoubtDesc}
                multiline
                numberOfLines={4}
                style={{ textAlignVertical: "top" }}
                className="w-full bg-pure-greys-5 text-richblack-900 p-3 rounded-xl border border-pure-greys-50 dark:bg-richblack-900 dark:text-richblack-5 dark:border-richblack-700 min-h-[100px] text-xs mb-3"
              />

              <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-200 mb-1.5">
                Screenshot / Image URL (Optional)
              </Text>
              <TextInput
                placeholder="Paste an image or screenshot URL (e.g. Cloudinary link)..."
                placeholderTextColor="#838894"
                value={doubtMediaUrl}
                onChangeText={setDoubtMediaUrl}
                className="w-full bg-pure-greys-5 text-richblack-900 p-3 rounded-xl border border-pure-greys-50 dark:bg-richblack-900 dark:text-richblack-5 dark:border-richblack-700 text-xs mb-4"
              />

              <TouchableOpacity
                onPress={handlePostDoubt}
                disabled={submittingDoubt}
                className="bg-yellow-50 py-3 rounded-xl flex-row justify-center items-center shadow"
              >
                {submittingDoubt ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="send" size={15} color="#000" />
                    <Text className="text-richblack-900 font-bold text-xs ml-1.5">
                      Post to Forum
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FULL-SCREEN DISCUSSION & COMMENTS MODAL (Smooth Native View) */}
      <Modal
        visible={!!activeDoubt}
        animationType="slide"
        onRequestClose={() => setActiveDoubt(null)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-richblack-900">
          {/* Top Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 bg-white dark:bg-richblack-900">
            <TouchableOpacity onPress={() => setActiveDoubt(null)} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5" numberOfLines={1}>
                Discussion & Solutions
              </Text>
              <Text className="text-xxs text-richblack-400">
                {comments.length} community replies
              </Text>
            </View>
            <TouchableOpacity onPress={() => setActiveDoubt(null)} className="p-1">
              <Ionicons name="close" size={22} color={isDark ? "#838894" : "#000814"} />
            </TouchableOpacity>
          </View>

          {/* Main Scroll Content */}
          <ScrollView
            ref={commentsScrollRef}
            className="flex-1 px-4 py-3"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeDoubt && (() => {
              const activeAuthorName = getAuthorName(activeDoubt);
              const isActiveAuthor =
                currentUserId &&
                (String(activeDoubt.userId) === String(currentUserId) ||
                  (activeDoubt.author && String(activeDoubt.author.id) === String(currentUserId)));
              const canManageActive = isActiveAuthor || isInstructorOrAdmin;
              const isOpen = activeDoubt.status === "OPEN";

              return (
                <View className="mb-4 pb-4 border-b border-pure-greys-25 dark:border-richblack-800">
                  {/* Author Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Image
                        source={{ uri: getAuthorImage(activeDoubt) }}
                        className="w-10 h-10 rounded-full mr-2.5 bg-pure-greys-50 dark:bg-richblack-700"
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5">
                            {activeAuthorName}
                          </Text>
                          {isActiveAuthor && (
                            <Text className="text-[10px] text-yellow-50 font-bold ml-1.5 bg-yellow-50/10 px-1.5 py-0.5 rounded">
                              Author
                            </Text>
                          )}
                        </View>
                        <Text className="text-xxs text-richblack-400">
                          {formatDate(activeDoubt.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`px-2.5 py-1 rounded-full flex-row items-center ${
                        isOpen
                          ? "bg-yellow-500/10 border border-yellow-50/30"
                          : "bg-caribbeangreen-900/30 border border-caribbeangreen-500/30"
                      }`}
                    >
                      <Ionicons
                        name={isOpen ? "help-circle-outline" : "checkmark-circle"}
                        size={12}
                        color={isOpen ? "#FFD60A" : "#06D6A0"}
                      />
                      <Text
                        className={`text-xxs font-bold ml-1 ${
                          isOpen ? "text-yellow-50" : "text-caribbeangreen-200"
                        }`}
                      >
                        {activeDoubt.status}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Full Description */}
                  <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5 mb-2">
                    {activeDoubt.title}
                  </Text>
                  <View className="p-3.5 bg-pure-greys-5 dark:bg-richblack-800 rounded-xl border border-pure-greys-25 dark:border-richblack-700/80 mb-3">
                    <Text className="text-xs text-richblack-700 dark:text-richblack-200 leading-relaxed whitespace-pre-wrap">
                      {activeDoubt.description}
                    </Text>
                  </View>

                  {/* Attached Media Image */}
                  {activeDoubt.mediaUrl ? (
                    <TouchableOpacity
                      onPress={() => setPreviewImage(activeDoubt.mediaUrl)}
                      className="mb-3 rounded-xl overflow-hidden border border-pure-greys-25 dark:border-richblack-700 bg-pure-greys-5 dark:bg-richblack-900"
                    >
                      <Image
                        source={{ uri: activeDoubt.mediaUrl }}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : null}

                  {/* Actions for Author/Instructor */}
                  <View className="flex-row items-center justify-between pt-1">
                    {canManageActive && (
                      <TouchableOpacity
                        onPress={() => handleToggleResolve(activeDoubt.id)}
                        className={`flex-row items-center px-3 py-1.5 rounded-lg border ${
                          isOpen
                            ? "bg-caribbeangreen-900/20 border-caribbeangreen-500/40"
                            : "bg-pure-greys-5 dark:bg-richblack-800 border-pure-greys-25 dark:border-richblack-700"
                        }`}
                      >
                        <Ionicons
                          name={isOpen ? "checkmark-circle-outline" : "refresh-outline"}
                          size={14}
                          color={isOpen ? "#06D6A0" : "#838894"}
                        />
                        <Text
                          className={`text-xs font-bold ml-1 ${
                            isOpen ? "text-caribbeangreen-200" : "text-richblack-300"
                          }`}
                        >
                          {isOpen ? "Mark Resolved ✅" : "Reopen Doubt 🔄"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(isActiveAuthor || user?.accountType === "Admin") && (
                      <TouchableOpacity
                        onPress={() => handleDeleteDoubt(activeDoubt.id)}
                        className="flex-row items-center px-2.5 py-1.5 bg-pink-900/10 border border-pink-500/30 rounded-lg"
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF476F" />
                        <Text className="text-xs font-semibold text-pink-300 ml-1">Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Replies Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-100 flex-row items-center">
                💬 Solutions & Community Replies ({comments.length})
              </Text>
            </View>

            {loadingComments ? (
              <View className="py-8 justify-center items-center">
                <ActivityIndicator size="small" color="#FFD60A" />
                <Text className="text-richblack-400 text-xs mt-2">Loading discussion...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View className="py-8 px-4 bg-pure-greys-5 dark:bg-richblack-800/60 rounded-xl items-center border border-dashed border-pure-greys-25 dark:border-richblack-700">
                <Ionicons name="chatbubble-outline" size={28} color="#838894" />
                <Text className="text-xs text-richblack-400 mt-2 text-center">
                  No solutions posted yet. Write the first reply below!
                </Text>
              </View>
            ) : (
              comments.map((item, idx) => {
                const commentAuthorName = getAuthorName(item);
                const role = getAuthorAccountType(item);

                return (
                  <View
                    key={item.id || `c-${idx}`}
                    className="p-3.5 bg-pure-greys-5 dark:bg-richblack-800 rounded-xl mb-3 border border-pure-greys-25 dark:border-richblack-700/60"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Image
                          source={{ uri: getAuthorImage(item) }}
                          className="w-6 h-6 rounded-full mr-2 bg-pure-greys-50 dark:bg-richblack-700"
                        />
                        <Text
                          className="text-xs font-bold text-richblack-900 dark:text-richblack-5"
                          numberOfLines={1}
                        >
                          {commentAuthorName}
                        </Text>
                        {role === "Instructor" && (
                          <Text className="text-[9px] text-yellow-50 font-bold ml-1.5 bg-yellow-50/10 px-1 rounded">
                            Instructor
                          </Text>
                        )}
                      </View>
                      <Text className="text-xxs text-richblack-400">
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>

                    <Text className="text-xs text-richblack-700 dark:text-richblack-200 leading-relaxed pl-8">
                      {item.commentText}
                    </Text>

                    {item.mediaUrl ? (
                      <TouchableOpacity
                        onPress={() => setPreviewImage(item.mediaUrl)}
                        className="mt-2.5 ml-8 rounded-lg overflow-hidden border border-pure-greys-25 dark:border-richblack-700"
                      >
                        <Image
                          source={{ uri: item.mediaUrl }}
                          className="w-full h-32"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            )}
            <View className="h-6" />
          </ScrollView>

          {/* Bottom Fixed Comment Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            {showAttachInput && (
              <View className="px-4 py-2 bg-pure-greys-5 dark:bg-richblack-850 border-t border-pure-greys-25 dark:border-richblack-700 flex-row items-center">
                <TextInput
                  placeholder="Paste image/screenshot URL..."
                  placeholderTextColor="#838894"
                  value={commentMediaUrl}
                  onChangeText={setCommentMediaUrl}
                  className="flex-1 bg-white dark:bg-richblack-800 text-richblack-900 dark:text-richblack-5 px-3 py-1.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700 text-xxs mr-2"
                />
                <TouchableOpacity onPress={() => setShowAttachInput(false)}>
                  <Ionicons name="close-circle" size={18} color="#838894" />
                </TouchableOpacity>
              </View>
            )}

            <View className="p-3 border-t border-pure-greys-25 dark:border-richblack-800 flex-row items-center bg-white dark:bg-richblack-900">
              <TextInput
                placeholder="Write your solution or reply..."
                placeholderTextColor="#838894"
                value={newComment}
                onChangeText={setNewComment}
                className="flex-1 bg-pure-greys-5 text-richblack-900 px-3.5 py-2.5 rounded-xl border border-pure-greys-50 dark:bg-richblack-800 dark:text-richblack-5 dark:border-richblack-700 text-xs mr-2"
              />

              <TouchableOpacity
                onPress={() => setShowAttachInput((prev) => !prev)}
                className={`w-10 h-10 rounded-xl justify-center items-center mr-2 border border-pure-greys-50 dark:border-richblack-700 ${
                  commentMediaUrl ? "bg-yellow-50/20" : "bg-pure-greys-5 dark:bg-richblack-800"
                }`}
              >
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={commentMediaUrl ? "#FFD60A" : "#838894"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddComment}
                disabled={submittingComment || !newComment.trim()}
                className={`w-10 h-10 rounded-xl justify-center items-center ${
                  newComment.trim() ? "bg-yellow-50 shadow" : "bg-pure-greys-50 dark:bg-richblack-700"
                }`}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons
                    name="send"
                    size={16}
                    color={newComment.trim() ? "#000814" : "#838894"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Lightbox Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View className="flex-1 bg-black/95 justify-center items-center p-4">
          <TouchableOpacity
            onPress={() => setPreviewImage(null)}
            className="absolute top-12 right-6 z-10 p-2"
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              className="w-full h-[75%]"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
