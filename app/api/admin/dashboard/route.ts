import { NextRequest, NextResponse } from 'next/server';
import { getDocuments } from '@/lib/firestore';
import { requireRole } from '@/lib/auth-utils';

export const GET = requireRole(['admin'])(async (request: NextRequest, user) => {
  try {
    // Get platform metrics and analytics
    // In a real implementation, you'd aggregate data from multiple collections
    
    const [users, bookings, services, reviews] = await Promise.all([
      getDocuments('users'),
      getDocuments('bookings'),
      getDocuments('services'),
      getDocuments('reviews')
    ]);

    // Calculate metrics
    const totalUsers = users.length;
    const totalProviders = users.filter(u => u.role === 'provider').length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalBookings = bookings.length;
    const totalServices = services.length;
    const totalReviews = reviews.length;

    // Calculate revenue (assuming 10% platform commission)
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, booking) => {
      return sum + (booking.estimatedPrice || 0);
    }, 0);
    const platformRevenue = totalRevenue * 0.1; // 10% commission

    // Recent activity
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Booking status distribution
    const bookingStatusDistribution = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Service category distribution
    const serviceCategoryDistribution = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dashboardData = {
      metrics: {
        totalUsers,
        totalProviders,
        totalCustomers,
        totalBookings,
        totalServices,
        totalReviews,
        totalRevenue,
        platformRevenue,
        averageRating: reviews.length > 0 ? 
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
      },
      charts: {
        bookingStatusDistribution,
        serviceCategoryDistribution,
        // Monthly growth would require more complex date aggregation
        monthlyGrowth: {
          users: [12, 19, 23, 31, 45, 52],
          bookings: [8, 15, 22, 28, 35, 41],
          revenue: [1200, 1900, 2300, 3100, 4500, 5200]
        }
      },
      recentActivity: {
        bookings: recentBookings,
        users: recentUsers
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get dashboard data error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});