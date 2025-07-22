import React, { useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useSwipeable } from 'react-swipeable';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchNotificationsData, updateNotificationData, deleteNotificationData } from '../store/notificationsSlice';
import { fetchTransactionsData } from '../store/transactionsSlice';
import Snackbar from '@mui/material/Snackbar';

const NOTI_TYPES = [
  'all',
  'jar_classification',
  'jar_confirmed',
  'jar_rejected',
  'jar_warning',
  'goal_created',
  'goal_progress',
  'goal_completed',
  'goal_failed',
  'goal_review_reminder',
  'coaching_tip',
  'coaching_warning',
  'coaching_motivation',
  'transaction_alert',
  'system_announcement',
  'milestone_achieved',
  'reminder_contribution',
  'account_update_notice',
  'security_alert',
];

function NotificationItem({ noti, transactions, onRead, onDelete }) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const threshold = 100;
  const ref = useRef();
  const relatedTx = noti.object_code === 'transaction' && transactions
    ? transactions.find(tx => tx.transaction_id === noti.object_id)
    : null;
  const severityColor = {
    info: 'info',
    warning: 'warning',
    success: 'success',
    error: 'error',
  }[noti.severity] || 'default';

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Left') {
        setIsSwiping(true);
        setTranslateX(Math.max(-e.deltaX, -150));
      }
    },
    onSwipedLeft: (e) => {
      if (e.absX > threshold) {
        onDelete(noti.notification_id);
      } else {
        setTranslateX(0);
      }
      setIsSwiping(false);
    },
    onSwipedRight: () => {
      setTranslateX(0);
      setIsSwiping(false);
    },
    onSwiped: () => {
      setIsSwiping(false);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <Box position="relative" {...swipeHandlers} ref={ref}>
      <ListItem
        key={noti.notification_id}
        sx={{
          borderRadius: 2,
          mb: 1,
          background: noti.status === 0 ? '#e3f2fd' : '#f5f5f5',
          cursor: 'pointer',
          transition: isSwiping ? 'none' : 'background 0.2s, transform 0.2s',
          transform: `translateX(${translateX}px)`,
          boxShadow: translateX < -10 ? '0 2px 12px #f4433622' : '0 1px 4px #0001',
          '&:active': { background: '#bbdefb' }
        }}
        onClick={() => noti.status === 0 && onRead(noti.notification_id)}
      >
        <ListItemText
          primary={
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <span style={{ fontWeight: noti.status === 0 ? 'bold' : 'normal' }}>{noti.title}</span>
                <Chip label={noti.severity} color={severityColor} size="small" />
              </Box>
              <span style={{ fontSize: 12, color: '#888' }}>{dayjs(noti.created_at).format('DD/MM/YYYY HH:mm')}</span>
            </Box>
          }
          secondary={
            <>
              <span>{noti.message}</span>
              {relatedTx && (
                <Box mt={0.5}>
                  <Link to={noti.action_url} style={{ fontSize: 13, color: '#1976d2' }}>
                    Xem giao dịch: {relatedTx.msg_content} ({relatedTx.amount.toLocaleString()}đ)
                  </Link>
                </Box>
              )}
            </>
          }
        />
        {/* Hiện nền đỏ khi kéo gần hết */}
        {translateX < -threshold/2 && (
          <Box position="absolute" right={16} top={0} bottom={0} width={40} display="flex" alignItems="center" justifyContent="center" zIndex={0}>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: '#f44336', opacity: Math.min(Math.abs(translateX)/150, 1) }} />
          </Box>
        )}
      </ListItem>
    </Box>
  );
}

