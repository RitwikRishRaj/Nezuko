"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';



interface ContactForm {
  subject: string;
  message: string;
}

const WriteToUsPage = () => {
  const { user } = useUser();
  const [form, setForm] = useState<ContactForm>({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Streamlined content moderation
  const offensiveWords = [
    'spam', 'scam', 'fake', 'fraud', 'hack', 'exploit',
    'stupid', 'idiot', 'hate', 'kill', 'die', 'death',
    'shit', 'fuck', 'bitch', 'damn', 'hell',
    'racist', 'nazi', 'porn', 'xxx', 'nsfw'
  ];

  const spamPatterns = [
    /(.)\1{4,}/g, // Repeated characters
    /[A-Z]{8,}/g, // Excessive caps
    /[!?]{3,}/g, // Multiple punctuation
    /(buy now|click here|free money|urgent|winner)/gi, // Commercial spam
    /(www\.|https?:\/\/|\.com|\.net)/gi, // URLs
    /\b\d{10,}\b/g, // Long numbers
    /@\w+/g, // Social handles
    /[!@#$%^&*]{5,}/g // Symbol spam
  ];



  // Streamlined content validation
  const validateContent = (text: string): { isValid: boolean; reason?: string } => {
    // Basic length validation
    if (text.length < 10) {
      return { isValid: false, reason: 'Please provide a more detailed message (at least 10 characters).' };
    }

    if (text.length > 1000) {
      return { isValid: false, reason: 'Message is too long. Please keep it under 1000 characters.' };
    }

    const lowerText = text.toLowerCase();

    // Check for offensive words
    for (const word of offensiveWords) {
      if (lowerText.includes(word)) {
        return { isValid: false, reason: 'Please keep your message professional and respectful.' };
      }
    }

    // Check for spam patterns
    for (const pattern of spamPatterns) {
      if (pattern.test(text)) {
        return { isValid: false, reason: 'Your message appears to contain spam-like content. Please write a clear, professional message.' };
      }
    }

    // Check for excessive repetition
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const wordCount = new Map();
    
    for (const word of words) {
      const cleanWord = word.toLowerCase();
      wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
    }

    for (const [, count] of wordCount) {
      if (count > Math.max(3, words.length / 4)) {
        return { isValid: false, reason: 'Please avoid excessive repetition in your message.' };
      }
    }

    return { isValid: true };
  };



  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Real-time validation for display
  const getFieldValidation = (field: keyof ContactForm) => {
    const value = form[field];
    if (!value.trim()) return { isValid: true, message: '' };
    
    const validation = validateContent(value);
    return {
      isValid: validation.isValid,
      message: validation.reason || ''
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Content moderation validation
    const subjectValidation = validateContent(form.subject);
    if (!subjectValidation.isValid) {
      toast.error(`Subject: ${subjectValidation.reason}`);
      return;
    }

    const messageValidation = validateContent(form.message);
    if (!messageValidation.isValid) {
      toast.error(`Message: ${messageValidation.reason}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user information
      const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'anonymous@example.com';
      const userName = user?.fullName || user?.firstName || null;
      const userClerkId = user?.id || null;

      // Determine priority based on content
      let priority = 'medium';
      const urgentKeywords = ['urgent', 'critical', 'broken', 'error', 'bug', 'crash', 'down'];
      const lowKeywords = ['suggestion', 'feature', 'enhancement', 'idea'];
      
      const lowerContent = (form.subject + ' ' + form.message).toLowerCase();
      if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
        priority = 'high';
      } else if (lowKeywords.some(keyword => lowerContent.includes(keyword))) {
        priority = 'low';
      }

      // Determine category based on content
      let category = 'other';
      if (lowerContent.includes('bug') || lowerContent.includes('error') || lowerContent.includes('broken')) {
        category = 'bug';
      } else if (lowerContent.includes('feature') || lowerContent.includes('suggestion') || lowerContent.includes('enhancement')) {
        category = 'feature';
      } else if (lowerContent.includes('question') || lowerContent.includes('how') || lowerContent.includes('help')) {
        category = 'question';
      } else if (lowerContent.includes('complaint') || lowerContent.includes('frustrated') || lowerContent.includes('unfair')) {
        category = 'complaint';
      }

      // Insert message into Supabase
      const messageData = {
        subject: form.subject.trim(),
        message: form.message.trim(),
        sender_email: userEmail,
        sender_name: userName,
        sender_clerk_id: userClerkId,
        priority: priority,
        category: category,
        is_read: false,
        is_starred: false
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        console.error('Database error:', error.message);
        throw new Error(`Failed to save message: ${error.message}`);
      }
      
      setSubmitted(true);
      toast.success('Message sent successfully!', {
        description: `Categorized as: ${category} • Priority: ${priority}`,
        duration: 4000
      });
      
      // Reset form
      setForm({
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting message:', error);
      
      // Provide specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('relation "public.messages" does not exist')) {
          toast.error('Database tables not set up. Please contact admin to run the setup SQL.');
        } else if (error.message.includes('permission denied')) {
          toast.error('Permission denied. Please check database permissions.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Failed to send message: ${error.message}`);
        }
      } else {
        toast.error('Failed to send message. Please try again or email us directly at algogym.dev@gmail.com');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Message Sent Successfully!</h1>
            <p className="text-white/60 mb-4">
              Thank you for reaching out! We've received your message and our team will review it shortly.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8 text-left">
              <h3 className="text-white font-medium mb-2">What happens next?</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Your message has been automatically categorized and prioritized</li>
                <li>• Our admin team will receive a real-time notification</li>
                <li>• We typically respond within 24 hours during business days</li>
                <li>• You can also reach us directly at algogym.dev@gmail.com</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-3 bg-purple-400 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Send Another Message
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-purple-400"
            >
              <path 
                d="M10.5502 3C6.69782 3.00694 4.6805 3.10152 3.39128 4.39073C2 5.78202 2 8.02125 2 12.4997C2 16.9782 2 19.2174 3.39128 20.6087C4.78257 22 7.0218 22 11.5003 22C15.9787 22 18.218 22 19.6093 20.6087C20.8985 19.3195 20.9931 17.3022 21 13.4498" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M11.0556 13C10.3322 3.86635 16.8023 1.27554 21.9805 2.16439C22.1896 5.19136 20.7085 6.32482 17.8879 6.84825C18.4326 7.41736 19.395 8.13354 19.2912 9.02879C19.2173 9.66586 18.7846 9.97843 17.9194 10.6036C16.0231 11.9736 13.8264 12.8375 11.0556 13Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M9 17C11 11.5 12.9604 9.63636 15 8" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Write to Us
          </h1>
          <p className="text-white/60">
            Have a question, suggestion, or found a bug? We'd love to hear from you!
          </p>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-white/80 font-medium mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Brief description of your message"
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  form.subject && !getFieldValidation('subject').isValid
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-white/10 focus:ring-purple-400'
                }`}
                required
              />
              {form.subject && !getFieldValidation('subject').isValid && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {getFieldValidation('subject').message}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-white/80 font-medium mb-2">
                Message *
              </label>
              <textarea
                value={form.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Please provide as much detail as possible..."
                rows={6}
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
                  form.message && !getFieldValidation('message').isValid
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-white/10 focus:ring-purple-400'
                }`}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <div>
                  {form.message && !getFieldValidation('message').isValid && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {getFieldValidation('message').message}
                    </div>
                  )}
                </div>
                <div className={`text-sm ${form.message.length > 900 ? 'text-yellow-400' : 'text-white/40'}`}>
                  {form.message.length}/1000
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-center">
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !form.subject.trim() || 
                  !form.message.trim() ||
                  !getFieldValidation('subject').isValid ||
                  !getFieldValidation('message').isValid
                }
                className="px-8 py-3 bg-purple-400 hover:bg-purple-500 disabled:bg-purple-400/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending & Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Enhanced Content Guidelines */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-2">Content Guidelines</p>
                <div className="text-blue-200/80 space-y-1">
                  <p>• Keep messages professional, respectful, and constructive</p>
                  <p>• Avoid offensive language, spam, or promotional content</p>
                  <p>• Use standard language (avoid excessive caps, symbols, or character substitutions)</p>
                  <p>• Provide specific details about your inquiry or feedback</p>
                  <p>• Messages are automatically screened for quality and appropriateness</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="text-center text-white/60">
              <p className="text-sm">
                You can also reach us directly at{' '}
                <a href="mailto:algogym.dev@gmail.com" className="text-purple-400 hover:text-purple-300 transition-colors">
                  algogym.dev@gmail.com
                </a>
              </p>
              <p className="text-xs mt-2 text-white/40">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WriteToUsPage;