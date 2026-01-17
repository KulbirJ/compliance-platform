const { query, validationResult } = require('express-validator');
const nistCsfModel = require('../models/nistCsfModel');

/**
 * NIST CSF Controller
 * Serves NIST Cybersecurity Framework reference data (read-only)
 */

const nistCsfController = {
  /**
   * Get all NIST CSF functions
   * @route GET /api/nist-csf/functions
   * @access Public
   */
  async getFunctions(req, res, next) {
    try {
      const functions = await nistCsfModel.getAllFunctions();

      res.json({
        success: true,
        data: {
          count: functions.length,
          functions: functions.map(func => ({
            id: func.id,
            code: func.code,
            name: func.name,
            description: func.description,
            categoryCount: func.category_count || 0,
            controlCount: func.control_count || 0
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get NIST CSF categories
   * Optionally filtered by function ID
   * @route GET /api/nist-csf/categories?functionId=1
   * @access Public
   */
  async getCategories(req, res, next) {
    try {
      const functionId = req.query.functionId ? parseInt(req.query.functionId) : null;

      let categories;

      if (functionId) {
        // Validate function ID
        if (isNaN(functionId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid function ID'
          });
        }

        // Get categories for specific function
        categories = await nistCsfModel.getCategoriesByFunction(functionId);

        if (categories.length === 0) {
          // Check if function exists
          const functions = await nistCsfModel.getAllFunctions();
          const functionExists = functions.some(f => f.id === functionId);

          if (!functionExists) {
            return res.status(404).json({
              success: false,
              message: 'Function not found'
            });
          }
        }
      } else {
        // Get all categories across all functions
        const result = await nistCsfModel.getAllCategoriesWithFunctions();
        categories = result;
      }

      res.json({
        success: true,
        data: {
          count: categories.length,
          functionId: functionId,
          categories: categories.map(cat => ({
            id: cat.id,
            code: cat.code,
            name: cat.name,
            description: cat.description,
            functionId: cat.function_id,
            functionCode: cat.function_code,
            functionName: cat.function_name,
            controlCount: cat.control_count || 0
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get NIST CSF controls
   * Optionally filtered by category ID
   * @route GET /api/nist-csf/controls?categoryId=1&page=1&limit=20
   * @access Public
   */
  async getControls(req, res, next) {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;

      // Validate parameters
      if (categoryId && isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }

      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page number'
        });
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 100)'
        });
      }

      let controls;
      let totalCount;

      if (categoryId) {
        // Get controls for specific category
        controls = await nistCsfModel.getControlsByCategory(categoryId);

        if (controls.length === 0) {
          // Check if category exists
          const allCategories = await nistCsfModel.getAllCategoriesWithFunctions();
          const categoryExists = allCategories.some(c => c.id === categoryId);

          if (!categoryExists) {
            return res.status(404).json({
              success: false,
              message: 'Category not found'
            });
          }
        }

        totalCount = controls.length;

        // Apply pagination
        const offset = (page - 1) * limit;
        controls = controls.slice(offset, offset + limit);
      } else {
        // Get all controls with pagination
        const result = await nistCsfModel.getAllControls({ page, limit });
        controls = result.controls;
        totalCount = result.total;
      }

      res.json({
        success: true,
        data: {
          count: controls.length,
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalCount / limit),
          categoryId: categoryId,
          controls: controls.map(ctrl => ({
            id: ctrl.id,
            code: ctrl.code,
            name: ctrl.name,
            description: ctrl.description,
            guidance: ctrl.guidance,
            importance: ctrl.importance,
            categoryId: ctrl.category_id,
            categoryCode: ctrl.category_code,
            categoryName: ctrl.category_name,
            functionId: ctrl.function_id,
            functionCode: ctrl.function_code,
            functionName: ctrl.function_name
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get complete NIST CSF framework hierarchy
   * Returns functions with nested categories and controls
   * @route GET /api/nist-csf/framework
   * @access Public
   */
  async getFullFramework(req, res, next) {
    try {
      // Option 1: Use the complete hierarchy function from model
      const hierarchy = await nistCsfModel.getCompleteHierarchy();

      // Calculate statistics
      const stats = {
        totalFunctions: hierarchy.length,
        totalCategories: hierarchy.reduce((sum, func) => sum + func.categories.length, 0),
        totalControls: hierarchy.reduce((sum, func) => 
          sum + func.categories.reduce((catSum, cat) => catSum + cat.controls.length, 0), 0
        )
      };

      res.json({
        success: true,
        data: {
          version: 'NIST CSF v1.1',
          lastUpdated: '2018-04-16',
          statistics: stats,
          framework: hierarchy.map(func => ({
            id: func.id,
            code: func.code,
            name: func.name,
            description: func.description,
            categories: func.categories.map(cat => ({
              id: cat.id,
              code: cat.code,
              name: cat.name,
              description: cat.description,
              controls: cat.controls.map(ctrl => ({
                id: ctrl.id,
                code: ctrl.code,
                name: ctrl.name,
                description: ctrl.description,
                guidance: ctrl.guidance,
                importance: ctrl.importance
              }))
            }))
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get specific control by ID
   * @route GET /api/nist-csf/controls/:id
   * @access Public
   */
  async getControlById(req, res, next) {
    try {
      const controlId = parseInt(req.params.id);

      if (isNaN(controlId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid control ID'
        });
      }

      const control = await nistCsfModel.getControlById(controlId);

      if (!control) {
        return res.status(404).json({
          success: false,
          message: 'Control not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: control.id,
          code: control.code,
          name: control.name,
          description: control.description,
          guidance: control.guidance,
          importance: control.importance,
          category: {
            id: control.category_id,
            code: control.category_code,
            name: control.category_name,
            description: control.category_description
          },
          function: {
            id: control.function_id,
            code: control.function_code,
            name: control.function_name,
            description: control.function_description
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search controls by keyword
   * @route GET /api/nist-csf/search?q=authentication&page=1&limit=20
   * @access Public
   */
  async searchControls(req, res, next) {
    try {
      const keyword = req.query.q;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;

      if (!keyword || keyword.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search keyword is required'
        });
      }

      if (keyword.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Search keyword must be at least 3 characters'
        });
      }

      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page number'
        });
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 100)'
        });
      }

      const results = await nistCsfModel.searchControls(keyword, { page, limit });

      res.json({
        success: true,
        data: {
          keyword: keyword,
          count: results.controls.length,
          total: results.total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(results.total / limit),
          controls: results.controls.map(ctrl => ({
            id: ctrl.id,
            code: ctrl.code,
            name: ctrl.name,
            description: ctrl.description,
            guidance: ctrl.guidance,
            importance: ctrl.importance,
            category: {
              id: ctrl.category_id,
              code: ctrl.category_code,
              name: ctrl.category_name
            },
            function: {
              id: ctrl.function_id,
              code: ctrl.function_code,
              name: ctrl.function_name
            }
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = nistCsfController;
