'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Star, MessageSquare, TrendingUp, Award, User, Quote, CheckCircle, AlertTriangle } from 'lucide-react';

interface Review {
  rating: number;
  comment: string;
  created_at: string;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string|undefined>();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('view_latest_reviews')
        .select('*');
      
      if (error) {
        console.error('❌ Reviews error:', error);
        setErrorMsg(error.message);
      } else {
        setReviews(data as Review[]);
      }
      setIsLoading(false);
    })();
  }, []);

  const acknowledgeReview = async (rating: number, comment: string, created_at: string) => {
    try {
      // Find matching reviews in the reviews table
      const { data, error: findError } = await supabase
        .from('reviews')
        .select('id')
        .match({ 
          rating,
          comment,
          created_at
        })
        .limit(1);
      
      if (findError) {
        console.error('❌ Find review error:', findError);
        alert(`Error finding review: ${findError.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ Review not found for acknowledgment');
        alert('Could not find the review to acknowledge');
        return;
      }
      
      // Update the review with acknowledged = true
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ acknowledged: true })
        .eq('id', data[0].id);
        
      if (updateError) {
        console.error('❌ Acknowledge review error:', updateError);
        alert(`Error acknowledging review: ${updateError.message}`);
        return;
      }
      
      // Remove the review from the list
      setReviews(reviews.filter(
        r => !(r.rating === rating && r.comment === comment && r.created_at === created_at)
      ));
    } catch (err) {
      console.error('Error acknowledging review:', err);
    }
  };

  const renderStars = (rating: number, animated: boolean = false) => {
    return (
      <div className="flex items-center space-x-1">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Star 
              key={i} 
              className={`h-5 w-5 transition-all duration-300 ${
                i < rating 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300'
              } ${animated ? 'hover:scale-110' : ''}`}
              style={animated ? { animationDelay: `${i * 100}ms` } : {}}
            />
          ))}
      </div>
    );
  };

  const getReviewSentiment = (rating: number) => {
    if (rating >= 4) {
      return {
        label: 'Positive',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle
      };
    } else if (rating >= 3) {
      return {
        label: 'Neutral',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Star
      };
    } else {
      return {
        label: 'Needs Attention',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle
      };
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  if (errorMsg) {
    return (
      <div className="enterprise-kpi-card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-h3 text-gray-900">Latest Reviews</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-kpi-card group">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-h3 text-gray-900 font-semibold">Latest Reviews</h3>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-gray-600">
                {reviews.length === 0 ? 'No reviews yet' : `${reviews.length} recent reviews`}
              </p>
              {reviews.length > 0 && (
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(getAverageRating()))}
                  <span className="text-sm font-medium text-gray-700">
                    {getAverageRating().toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {reviews.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Customer feedback</span>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-4 h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Reviews List */}
      {!isLoading && (
        <div className="space-y-4">
          {reviews.map((review, index) => {
            const sentiment = getReviewSentiment(review.rating);
            const SentimentIcon = sentiment.icon;
            
            return (
              <div 
                key={index}
                className="group/review relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-1px]"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    
                    {/* Review Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {renderStars(review.rating, true)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${sentiment.color}`}>
                          <SentimentIcon className="h-3 w-3 mr-1" />
                          {sentiment.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(parseISO(review.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Acknowledge Button */}
                  <button 
                    onClick={() => acknowledgeReview(review.rating, review.comment, review.created_at)}
                    className="opacity-0 group-hover/review:opacity-100 transition-all duration-200 inline-flex items-center space-x-2 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Acknowledge</span>
                  </button>
                </div>
                
                {/* Review Comment */}
                <div className="relative">
                  <Quote className="absolute -top-1 -left-1 h-6 w-6 text-gray-300" />
                  <blockquote className="pl-6 text-gray-700 italic leading-relaxed">
                    "{review.comment}"
                  </blockquote>
                </div>
                
                {/* Rating Indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover/review:opacity-100 transition-opacity">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    review.rating >= 4 ? 'bg-green-500' :
                    review.rating >= 3 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {review.rating}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Empty State */}
          {reviews.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-10 w-10 text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h4>
              <p className="text-gray-600 text-sm mb-4">Customer reviews will appear here once you start receiving feedback.</p>
              <div className="inline-flex items-center text-sm text-yellow-600 font-medium">
                <Star className="h-4 w-4 mr-1" />
                Ready to collect feedback
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Review Summary */}
      {reviews.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Average rating: <span className="font-semibold text-gray-900">{getAverageRating().toFixed(1)}/5</span>
              </div>
              <div className="flex items-center space-x-1">
                {renderStars(Math.round(getAverageRating()))}
              </div>
            </div>
            <div className="inline-flex items-center text-sm text-yellow-600 font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              {reviews.filter(r => r.rating >= 4).length} positive reviews
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 