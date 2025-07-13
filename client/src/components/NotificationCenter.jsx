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
  useEffect(() => {
    dispatch(fetchNotificationsData());
  }, [dispatch]);

  const [tab, setTab] = useState(0); // 0: All, 1: Unread
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [lazyCount, setLazyCount] = useState(20);

  const handleTabChange = (e, v) => setTab(v);
  const handleTypeChange = (e) => setTypeFilter(e.target.value);
  const handleViewAllOpen = () => { setViewAllOpen(true); setLazyCount(20); };
  const handleViewAllClose = () => setViewAllOpen(false);
  const handleLoadMore = () => setLazyCount(c => c + 20);

  let filtered = notifications;
  if (tab === 1) filtered = filtered.filter(n => n.status === 0);
  if (typeFilter !== 'all') filtered = filtered.filter(n => n.notification_type === typeFilter);
  // Sort by created_at desc
  filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const top5 = filtered.slice(0, 5);

  // For lazy load in popup
  const lazyFiltered = filtered.slice(0, lazyCount);

  // Handle scroll to bottom in DialogContent for lazy load
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
  const handleRead = (id) => {
    const noti = notifications.find(n => n.notification_id === id);
    if (noti && noti.status === 0) {
      dispatch(updateNotificationData({ id, data: { ...noti, status: 1, read: true } }));
    }
  };
  const handleDelete = (id) => {
    dispatch(deleteNotificationData(id));
  };

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
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Tabs value={tab} onChange={handleTabChange}>
              <Tab label="All" />
              <Tab label="Unread" />
            </Tabs>
            <Select size="small" value={typeFilter} onChange={handleTypeChange} sx={{ minWidth: 180 }}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="jar_classification">Jar Classification</MenuItem>
              <MenuItem value="jar_confirmed">Jar Confirmed</MenuItem>
              <MenuItem value="jar_rejected">Jar Rejected</MenuItem>
              <MenuItem value="jar_warning">Jar Warning</MenuItem>
              <MenuItem value="goal_created">Goal Created</MenuItem>
              <MenuItem value="goal_progress">Goal Progress</MenuItem>
              <MenuItem value="goal_completed">Goal Completed</MenuItem>
              <MenuItem value="goal_failed">Goal Failed</MenuItem>
              <MenuItem value="goal_review_reminder">Goal Review Reminder</MenuItem>
              <MenuItem value="coaching_tip">Coaching Tip</MenuItem>
              <MenuItem value="coaching_warning">Coaching Warning</MenuItem>
              <MenuItem value="coaching_motivation">Coaching Motivation</MenuItem>
              <MenuItem value="transaction_alert">Transaction Alert</MenuItem>
              <MenuItem value="system_announcement">System Announcement</MenuItem>
              <MenuItem value="milestone_achieved">Milestone Achieved</MenuItem>
              <MenuItem value="reminder_contribution">Reminder Contribution</MenuItem>
              <MenuItem value="account_update_notice">Account Update Notice</MenuItem>
              <MenuItem value="security_alert">Security Alert</MenuItem>
            </Select>
          </Box>
          <List>
            {top5.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                There are no notifications.
              </Typography>
            )}
            {top5.map((noti, idx) => (
              <NotificationItem key={noti.notification_id} noti={noti} transactions={transactions} onRead={handleRead} onDelete={handleDelete} />
            ))}
          </List>
          {filtered.length > 5 && (
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
              <NotificationItem key={noti.notification_id} noti={noti} transactions={transactions} onRead={handleRead} onDelete={handleDelete} />
            ))}
          </List>
          {lazyFiltered.length < filtered.length && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" size="small" onClick={handleLoadMore}>Load more</Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter; 