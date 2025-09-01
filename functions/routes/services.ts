import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeRoles, optionalAuthenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';
import { ServiceModel, UserModel, CategoryModel, createApiResponse, createPaginatedResponse } from '../models/firestore';
import { Service, SearchFilters } from '../models/types';

const router = express.Router();

// GET /api/services - Search and list services
router.get('/', 
  optionalAuthenticate,
  validate(schemas.serviceSearch, 'query'),
  asyncHandler(async (req, res) => {
    const {
      q,
      category,
      subcategory,
      location,
      priceRange,
      rating,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build search filters
    const filters: SearchFilters = {
      category,
      subcategory,
      location,
      priceRange,
      rating: rating ? Number(rating) : undefined,
      sortBy,
      sortOrder
    };

    // Get services from database
    let services = await ServiceModel.search(filters);

    // Apply text search if provided
    if (q) {
      const searchTerm = String(q).toLowerCase();
      services = services.filter(service => 
        service.title.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply price range filter
    if (priceRange) {
      services = services.filter(service => {
        const price = service.price.amount;
        return (!priceRange.min || price >= priceRange.min) &&
               (!priceRange.max || price <= priceRange.max);
      });
    }

    // Apply rating filter
    if (rating) {
      services = services.filter(service => 
        service.stats.averageRating >= Number(rating)
      );
    }

    // Apply location filter (distance-based)
    if (location) {
      services = services.filter(service => {
        if (!service.location.address?.coordinates) return false;
        
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          service.location.address.coordinates.latitude,
          service.location.address.coordinates.longitude
        );
        
        return distance <= location.radius;
      });
    }

    // Sort services
    services = sortServices(services, sortBy, sortOrder);

    // Increment view count for viewed services (if user is authenticated)
    if (req.user) {
      services.slice(0, Number(limit)).forEach(service => {
        ServiceModel.incrementViewCount(service.id).catch(console.error);
      });
    }

    // Apply pagination
    const total = services.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedServices = services.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedServices, Number(page), Number(limit), total);
    res.json(response);
  })
);

// GET /api/services/:serviceId - Get service details
router.get('/:serviceId', 
  optionalAuthenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    const service = await ServiceModel.findById(serviceId);
    if (!service || !service.isActive) {
      throw new NotFoundError('Service');
    }

    // Get provider information
    const provider = await UserModel.findById(service.providerId);
    if (!provider) {
      throw new NotFoundError('Provider');
    }

    // Increment view count
    if (req.user) {
      ServiceModel.incrementViewCount(serviceId).catch(console.error);
    }

    const serviceWithProvider = {
      ...service,
      provider: {
        id: provider.id,
        displayName: provider.displayName,
        photoURL: provider.photoURL,
        isVerified: provider.isVerified,
        stats: provider.stats,
        businessName: (provider as any).businessName,
        yearsOfExperience: (provider as any).yearsOfExperience
      }
    };

    res.json(createApiResponse(true, serviceWithProvider, 'Service details retrieved successfully'));
  })
);

// POST /api/services - Create new service (providers only)
router.post('/', 
  authenticate,
  authorizeRoles('provider'),
  validate(schemas.serviceCreate),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const provider = await UserModel.findById(req.user.uid);
    if (!provider || provider.role !== 'provider') {
      throw new ForbiddenError('Only verified providers can create services');
    }

    const serviceData: Partial<Service> = {
      ...req.body,
      providerId: req.user.uid
    };

    const service = await ServiceModel.create(serviceData);

    res.status(201).json(createApiResponse(true, service, 'Service created successfully'));
  })
);

// PUT /api/services/:serviceId - Update service
router.put('/:serviceId', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  validate(schemas.serviceUpdate),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service');
    }

    // Check if user owns the service or is admin
    if (service.providerId !== req.user.uid && req.user.role !== 'admin') {
      throw new ForbiddenError('You can only update your own services');
    }

    const updatedService = await ServiceModel.update(serviceId, req.body);

    res.json(createApiResponse(true, updatedService, 'Service updated successfully'));
  })
);

// DELETE /api/services/:serviceId - Delete service (soft delete)
router.delete('/:serviceId', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service');
    }

    // Check if user owns the service or is admin
    if (service.providerId !== req.user.uid && req.user.role !== 'admin') {
      throw new ForbiddenError('You can only delete your own services');
    }

    await ServiceModel.delete(serviceId);

    res.json(createApiResponse(true, null, 'Service deleted successfully'));
  })
);

// GET /api/services/categories - Get all service categories
router.get('/categories/list', 
  asyncHandler(async (req, res) => {
    const categories = await CategoryModel.findAll();
    res.json(createApiResponse(true, categories, 'Categories retrieved successfully'));
  })
);

// GET /api/services/:serviceId/similar - Get similar services
router.get('/:serviceId/similar', 
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    const { limit = 5 } = req.query;

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service');
    }

    // Find similar services by category and tags
    let similarServices = await ServiceModel.search({ 
      category: service.category,
      subcategory: service.subcategory 
    });

    // Remove the current service from results
    similarServices = similarServices.filter(s => s.id !== serviceId);

    // Sort by relevance (matching tags, rating, etc.)
    similarServices = similarServices.sort((a, b) => {
      const aTagMatches = a.tags.filter(tag => service.tags.includes(tag)).length;
      const bTagMatches = b.tags.filter(tag => service.tags.includes(tag)).length;
      
      if (aTagMatches !== bTagMatches) {
        return bTagMatches - aTagMatches;
      }
      
      return b.stats.averageRating - a.stats.averageRating;
    });

    // Limit results
    similarServices = similarServices.slice(0, Number(limit));

    res.json(createApiResponse(true, similarServices, 'Similar services retrieved successfully'));
  })
);

// POST /api/services/:serviceId/report - Report a service
router.post('/:serviceId/report', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      throw new ValidationError('Report reason is required');
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service');
    }

    // Create a report (this would typically go to an admin queue)
    const reportData = {
      serviceId,
      reporterId: req.user!.uid,
      reason,
      description,
      createdAt: admin.firestore.Timestamp.now(),
      status: 'pending'
    };

    // In a real implementation, you'd save this to a reports collection
    // await ReportModel.create(reportData);

    res.json(createApiResponse(true, null, 'Service reported successfully'));
  })
);

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function sortServices(services: Service[], sortBy: string, sortOrder: string): Service[] {
  return services.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case 'price':
        aVal = a.price.amount;
        bVal = b.price.amount;
        break;
      case 'rating':
        aVal = a.stats.averageRating;
        bVal = b.stats.averageRating;
        break;
      case 'popularity':
        aVal = a.stats.totalBookings + (a.stats.viewCount * 0.1);
        bVal = b.stats.totalBookings + (b.stats.viewCount * 0.1);
        break;
      case 'distance':
        // Would need location context for this
        aVal = 0;
        bVal = 0;
        break;
      default:
        aVal = a.createdAt;
        bVal = b.createdAt;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}

export default router;