const NotificationCenter = ({ transactions }) => {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(state => state.notifications);
  // --- Polling state ---
  const [polledNotifications, setPolledNotifications] = useState([]);
  const [lastSeenTime, setLastSeenTime] = useState(null);
  const intervalRef = useRef();
  const user_id = useSelector(state => state.auth.user?.user_id); // adjust if user_id is elsewhere
  const [showNewNotiAlert, setShowNewNotiAlert] = useState(false);
  const [lastNotiId, setLastNotiId] = useState(null);

  // --- Polling fetchNotifications every 10s, only append new notifications by id ---
  useEffect(() => {
    if (!user_id) return;
    function fetchNotifications() {
      const token = localStorage.getItem('token');
      const body = {
        pagination: { page_size: 20, current: 1 },
        filters: lastSeenTime ? { from_date: lastSeenTime, status: 0 } : {status: 0}
      };
      fetch('/api/v1/notification/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      })
      .then(res => res.json())
      .then(data => {
        data.notifications = data.notifications.sort((a, b) => b.notification_id - a.notification_id)
        if (data.notifications && data.notifications.length > 0) {
          setPolledNotifications(prev => {
            // Only append notifications with new id
            const existingIds = new Set(prev.map(n => n.notification_id));
            const newNotis = data.notifications.filter(n => !existingIds.has(n.notification_id));
            return [...newNotis, ...prev];
          });
          setLastSeenTime(data.notifications[0].created_at);
          localStorage.setItem('last_seen_time', data.notifications[0].created_at);
          // Nếu có noti classify thì fetch lại transactions
          const newClassifyNoti = data.notifications[0].notification_type === 'classify' && data.notifications[0].status === 0;
          if (newClassifyNoti) {
            dispatch(fetchTransactionsData());
          }
        }
      });
    }
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 10000); // 10s polling
    return () => clearInterval(intervalRef.current);
  }, [user_id, lastSeenTime]);

  // Merge polledNotifications with Redux notifications (avoid duplicates)
  const mergedNotifications = [...polledNotifications, ...notifications.filter(n => !polledNotifications.some(pn => pn.notification_id === n.notification_id))];

  // Remove tab and type filter
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [lazyCount, setLazyCount] = useState(20);

  const handleViewAllOpen = () => { setViewAllOpen(true); setLazyCount(20); };
  const handleViewAllClose = () => setViewAllOpen(false);
  const handleLoadMore = () => setLazyCount(c => c + 20);

  // Sort by notification_id desc
  const sortedNotifications = [...mergedNotifications].sort((a, b) => b.notification_id - a.notification_id);
  const top5 = sortedNotifications.slice(0, 5);
  // For lazy load in popup
  const lazyFiltered = sortedNotifications.slice(0, lazyCount);

  // For lazy load in popup
  const dialogContentRef = useRef();
  useEffect(() => {
    if (!viewAllOpen) return;
    const handleScroll = () => {
      const el = dialogContentRef.current;
      if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        setLazyCount(c => c + 20);
      }
    };
    const el = dialogContentRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [viewAllOpen]);

  // Replace onRead and onDelete handlers:
  const _handleRead = (id) => {
    // Mark as read via API (only call once)
    fetch(`/api/v1/notification/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' })
    })
    .then(res => res.json())
    .then(() => {
      // Update local state for polledNotifications
      setPolledNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, status: 1, read: true } : n));
      // Update Redux notifications (if present)
      dispatch(updateNotificationData({ id, data: { status: 1, read: true } }));
    });          
  };
  const handleDelete = (id) => {
    dispatch(deleteNotificationData(id));
  };

  // Thêm hoặc cập nhật hàm handleReadNotification
  const handleRead = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/v1/notification/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      // Update local state ngay lập tức
      setPolledNotifications(prev =>
        prev.map(n => n.notification_id === id ? { ...n, status: 1, read: true } : n)
      );
      // Nếu dùng Redux, update luôn trong store
      dispatch(updateNotificationData({ id, data: { status: 1, read: true } }));
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  // --- UI ---
  return (
    <>
    <Card sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001', mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography
              variant="h6"
              sx={{
                background: '-webkit-linear-gradient(0,#e00200,#015aad,#00b74f)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'black',
                fontWeight: 'bold'
              }}
          >
            Notification Center
          </Typography>
        </Box>
        <List>
            {top5.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                There are no notifications.
            </Typography>
          )}
            {top5.map((noti, idx) => (
              <NotificationItem key={noti.notification_id} noti={noti} transactions={transactions} onRead={handleRead} />
          ))}
        </List>
          {sortedNotifications.length > 5 && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" size="small" onClick={handleViewAllOpen}>View All</Button>
            </Box>
          )}
      </CardContent>
    </Card>
      <Dialog open={viewAllOpen} onClose={handleViewAllClose} maxWidth="xs" fullWidth>
        <DialogTitle>All Notifications</DialogTitle>
        <DialogContent ref={dialogContentRef} sx={{ maxHeight: 500, minHeight: 300 }}>
          <List>
            {lazyFiltered.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                There are no notifications.
              </Typography>
            )}
            {lazyFiltered.map((noti, idx) => (
              <NotificationItem key={noti.notification_id} noti={noti} transactions={transactions} onRead={handleRead} />
            ))}
          </List>
          {lazyFiltered.length < sortedNotifications.length && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" size="small" onClick={handleLoadMore}>Load more</Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={showNewNotiAlert}
        autoHideDuration={3000}
        onClose={() => setShowNewNotiAlert(false)}
        message="Bạn có thông báo mới!"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
};

export default NotificationCenter; 