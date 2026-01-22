const strideModel = require('../models/strideModel');

/**
 * STRIDE Controller
 * Handles STRIDE category reference data operations
 * STRIDE is a threat modeling framework with 6 categories:
 * - Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
 */

const strideController = {
  /**
   * Get all STRIDE categories
   * GET /api/stride/categories
   * Public endpoint - returns reference data
   */
  async getStrideCategories(req, res) {
    try {
      // Get all STRIDE categories (6 categories with descriptions)
      const categories = await strideModel.getAllStrideCategories();

      res.status(200).json({
        success: true,
        message: 'STRIDE categories retrieved successfully',
        data: {
          totalCategories: categories.length,
          categories
        }
      });
    } catch (error) {
      console.error('Error retrieving STRIDE categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve STRIDE categories',
        error: error.message
      });
    }
  },

  /**
   * Get a specific STRIDE category by ID
   * GET /api/stride/categories/:id
   */
  async getStrideCategoryById(req, res) {
    try {
      const categoryId = parseInt(req.params.id);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }

      const category = await strideModel.getStrideCategoryById(categoryId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'STRIDE category not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'STRIDE category retrieved successfully',
        data: category
      });
    } catch (error) {
      console.error('Error retrieving STRIDE category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve STRIDE category',
        error: error.message
      });
    }
  },

  /**
   * Get a STRIDE category by code (S, T, R, I, D, E)
   * GET /api/stride/categories/code/:code
   */
  async getStrideCategoryByCode(req, res) {
    try {
      const code = req.params.code;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Valid category code is required'
        });
      }

      const category = await strideModel.getStrideCategoryByCode(code);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'STRIDE category not found for the provided code'
        });
      }

      res.status(200).json({
        success: true,
        message: 'STRIDE category retrieved successfully',
        data: category
      });
    } catch (error) {
      console.error('Error retrieving STRIDE category by code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve STRIDE category',
        error: error.message
      });
    }
  },

  /**
   * Get STRIDE categories with threat counts for organization
   * GET /api/stride/categories/with-counts
   * Requires authentication
   */
  async getStrideCategoriesWithCounts(req, res) {
    try {
      const organizationId = req.user.organizationId;

      const categories = await strideModel.getStrideCategoriesWithCounts(organizationId);

      res.status(200).json({
        success: true,
        message: 'STRIDE categories with threat counts retrieved successfully',
        data: {
          organizationId,
          totalCategories: categories.length,
          categories
        }
      });
    } catch (error) {
      console.error('Error retrieving STRIDE categories with counts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve STRIDE categories with counts',
        error: error.message
      });
    }
  }
};

module.exports = strideController;
