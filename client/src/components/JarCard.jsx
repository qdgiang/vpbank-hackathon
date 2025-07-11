import React, { useState } from 'react';
import { Card, CardContent, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { motion } from 'framer-motion';

const JarCard = ({ jar, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedJar, setEditedJar] = useState(jar);

  const handleOpenDialog = () => {
    setEditedJar(jar);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    onUpdate(editedJar);
    handleCloseDialog();
  };

  const handleChange = (field) => (event) => {
    setEditedJar({
      ...editedJar,
      [field]: event.target.value
    });
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleOpenDialog}
      >
        <Card
          sx={{
            minWidth: 275,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: 4,
            '&:hover': {
              boxShadow: 6
            }
          }}
        >
          <CardContent>
            <Typography variant="h5" component="div">
              {jar.name}
            </Typography>
            <Typography sx={{ mb: 1.5 }} color="text.secondary">
              {jar.description}
            </Typography>
            <Typography variant="body2">
              Current Balance: {jar.currentBalance}
            </Typography>
            <Typography variant="body2">
              Target: {jar.target}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Edit Jar</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={editedJar.name}
            onChange={handleChange('name')}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={editedJar.description}
            onChange={handleChange('description')}
          />
          <TextField
            margin="dense"
            label="Target"
            type="number"
            fullWidth
            value={editedJar.target}
            onChange={handleChange('target')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}>Cancel</Button>
          <Button onClick={handleSave} sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JarCard; 