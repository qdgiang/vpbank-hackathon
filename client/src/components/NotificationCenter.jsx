import React, { useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useSwipeable } from 'react-swipeable';

function NotificationItem({ noti, onRead, onDelete }) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const threshold = 100;
  const ref = useRef();

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Left') {
        setIsSwiping(true);
        setTranslateX(Math.max(-e.deltaX, -150));
      }
    },
    onSwipedLeft: (e) => {
      if (e.absX > threshold) {
        onDelete(noti.id);
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
        key={noti.id}
        sx={{
          borderRadius: 2,
          mb: 1,
          background: noti.read ? '#f5f5f5' : `rgba(227,242,253,${1 - Math.min(Math.abs(translateX)/150, 0.7)})`,
          cursor: 'pointer',
          transition: isSwiping ? 'none' : 'background 0.2s, transform 0.2s',
          transform: `translateX(${translateX}px)`,
          boxShadow: translateX < -10 ? '0 2px 12px #f4433622' : '0 1px 4px #0001',
          '&:active': { background: '#bbdefb' }
        }}
        onClick={() => !noti.read && onRead(noti.id)}
      >
        <ListItemText
          primary={noti.title}
          secondary={noti.content}
          primaryTypographyProps={{ fontWeight: noti.read ? 'normal' : 'bold' }}
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

const NotificationCenter = ({ notifications, onRead, onDelete }) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001', mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Icon icon="solar:bell-bold-duotone" style={{ color: '#015aad', fontSize: 28 }} />
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
          {notifications.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                There are no notification.
            </Typography>
          )}
          {notifications.map((noti, idx) => (
            <NotificationItem key={noti.id || idx} noti={noti} onRead={onRead} onDelete={onDelete} />
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter; 