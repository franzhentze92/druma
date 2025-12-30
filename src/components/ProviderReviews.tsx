import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, User, Calendar, Filter, TrendingUp, MessageSquare } from 'lucide-react';

interface ProviderReview {
  id: string;
  provider_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
  auth_users?: {
    email: string;
  };
  profiles?: {
    full_name?: string;
    phone?: string;
  };
}


const ProviderReviews: React.FC = () => {
  const { user } = useAuth();
  const [providerReviews, setProviderReviews] = useState<ProviderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // First, get the provider ID from the providers table using user_id
        const { data: providerData, error: providerLookupError } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (providerLookupError) {
          console.error('Error looking up provider:', providerLookupError);
          setProviderReviews([]);
          return;
        }

        // Fetch provider reviews using the correct provider ID
        const { data: providerReviewsData, error: providerError } = await supabase
          .from('provider_reviews')
          .select(`
            *,
            auth_users!provider_reviews_client_id_fkey (
              email
            ),
            profiles!provider_reviews_client_id_fkey (
              full_name,
              phone
            )
          `)
          .eq('provider_id', providerData.id)
          .order('created_at', { ascending: false });

        if (providerError) {
          console.error('Error fetching provider reviews:', providerError);
          throw providerError;
        }

        console.log('Fetched provider reviews:', providerReviewsData);
        setProviderReviews(providerReviewsData || []);

      } catch (error) {
        console.error('Error fetching reviews:', error);
        setProviderReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOverallRating = () => {
    if (providerReviews.length === 0) return { average: 0, count: 0 };
    
    const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      average: totalRating / providerReviews.length,
      count: providerReviews.length
    };
  };

  const overallRating = getOverallRating();

  // Filter reviews by rating
  const filteredReviews = ratingFilter === 'all' 
    ? providerReviews 
    : providerReviews.filter(review => review.rating === parseInt(ratingFilter));

  // Calculate rating distribution
  const ratingDistribution = {
    5: providerReviews.filter(r => r.rating === 5).length,
    4: providerReviews.filter(r => r.rating === 4).length,
    3: providerReviews.filter(r => r.rating === 3).length,
    2: providerReviews.filter(r => r.rating === 2).length,
    1: providerReviews.filter(r => r.rating === 1).length,
  };

  // Get client name for display
  const getClientName = (review: ProviderReview) => {
    if (review.profiles?.full_name) {
      return review.profiles.full_name;
    }
    if (review.auth_users?.email) {
      return review.auth_users.email.split('@')[0];
    }
    return 'Usuario Anónimo';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reseñas Recibidas</h1>
        <p className="text-gray-600">Gestiona las reseñas de tus clientes</p>
      </div>

      {/* Overall Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Calificación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-5xl font-bold ${getRatingColor(overallRating.average)}`}>
                {overallRating.average > 0 ? overallRating.average.toFixed(1) : '0.0'}
              </div>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(overallRating.average)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Basado en {overallRating.count} {overallRating.count === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Distribución de Calificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = overallRating.count > 0 ? (count / overallRating.count) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total de Reseñas</p>
                <p className="text-2xl font-bold text-gray-900">{overallRating.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reseñas con Comentarios</p>
                <p className="text-2xl font-bold text-gray-900">
                  {providerReviews.filter(r => r.comment && r.comment.trim().length > 0).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Calificación Más Alta</p>
                <p className="text-2xl font-bold text-green-600">
                  {providerReviews.length > 0 ? Math.max(...providerReviews.map(r => r.rating)) : 0}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Reseñas de Clientes ({filteredReviews.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por calificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las calificaciones</SelectItem>
                  <SelectItem value="5">5 estrellas</SelectItem>
                  <SelectItem value="4">4 estrellas</SelectItem>
                  <SelectItem value="3">3 estrellas</SelectItem>
                  <SelectItem value="2">2 estrellas</SelectItem>
                  <SelectItem value="1">1 estrella</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {providerReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No hay reseñas aún</p>
              <p className="text-sm">Las reseñas de tus clientes aparecerán aquí</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay reseñas con la calificación seleccionada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {getClientName(review).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            {getClientName(review)}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              review.rating >= 4 
                                ? 'border-green-500 text-green-700 bg-green-50' 
                                : review.rating >= 3
                                ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                                : 'border-red-500 text-red-700 bg-red-50'
                            }`}
                          >
                            {review.rating}/5
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(review.created_at)}
                        </div>
                      </div>
                      {review.comment && review.comment.trim().length > 0 ? (
                        <p className="text-gray-700 mb-2 leading-relaxed">{review.comment}</p>
                      ) : (
                        <p className="text-gray-400 italic text-sm">Sin comentario</p>
                      )}
                      {review.profiles?.phone && (
                        <p className="text-xs text-gray-500 mt-2">
                          Contacto: {review.profiles.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default ProviderReviews;
