"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  relatedId?: string;
  read?: boolean;
  createdAt?: {
    toDate?: () => Date;
  };
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userPhoto, setUserPhoto] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [ownerStatus, setOwnerStatus] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const auth = getAuth(app);


  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (!currentUser) {
        setUserPhoto("");
        setUserData(null);
        setOwnerStatus("");
        setNotifications([]);
        setUnreadCount(0);
        setShowNotifications(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
  const data = userSnap.data();

  setUserData(data);

  setUserPhoto(
    data.photoURL || data.photo || ""
  );

  setIsAdmin(data.role === "admin");
} else {
  setIsAdmin(false);
}

        const ownerQuery = query(
          collection(db, "ownerApplications"),
          where("userUid", "==", currentUser.uid)
        );

        const ownerSnapshot = await getDocs(ownerQuery);
        setOwnerStatus(
          ownerSnapshot.empty
            ? ""
            : ownerSnapshot.docs[0].data().status || ""
        );

        const notificationQuery = query(
          collection(db, "notifications"),
          where("recipientUid", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        unsubscribeNotifications = onSnapshot(
          notificationQuery,
          (snapshot) => {
            const data = snapshot.docs.map((notificationDoc) => ({
              id: notificationDoc.id,
              ...notificationDoc.data(),
            })) as NotificationItem[];

            setNotifications(data);
            setUnreadCount(
              data.filter((item) => item.read !== true).length
            );
          },
          (error) => {
            console.error("Notification listener error:", error);
          }
        );
      } catch (error) {
        console.error("Navbar data loading error:", error);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [auth]);

  useEffect(() => {
    const closeNotificationMenu = (event: MouseEvent) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", closeNotificationMenu);
    return () => document.removeEventListener("mousedown", closeNotificationMenu);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => notification.read !== true
    );

    if (unreadNotifications.length === 0) return;

    try {
      const batch = writeBatch(db);

      unreadNotifications.forEach((notification) => {
        batch.update(doc(db, "notifications", notification.id), {
          read: true,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);
    }
  };

  const getNotificationHref = (notification: NotificationItem) => {
    const type = (notification.type || "").toLowerCase();

    if (type.includes("booking") || type.includes("refund")) {
      return "/bookings";
    }

    if (
      type.includes("parking") ||
      type.includes("listing") ||
      type.includes("owner")
    ) {
      return ownerStatus === "Approved" ? "/dashboard" : "/become-owner";
    }

    return ownerStatus === "Approved" ? "/dashboard" : "/bookings";
  };

  const formatNotificationTime = (notification: NotificationItem) => {
    const date = notification.createdAt?.toDate?.();

    if (!date) return "Just now";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <nav className="bg-black text-white px-8 py-5 flex items-center justify-between">
      <Link href="/" className="text-4xl font-bold">
        CarParking<span className="text-green-400">Bangalore</span>
      </Link>

      <div className="hidden md:flex gap-8 font-medium">
        <Link href="/">Home</Link>
        <Link href="/#parking">Search Parking</Link>
        <Link href="/add-parking">List Parking</Link>

        {user && ownerStatus === "" && (
          <Link href="/become-owner">Become Owner</Link>
        )}

        {user && ownerStatus === "Pending" && (
          <span className="text-yellow-400 cursor-default">
            Application Pending
          </span>
        )}

        {user && ownerStatus === "Approved" && (
          <Link href="/dashboard" className="text-green-400 font-semibold">
            Owner Dashboard
          </Link>
        )}

        {user && ownerStatus === "Rejected" && (
          <Link href="/become-owner" className="text-red-400">
            Reapply
          </Link>
        )}

        <Link href="/bookings">My Bookings</Link>
        <Link href="/wishlist">Wishlist ❤️</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/support">Support</Link>
      </div>

      {user ? (
        <div className="flex items-center gap-4">
          <div ref={notificationMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative w-11 h-11 rounded-full border border-gray-700 bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition"
              aria-label="Open notifications"
            >
              <span className="text-2xl leading-none">🔔</span>

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 w-[430px] max-w-[calc(100vw-2rem)] bg-white text-black rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.35)] overflow-hidden z-[100] border border-gray-200">
                <div className="bg-gradient-to-r from-gray-950 to-gray-800 px-5 py-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-green-500/15 border border-green-400/30 flex items-center justify-center text-xl">
                        🔔
                      </div>

                      <div>
                        <h3 className="font-bold text-xl">Notifications</h3>
                        <p className="text-sm text-gray-300 mt-0.5">
                          {unreadCount > 0
                            ? `${unreadCount} unread notification${
                                unreadCount === 1 ? "" : "s"
                              }`
                            : "You are all caught up"}
                        </p>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="shrink-0 text-sm bg-white/10 hover:bg-white/20 text-green-300 border border-white/10 px-3 py-2 rounded-xl font-semibold transition"
                      >
                        ✓ Read all
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto bg-gray-50">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-14 text-center bg-white">
                      <div className="w-16 h-16 mx-auto rounded-3xl bg-green-50 flex items-center justify-center text-3xl mb-4">
                        🔔
                      </div>
                      <p className="font-bold text-lg text-gray-900">
                        You&apos;re all caught up!
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        New booking and parking updates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {notifications.map((notification) => {
                        const notificationType = (
                          notification.type || ""
                        ).toUpperCase();

                        const isUnread = notification.read !== true;

                        const isRejected =
                          notification.title
                            ?.toLowerCase()
                            .includes("rejected") ||
                          notificationType.includes("REJECT");

                        const isApproved =
                          notification.title
                            ?.toLowerCase()
                            .includes("approved") ||
                          notificationType.includes("APPROV");

                        const isRefund =
                          notificationType.includes("REFUND") ||
                          notification.title
                            ?.toLowerCase()
                            .includes("refund");

                        const isBooking =
                          notificationType.includes("BOOKING");

                        const icon = isRejected
                          ? "❌"
                          : isApproved
                          ? "✅"
                          : isRefund
                          ? "💰"
                          : isBooking
                          ? "🚗"
                          : "🔔";

                        const iconClass = isRejected
                          ? "bg-red-100 text-red-700"
                          : isApproved
                          ? "bg-green-100 text-green-700"
                          : isRefund
                          ? "bg-orange-100 text-orange-700"
                          : isBooking
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700";

                        return (
                          <Link
                            key={notification.id}
                            href={getNotificationHref(notification)}
                            onClick={() => {
                              if (isUnread) {
                                void markAsRead(notification.id);
                              }
                              setShowNotifications(false);
                            }}
                            className={`group relative block rounded-2xl border p-4 transition-all duration-200 ${
                              isUnread
                                ? "bg-green-50/80 border-green-200 shadow-sm hover:shadow-md"
                                : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                          >
                            {isUnread && (
                              <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-green-500" />
                            )}

                            <div className="flex gap-4">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${iconClass}`}
                              >
                                {icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="font-bold text-[15px] text-gray-900 leading-snug">
                                    {notification.title || "New notification"}
                                  </p>

                                  {isUnread && (
                                    <span className="shrink-0 bg-green-600 text-white text-[10px] font-bold tracking-wide px-2 py-1 rounded-full">
                                      NEW
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm text-gray-600 mt-1.5 leading-5 break-words">
                                  {notification.message ||
                                    "You have a new update."}
                                </p>

                                <div className="flex items-center justify-between mt-3">
                                  <p className="text-xs text-gray-400">
                                    {formatNotificationTime(notification)}
                                  </p>

                                  <span className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition">
                                    →
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-5 py-3 bg-white border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      Showing your latest {notifications.length} notification
                      {notifications.length === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative group">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-green-500 cursor-pointer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-600 border-2 border-green-500 flex items-center justify-center text-white font-bold text-lg cursor-pointer">
                {(userData?.name || "User")
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div className="absolute right-0 top-14 w-64 bg-white text-black rounded-2xl shadow-2xl p-4 hidden group-hover:block z-50">
              <div className="mb-4">
                <h3 className="font-bold">{userData?.name || "User"}</h3>
                <p className="text-sm text-gray-500 break-words">
                  {userData?.email || user.phoneNumber || ""}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="bg-green-500 text-white text-center py-2 rounded-lg"
                >
                  My Profile
                </Link>

                <Link
                  href="/bookings"
                  className="bg-blue-500 text-white text-center py-2 rounded-lg"
                >
                  My Bookings
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-black text-white text-center py-2 rounded-lg"
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  type="button"
                  onClick={async () => {
  await signOut(auth);
  window.location.href = "/";
}}
                  className="bg-red-500 text-white py-2 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          href="/login"
          className="bg-green-500 px-4 py-2 rounded-xl font-semibold"
        >
          Login
        </Link>
      )}
    </nav>
  );
}