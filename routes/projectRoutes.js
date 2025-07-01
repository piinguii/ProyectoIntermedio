const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    createProject,
    updateProject,
    getAllProjects,
    getProjectById,
    archiveProject,
    deleteProject,
    getArchivedProjects,  
    unarchiveProject
} = require('../controllers/projectController');
const { validateCreateProject } = require('../validators/projectValidator');

router.post('/', auth, validateCreateProject, createProject);
router.put('/:id', auth, validateCreateProject, updateProject);
router.get('/', auth, getAllProjects);

router.get('/archived', auth, getArchivedProjects);
router.get('/:id', auth, getProjectById);


router.patch('/:id/archive', auth, archiveProject);
router.delete('/:id', auth, deleteProject);
router.patch('/:id/unarchive', auth, unarchiveProject);


module.exports = router;
