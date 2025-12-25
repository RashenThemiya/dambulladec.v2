const express = require('express');
const multer = require('multer');
const Publication = require('../models/Publication');
const { authenticateUser, authorizeRole } = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

/**
 * 🔓 Public Access Routes
 */

// Get all publications (public)
router.get('/', async (req, res) => {
  try {
    const publications = await Publication.findAll();

    const formatted = publications.map(pub => ({
      ...pub.toJSON(),
      image: pub.image ? `data:image/jpeg;base64,${pub.image.toString('base64')}` : null
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching publications', error: err.message });
  }
});

// Get single publication by ID (public)
router.get('/:publicationId', async (req, res) => {
  try {
    const publication = await Publication.findByPk(req.params.publicationId);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    const formatted = {
      ...publication.toJSON(),
      image: publication.image ? `data:image/jpeg;base64,${publication.image.toString('base64')}` : null
    };

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching publication', error: err.message });
  }
});


/**
 * 🔒 Admin/Superadmin Routes
 */

// Add new publication
router.post('/', authenticateUser, authorizeRole(['admin', 'superadmin']), upload.single('image'), async (req, res) => {
  const { type, topic, description } = req.body;
  const image = req.file ? req.file.buffer : null;

  if (!type || !topic || !description) {
    return res.status(400).json({ message: 'Type, topic, and description are required.' });
  }

  try {
    const newPublication = await Publication.create({ type, topic, description, image });
    res.status(201).json({ message: 'Publication added successfully', publicationId: newPublication.id });
  } catch (err) {
    res.status(500).json({ message: 'Error adding publication', error: err.message });
  }
});

// Update publication
router.put('/:publicationId', authenticateUser, authorizeRole(['admin', 'superadmin']), upload.single('image'), async (req, res) => {
  const { type, topic, description } = req.body;
  const image = req.file ? req.file.buffer : null;

  if (!type || !topic || !description) {
    return res.status(400).json({ message: 'Type, topic, and description are required.' });
  }

  try {
    const publication = await Publication.findByPk(req.params.publicationId);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    await publication.update({ type, topic, description, ...(image && { image }) });

    res.status(200).json({ message: 'Publication updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating publication', error: err.message });
  }
});

// Delete publication
router.delete('/:publicationId', authenticateUser, authorizeRole([ 'superadmin']), async (req, res) => {
  try {
    const publication = await Publication.findByPk(req.params.publicationId);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    await publication.destroy();
    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting publication', error: err.message });
  }
});

module.exports = router;
